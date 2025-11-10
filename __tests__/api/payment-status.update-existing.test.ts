/**
 * @jest-environment node
 */

import { POST } from '@/app/api/payment-status/route';
import { promises as fs } from 'fs';
import { NextRequest } from 'next/server';
import path from 'path';

/**
 * This test targets the update branch in storePaymentData (existingIndex >= 0)
 * by posting the same transaction_id twice with different fields. It asserts that:
 *  - Both POST calls succeed (201)
 *  - The stored payments file contains exactly one entry for the transaction_id
 *  - The second POST overwrites (updates) the first entry's amount & description
 *
 * We avoid asserting total file length because other tests may have written data.
 */
describe('/api/payment-status update existing payment branch', () => {
  const txnId = `txn_update_branch_${Date.now()}`; // unique per test run
  const filePath = path.join(process.cwd(), 'data', 'payments.json');

  // Helper to build a NextRequest for POST
  const buildRequest = (body: Record<string, any>) =>
    new NextRequest('http://localhost/api/payment-status', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    } as any);

  it('creates then updates the same transaction_id (covers existingIndex >= 0 branch)', async () => {
    // First create
    const firstReq = buildRequest({
      transaction_id: txnId,
      payment_status: 'successful',
      payment_date: new Date().toISOString(),
      description: 'initial store',
      amount: 10,
    });
    const firstRes = await POST(firstReq);
    expect(firstRes.status).toBe(201);

    // Second update with new amount & description
    const secondReq = buildRequest({
      transaction_id: txnId,
      payment_status: 'successful',
      payment_date: new Date().toISOString(),
      description: 'updated store',
      amount: 25,
    });
    const secondRes = await POST(secondReq);
    expect(secondRes.status).toBe(201);

    // Read persisted payments and verify update (no duplicate entries for txnId)
    let fileContent = '';
    try {
      fileContent = await fs.readFile(filePath, 'utf-8');
    } catch (e) {
      // If file unexpectedly missing, fail fast
      throw new Error('payments.json not found after POST operations');
    }

    const payments = JSON.parse(fileContent) as Array<Record<string, any>>;
    // Filter for just our transaction
    const matching = payments.filter(p => p.transaction_id === txnId);
    expect(matching.length).toBe(1); // ensure updated in-place
    expect(matching[0].amount).toBe(25);
    expect(matching[0].description).toBe('updated store');
  });
});
