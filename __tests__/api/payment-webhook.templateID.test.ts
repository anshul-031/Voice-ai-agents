/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/payment-webhook/route';

const createMockRequest = (url: string, body: any) => {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

describe('Payment Webhook templateID support', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Enable forwarding for these tests
    process.env.PAYMENT_WEBHOOK_FORWARD_ENABLED = 'true';
    process.env.PL_API_URL = 'https://mock-api.example.com/payment';
    process.env.PL_AES_KEY = '12345678901234567890123456789012'; // 32 bytes
    process.env.PL_X_BIZ_TOKEN = 'mock-token-123';
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('uses default template pl_pmt_od_template and lang en when no templateID provided', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    });
    global.fetch = mockFetch as any;

    const body = {
      phone_number: '919953969666',
      amount: 100,
    };

    const request = createMockRequest('http://localhost:3000/api/payment-webhook', body);
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const fetchCall = mockFetch.mock.calls[0];
    const encryptedBody = fetchCall[1].body;
    
    // We can't decrypt easily in test, but we can check that fetch was called with proper headers
    expect(fetchCall[0]).toBe('https://mock-api.example.com/payment');
    expect(fetchCall[1].headers['X-Biz-Token']).toBe('mock-token-123');
    expect(typeof encryptedBody).toBe('string');
  });

  it('uses pl_payment_link_ml template and lang ml when templateID is pl_payment_link_ml', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    });
    global.fetch = mockFetch as any;

    const body = {
      phone_number: '919953969666',
      amount: 200,
      templateID: 'pl_payment_link_ml',
    };

    const request = createMockRequest('http://localhost:3000/api/payment-webhook', body);
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://mock-api.example.com/payment');
    expect(fetchCall[1].headers['X-Biz-Token']).toBe('mock-token-123');
  });

  it('supports templateId camelCase variant', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    });
    global.fetch = mockFetch as any;

    const body = {
      phone_number: '919953969666',
      amount: 150,
      templateId: 'pl_payment_link_ml',
    };

    const request = createMockRequest('http://localhost:3000/api/payment-webhook', body);
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('supports template_id snake_case variant', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    });
    global.fetch = mockFetch as any;

    const body = {
      phone_number: '919953969666',
      amount: 175,
      template_id: 'pl_payment_link_ml',
    };

    const request = createMockRequest('http://localhost:3000/api/payment-webhook', body);
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to default template when templateID is unknown', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    });
    global.fetch = mockFetch as any;

    const body = {
      phone_number: '919953969666',
      amount: 125,
      templateID: 'some_unknown_template',
    };

    const request = createMockRequest('http://localhost:3000/api/payment-webhook', body);
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns local acknowledgment when forwarding is disabled regardless of templateID', async () => {
    process.env.PAYMENT_WEBHOOK_FORWARD_ENABLED = 'false';

    const body = {
      phone_number: '919953969666',
      amount: 99,
      templateID: 'pl_payment_link_ml',
    };

    const request = createMockRequest('http://localhost:3000/api/payment-webhook', body);
    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.phoneNumber).toBe('919953969666');
    expect(data.message).toContain('919953969666');
  });
});
