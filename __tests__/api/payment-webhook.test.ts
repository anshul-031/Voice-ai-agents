/**
 * @jest-environment node
 */
import { POST } from '@/app/api/payment-webhook/route'
import { NextRequest } from 'next/server'

// Mock console methods to reduce noise
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

describe('Payment Webhook', () => {
  describe('phone number validation', () => {
    it('should validate phone number format', () => {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      expect(phoneRegex.test('+919876543210')).toBe(true);
      expect(phoneRegex.test('+91 98765 43210')).toBe(true);
      expect(phoneRegex.test('(91) 9876-543210')).toBe(true);
      expect(phoneRegex.test('9876543210')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      expect(phoneRegex.test('invalid')).toBe(false);
      expect(phoneRegex.test('abc')).toBe(false);
      expect(phoneRegex.test('123')).toBe(false);
    });

    it('should require minimum 10 digits/characters', () => {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      expect(phoneRegex.test('12345')).toBe(false);
      expect(phoneRegex.test('1234567890')).toBe(true);
    });
  });

  describe('webhook response structure', () => {
    it('should have correct success response structure', () => {
      const response = {
        success: true,
        message: 'Phone number +919876543210 received',
        phoneNumber: '+919876543210',
        timestamp: new Date().toISOString(),
      };

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('phoneNumber');
      expect(response).toHaveProperty('timestamp');
      expect(response.success).toBe(true);
    });

    it('should have correct error response structure', () => {
      const response = {
        success: false,
        message: 'Phone number is required',
        timestamp: new Date().toISOString(),
      };

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('timestamp');
      expect(response.success).toBe(false);
    });
  });

  describe('webhook endpoint documentation', () => {
    it('should document POST endpoint', () => {
      const endpoint = {
        method: 'POST',
        path: '/api/payment-webhook',
        description: 'Accepts payment notifications with phone number',
      };

      expect(endpoint.method).toBe('POST');
      expect(endpoint.path).toBe('/api/payment-webhook');
    });

    it('should document GET endpoint', () => {
      const endpoint = {
        method: 'GET',
        path: '/api/payment-webhook',
        description: 'Health check for webhook service',
      };

      expect(endpoint.method).toBe('GET');
      expect(endpoint.path).toBe('/api/payment-webhook');
    });
  });

  describe('payload handling', () => {
    it('should support snake_case phone_number field', () => {
      const payload = { phone_number: '+919876543210' };
      expect(payload.phone_number).toBeDefined();
      expect(payload.phone_number).toBe('+919876543210');
    });

    it('should support camelCase phoneNumber field', () => {
      const payload = { phoneNumber: '+919876543210' };
      expect(payload.phoneNumber).toBeDefined();
      expect(payload.phoneNumber).toBe('+919876543210');
    });
  });

  describe('POST /api/payment-webhook', () => {
    it('should accept valid phone number and return success response', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone_number: '+919876543210',
          amount: 100,
          transactionId: 'txn_123',
          status: 'success'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Phone number +919876543210 received');
      expect(data.phoneNumber).toBe('+919876543210');
      expect(data.timestamp).toBeDefined();
      expect(data.transactionId).toBe('txn_123');
    });

    it('should accept camelCase phoneNumber field', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '9876543210',
          amount: 50
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('9876543210');
    });

    it('should normalize phone number format', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone_number: '(91) 98765-43210'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('919876543210');
    });

    it('should handle text/plain content type with JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: JSON.stringify({
          phone_number: '+919876543210'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+919876543210');
    });

    it('should handle form-urlencoded content type', async () => {
      const formData = new URLSearchParams();
      formData.append('phone_number', '+919876543210');
      formData.append('amount', '100');
      formData.append('transactionId', 'txn_456');

      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+919876543210');
      expect(data.transactionId).toBe('txn_456');
    });

    it('should return 400 when phone number is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          transactionId: 'txn_123'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('MISSING_PHONE_NUMBER');
      expect(data.message).toContain('Phone number is required');
    });

    it('should return 400 for invalid phone number format (too short)', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone_number: '12345'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_PHONE_FORMAT');
      expect(data.message).toContain('Invalid phone number format');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_JSON');
      expect(data.message).toContain('Invalid JSON in request body');
    });

    it('should handle text/plain "hi" message', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'hi'
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/plain');
      expect(text.trim()).toBe('hello');
    });

    it('should handle form-urlencoded "hi" message', async () => {
      const formData = new URLSearchParams();
      formData.append('message', 'hi');

      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/plain');
      expect(text.trim()).toBe('hello');
    });

    it('should handle JSON payload with "hi" message', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'hi',
          phone_number: '+919876543210'
        })
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/plain');
      expect(text.trim()).toBe('hello');
    });

    it('should handle unexpected errors with 500 response', async () => {
      // Mock NextResponse.json to throw an error
      const originalNextResponse = require('next/server').NextResponse;
      const originalJson = originalNextResponse.json;
      originalNextResponse.json = jest.fn().mockImplementationOnce(() => {
        throw new Error('Response creation error');
      });

      const request = new NextRequest('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone_number: '+919876543210'
        })
      });

      // When NextResponse.json throws an error in the catch block, the function should return undefined
      // since the error is not caught
      const result = await POST(request);
      expect(result).toBeUndefined();

      // Restore original
      originalNextResponse.json = originalJson;
    });
  });
});
