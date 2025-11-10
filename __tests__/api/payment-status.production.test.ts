/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/payment-status/route';

// Helper to build NextRequest
const buildRequest = (url: string, method: string, body?: any) => new NextRequest(url, {
  method,
  ...(body ? { body: JSON.stringify(body) } : {}),
  headers: { 'Content-Type': 'application/json' }
});

describe('payment-status production storage branches', () => {
  const originalEnv = process.env;
  const fsPromises = require('fs').promises;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' }; // force production path (/tmp)
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('POST should write to /tmp/payments.json in production (new payment path)', async () => {
    // Mock readFile to simulate empty/non-existent file so branch returns []
    jest.spyOn(fsPromises, 'readFile').mockRejectedValueOnce(new Error('ENOENT'));
    const writeSpy = jest.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);

    const paymentData = {
      transaction_id: 'prod_txn_1',
      payment_status: 'successful',
      payment_date: '2025-11-10T00:00:00.000Z',
      description: 'Prod path write',
      amount: 42
    };

    const req = buildRequest('http://localhost:3000/api/payment-status', 'POST', paymentData);
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toBe('Payment data stored successfully');
    expect(writeSpy).toHaveBeenCalled();
    // First arg to writeFile should be /tmp/payments.json (POSIX path in production branch)
  const writePath = ((writeSpy.mock.calls[0] as unknown) as any[])[0] as string;
  expect(typeof writePath).toBe('string');
  // Windows may normalize '/tmp' differently; accept any path segment containing 'tmp' and ending with 'payments.json'
  expect(writePath.replace(/\\/g, '/').endsWith('/tmp/payments.json') || /tmp[\/]/i.test(writePath)).toBe(true);
  });

  it('GET should attempt to read /tmp/payments.json and return 404 when not found', async () => {
    // Force readFile to throw so readPaymentData returns [] and lookup returns null
    jest.spyOn(fsPromises, 'readFile').mockRejectedValueOnce(new Error('ENOENT'));

    const req = buildRequest('http://localhost:3000/api/payment-status?transaction_id=missing_prod', 'GET');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.message).toBe('Payment data not found');
  });
});
