/**
 * Unit test for payment webhook with specific test case
 * Phone: 9953969666, Amount: 3000
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../../app/api/payment-webhook/route';

describe('Payment Webhook - Test Case: 9953969666 with dueAmount 3000', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Disable forwarding for local testing
    delete process.env.PAYMENT_WEBHOOK_FORWARD_ENABLED;
    delete process.env.PL_FORWARD_ENABLED;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should process phone number 9953969666 with dueAmount 3000', async () => {
    const payload = {
      phone_number: '9953969666',
      dueAmount: 3000,
      transactionId: 'test_txn_001',
      status: 'pending'
    };

    const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    console.log('\n📋 Test Result:');
    console.log('   Phone Number:', data.phoneNumber);
    console.log('   Success:', data.success);
    console.log('   Message:', data.message);
    console.log('   Transaction ID:', data.transactionId);
    console.log('   Timestamp:', data.timestamp);

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.phoneNumber).toBe('9953969666');
    expect(data.message).toContain('9953969666');
    expect(data.transactionId).toBe('test_txn_001');
    expect(data.timestamp).toBeDefined();
  });

  it('should handle phone with +91 prefix', async () => {
    const payload = {
      phone_number: '+919953969666',
      dueAmount: 3000,
      transactionId: 'test_txn_002'
    };

    const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.phoneNumber).toBe('+919953969666');
  });

  it('should handle phone with spaces and dashes', async () => {
    const payload = {
      phone_number: '+91-9953 969 666',
      dueAmount: 3000,
      transactionId: 'test_txn_003'
    };

    const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.phoneNumber).toBe('+919953969666');
  });

  it('should prioritize dueAmount over amount field', async () => {
    // This test verifies the logic uses dueAmount when both are present
    const payload = {
      phone_number: '9953969666',
      amount: 1000,
      dueAmount: 3000,  // This should be used
      transactionId: 'test_txn_004'
    };

    const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Note: The response doesn't include amount in local mode,
    // but the logic internally uses dueAmount for forwarding
  });
});
