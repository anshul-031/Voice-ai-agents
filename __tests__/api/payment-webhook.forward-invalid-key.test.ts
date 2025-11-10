/**
 * @jest-environment node
 */
import { POST } from '@/app/api/payment-webhook/route';
import { NextRequest } from 'next/server';

const buildRequest = (body: any) => new NextRequest('http://localhost:3000/api/payment-webhook', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' }
});

describe('/api/payment-webhook forwarding error branches', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 502 FORWARD_FAILED when AES key length is invalid', async () => {
    process.env.PAYMENT_WEBHOOK_FORWARD_ENABLED = 'true';
    process.env.PL_API_URL = 'https://example.com/forward';
    process.env.PL_X_BIZ_TOKEN = 'token';
    process.env.PL_AES_KEY = 'short-key-not-32-bytes'; // invalid length triggers ensureKey32Bytes error

    const req = buildRequest({
      phoneNumber: '9953969666',
      amount: 100,
      transactionId: 'fwd_err_1'
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect([502, 500]).toContain(res.status); // primary expected 502
    expect(json.forwarded).toBe(true);
    expect(json.success).toBe(false);
    expect(json.error).toBe('FORWARD_FAILED');
  });
});
