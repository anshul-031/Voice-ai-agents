/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Create proper NextRequest instances for testing
const createMockRequest = (url: string, options?: { method?: string; body?: any }) => {
  const request = new NextRequest(url, {
    method: options?.method || 'GET',
    ...(options?.body && { body: JSON.stringify(options.body) }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return request;
};

import { GET, POST } from '../../app/api/payment-status/route';

describe('/api/payment-status phone lookup', () => {
  const phone = '919953969666';

  it('retrieves by phone_number when only phone_number is provided', async () => {
    const body = {
      transaction_id: 'txn_phone_lookup_1',
      mer_ref_id: 'ref_phone_1',
      account_id: 'acc_phone_1',
      phone_number: phone,
      payment_status: 'successful' as const,
      payment_date: new Date('2025-11-10T10:00:00.000Z').toISOString(),
      description: 'Phone lookup store',
      amount: 123
    };

    // Store
    await POST(createMockRequest('http://localhost:3000/api/payment-status', { method: 'POST', body }) as any);

    // Lookup only by phone_number
    const getReq = createMockRequest(`http://localhost:3000/api/payment-status?phone_number=${phone}`);
    const res = await GET(getReq as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.transaction_id).toBe('txn_phone_lookup_1');
    expect(data.data.phone_number).toBe(phone);
  });

  it('retrieves by phoneNumber (camelCase) query too', async () => {
    const body = {
      transaction_id: 'txn_phone_lookup_2',
      mer_ref_id: 'ref_phone_2',
      account_id: 'acc_phone_2',
      phoneNumber: '8765432109',
      payment_status: 'pending' as const,
      payment_date: new Date('2025-11-10T10:05:00.000Z').toISOString(),
      description: 'Phone camelCase store',
      amount: 456
    };

    await POST(createMockRequest('http://localhost:3000/api/payment-status', { method: 'POST', body }) as any);

    const getReq = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=8765432109');
    const res = await GET(getReq as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.transaction_id).toBe('txn_phone_lookup_2');
    expect(data.data.phone_number).toBe('8765432109');
  });
});
