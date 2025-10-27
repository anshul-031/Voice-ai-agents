/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/payment-status/route';

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

describe('/api/payment-status', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    // Clear the in-memory store before each test
    jest.resetModules();
    // Clear mongoose mock storage
    const mongooseMock = require('mongoose');
    mongooseMock.__clearStorage();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('POST /api/payment-status', () => {
    it('should store payment data successfully', async () => {
      const paymentData = {
        transaction_id: 'txn_123',
        mer_ref_id: 'ref_456',
        account_id: 'acc_789',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Payment processed successfully',
        amount: 100
      };

      const request = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status_code).toBe(201);
      expect(data.message).toBe('Payment data stored successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        transaction_id: 'txn_123',
        // missing payment_status, payment_date, description
      };

      const request = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: incompleteData
      });
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status_code).toBe(400);
      expect(data.message).toBe('Missing required fields: transaction_id, payment_status, payment_date, description');
    });

    it('should return 400 for invalid payment_status', async () => {
      const invalidData = {
        transaction_id: 'txn_123',
        payment_status: 'invalid_status',
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Test payment'
      };

      const request = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: invalidData
      });
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status_code).toBe(400);
      expect(data.message).toBe('Invalid payment_status. Must be one of: successful, failed, pending, processing');
    });
  });

  describe('GET /api/payment-status', () => {
    it('should return 400 when no identifier parameters are provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status_code).toBe(400);
      expect(data.message).toBe('At least one identifier (transaction_id, mer_ref_id, or account_id) is required');
    });

    it('should return 400 when transaction_id is empty and no other identifiers provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status_code).toBe(400);
      expect(data.message).toBe('At least one identifier (transaction_id, mer_ref_id, or account_id) is required');
    });

    it('should return 400 when all identifier parameters are empty', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=&mer_ref_id=&account_id=');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status_code).toBe(400);
    });

    it('should return 400 when transaction_id is whitespace and account_id is whitespace', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=   &account_id=   ');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status_code).toBe(400);
      expect(data.message).toBe('At least one identifier (transaction_id, mer_ref_id, or account_id) is required');
    });

    it('should return 404 when payment data is not found', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=nonexistent');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.status_code).toBe(404);
      expect(data.message).toBe('Payment data not found');
    });

    it('should return payment data when found by transaction_id', async () => {
      // First store the payment data
      const paymentData = {
        transaction_id: 'txn_success_123',
        mer_ref_id: 'ref_456',
        account_id: 'acc_789',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Payment processed successfully',
        amount: 100
      };

      const postRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      await POST(postRequest as any);

      // Now retrieve it
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_success_123');
      const response = await GET(getRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn_success_123');
      expect(data.data.payment_status).toBe('successful');
      expect(data.data.amount).toBe(100);
    });

    it('should return payment data when found by mer_ref_id', async () => {
      // First store the payment data
      const paymentData = {
        transaction_id: 'txn_456',
        mer_ref_id: 'ref_pending_789',
        account_id: 'acc_101',
        payment_status: 'pending' as const,
        payment_date: '2025-10-27T11:00:00.000Z',
        description: 'Payment is being processed',
        amount: 75
      };

      const postRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      await POST(postRequest as any);

      // Now retrieve it by mer_ref_id
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?mer_ref_id=ref_pending_789');
      const response = await GET(getRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.transaction_id).toBe('txn_456');
      expect(data.data.payment_status).toBe('pending');
    });

    it('should return payment data when found by account_id', async () => {
      // First store the payment data
      const paymentData = {
        transaction_id: 'txn_789',
        mer_ref_id: 'ref_101',
        account_id: 'acc_fail_202',
        payment_status: 'failed' as const,
        payment_date: '2025-10-27T12:00:00.000Z',
        description: 'Payment failed',
        amount: 50
      };

      const postRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      await POST(postRequest as any);

      // Now retrieve it by account_id
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?account_id=acc_fail_202');
      const response = await GET(getRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.transaction_id).toBe('txn_789');
      expect(data.data.payment_status).toBe('failed');
    });

    it('should prefer transaction_id over other identifiers', async () => {
      // Store data with transaction_id
      const paymentData1 = {
        transaction_id: 'txn_priority_1',
        mer_ref_id: 'ref_shared',
        account_id: 'acc_shared',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T13:00:00.000Z',
        description: 'First payment',
        amount: 100
      };

      // Store another with same mer_ref_id and account_id but different transaction_id
      const paymentData2 = {
        transaction_id: 'txn_priority_2',
        mer_ref_id: 'ref_shared',
        account_id: 'acc_shared',
        payment_status: 'failed' as const,
        payment_date: '2025-10-27T14:00:00.000Z',
        description: 'Second payment',
        amount: 200
      };

      await POST(createMockRequest('http://localhost:3000/api/payment-status', { method: 'POST', body: paymentData1 }) as any);
      await POST(createMockRequest('http://localhost:3000/api/payment-status', { method: 'POST', body: paymentData2 }) as any);

      // Query by shared identifiers - should return the first one (transaction_id lookup)
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?mer_ref_id=ref_shared&account_id=acc_shared');
      const response = await GET(getRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.transaction_id).toBe('txn_priority_1'); // Should find the first one
      expect(data.data.payment_status).toBe('successful');
    });
  });
});