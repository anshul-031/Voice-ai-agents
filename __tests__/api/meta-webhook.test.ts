/**
 * @jest-environment node
 */

// Mock dependencies before importing
jest.mock('@/lib/whatsAppService', () => ({
  processWhatsAppCallback: jest.fn(),
}));

// Set env var for testing
process.env.META_WEBHOOK_VERIFY_TOKEN = 'test_verify_token';

import { GET, POST } from '@/app/api/meta-webhook/route';
import { NextRequest } from 'next/server';

const mockProcessWhatsAppCallback = require('@/lib/whatsAppService').processWhatsAppCallback;

describe('/api/meta-webhook', () => {
  beforeAll(() => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = 'test_verify_token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - Webhook Verification', () => {
    it('should verify webhook successfully', async () => {
      const request = new NextRequest('http://localhost/api/meta-webhook?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=test_challenge');

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toBe('test_challenge');
    });

    it('should return 403 for invalid token', async () => {
      const request = new NextRequest('http://localhost/api/meta-webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge');

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(403);
      expect(text).toBe('VERIFICATION_FAILED');
    });

    it('should return 400 for missing parameters', async () => {
      const request = new NextRequest('http://localhost/api/meta-webhook');

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 for missing mode', async () => {
      const request = new NextRequest('http://localhost/api/meta-webhook?hub.verify_token=test_verify_token&hub.challenge=test_challenge');

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 for missing token', async () => {
      const request = new NextRequest('http://localhost/api/meta-webhook?hub.mode=subscribe&hub.challenge=test_challenge');

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toBe('MISSING_PARAMETERS');
    });
  });

  describe('POST - Process WhatsApp Callback', () => {
    it('should process callback successfully', async () => {
      const callbackData = { object: 'whatsapp_business_account', entry: [] };
      mockProcessWhatsAppCallback.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/meta-webhook', {
        method: 'POST',
        body: JSON.stringify(callbackData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('SUCCESS');
      expect(mockProcessWhatsAppCallback).toHaveBeenCalledWith(callbackData);
    });

    it('should handle JSON parse error', async () => {
      const request = new NextRequest('http://localhost/api/meta-webhook', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('ERROR');
      expect(data.error).toMatch(/Unexpected token/);
    });

    it('should handle processWhatsAppCallback error', async () => {
      const callbackData = { object: 'whatsapp_business_account', entry: [] };
      mockProcessWhatsAppCallback.mockRejectedValue(new Error('Processing failed'));

      const request = new NextRequest('http://localhost/api/meta-webhook', {
        method: 'POST',
        body: JSON.stringify(callbackData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('ERROR');
      expect(data.error).toBe('Processing failed');
    });
  });
});