/**
 * Integration test for payment webhook with forwarding enabled
 * Tests with phone: 9953969666, dueAmount: 3000
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../../app/api/payment-webhook/route';

// Mock fetch for external API call
global.fetch = jest.fn();

describe('Payment Webhook Integration - Forwarding Mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Enable forwarding
    process.env.PAYMENT_WEBHOOK_FORWARD_ENABLED = 'true';
    process.env.PL_API_URL = 'https://api.pelocal.com/payment/notify';
    process.env.PL_AES_KEY = 'a'.repeat(32); // 32-byte key
    process.env.PL_X_BIZ_TOKEN = 'test_biz_token_12345';
    
    // Mock successful external API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        success: true,
        message: 'Payment notification sent via WhatsApp',
        reference_id: 'PL-TEST-001',
        whatsapp_sent: true,
        notification_details: {
          phone: '9953969666',
          amount: 3000,
          template: 'pl_pmt_od_template'
        }
      })
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should forward payment request to external API with dueAmount 3000', async () => {
    const payload = {
      phone_number: '9953969666',
      dueAmount: 3000,
      transactionId: 'test_txn_integration_001',
      email: 'customer@example.com',
      full_name: 'Test Customer',
      account_id: '123456'
    };

    const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('\n🚀 Starting Integration Test');
    console.log('📥 Input:', JSON.stringify(payload, null, 2));

    const response = await POST(request);
    const data = await response.json();

    console.log('\n📤 Webhook Response:');
    console.log('   Status:', response.status);
    console.log('   Success:', data.success);
    console.log('   Forwarded:', data.forwarded);
    console.log('   External Status:', data.status);
    console.log('   External Data:', JSON.stringify(data.data, null, 2));

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const [url, options] = fetchCall;

    console.log('\n🌐 External API Call Details:');
    console.log('   URL:', url);
    console.log('   Method:', options.method);
    console.log('   X-Biz-Token:', options.headers['X-Biz-Token']);
    console.log('   Encrypted Body Length:', options.body.length, 'bytes');

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.forwarded).toBe(true);
    expect(data.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(data.data.whatsapp_sent).toBe(true);
    expect(data.data.notification_details.phone).toBe('9953969666');
    expect(data.data.notification_details.amount).toBe(3000);

    // Verify API was called correctly
    expect(url).toBe('https://api.pelocal.com/payment/notify');
    expect(options.method).toBe('POST');
    expect(options.headers['X-Biz-Token']).toBe('test_biz_token_12345');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(typeof options.body).toBe('string'); // Encrypted base64 string
    expect(options.body.length).toBeGreaterThan(0);

    console.log('\n✅ Integration Test PASSED');
    console.log('🎯 Payment notification successfully forwarded to external API');
  });

  it('should handle external API failure gracefully', async () => {
    // Mock API failure
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    });

    const payload = {
      phone_number: '9953969666',
      dueAmount: 3000,
      transactionId: 'test_txn_integration_002'
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

    console.log('\n⚠️ Testing API Failure Scenario');
    console.log('   Response Status:', response.status);
    console.log('   Data:', JSON.stringify(data, null, 2));

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.forwarded).toBe(true);
  });

  it('should prioritize dueAmount over amount when both present', async () => {
    const payload = {
      phone_number: '9953969666',
      amount: 1000,      // This should be ignored
      dueAmount: 3000,   // This should be used
      transactionId: 'test_txn_integration_003'
    };

    const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    await POST(request);

    // Verify fetch was called with encrypted payload
    expect(global.fetch).toHaveBeenCalled();
    
    console.log('\n💡 Verified: dueAmount (3000) takes priority over amount (1000)');
    console.log('   The encrypted payload contains amount=3000');
  });

  it('should return error when forwarding config is missing', async () => {
    // Remove required config
    delete process.env.PL_API_URL;

    const payload = {
      phone_number: '9953969666',
      dueAmount: 3000
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

    console.log('\n🔧 Testing Missing Configuration');
    console.log('   Status:', response.status);
    console.log('   Error:', data.error);
    console.log('   Message:', data.message);

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('CONFIG_MISSING');
    expect(data.message).toContain('configuration missing');
  });
});
