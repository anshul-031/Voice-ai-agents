/**
 * Tests for Payment Status API
 */

import { GET } from '../../app/api/payment-status/route';

// Mock NextRequest since it has issues with the jest setup
const createMockRequest = (url: string) => ({
  url,
  nextUrl: new URL(url),
});

describe('/api/payment-status', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('GET /api/payment-status', () => {
    it('should return 400 when transactionId is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Transaction ID is required');
      expect(data.error).toBe('MISSING_TRANSACTION_ID');
    });

    it('should return 400 when transactionId is empty', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Transaction ID is required');
      expect(data.error).toBe('MISSING_TRANSACTION_ID');
    });

    it('should return successful status for transaction with "success" in ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=txn_success_123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe('txn_success_123');
      expect(data.status).toBe('successful');
      expect(data.message).toBe('Payment processed successfully');
      expect(data.amount).toBe(100);
      expect(data.phoneNumber).toBe('+91XXXXXXXXXX');
      expect(data.timestamp).toBeDefined();
      expect(data.reason).toBeUndefined();
    });

    it('should return failed status for transaction with "fail" in ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=txn_fail_456');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe('txn_fail_456');
      expect(data.status).toBe('failed');
      expect(data.message).toBe('Payment failed');
      expect(data.reason).toBe('Insufficient funds');
      expect(data.amount).toBe(50);
      expect(data.phoneNumber).toBe('+91YYYYYYYYYY');
      expect(data.timestamp).toBeDefined();
    });

    it('should return pending status for transaction with "pending" in ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=txn_pending_789');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe('txn_pending_789');
      expect(data.status).toBe('pending');
      expect(data.message).toBe('Payment is being processed');
      expect(data.amount).toBe(75);
      expect(data.phoneNumber).toBe('+91ZZZZZZZZZZ');
      expect(data.timestamp).toBeDefined();
      expect(data.reason).toBeUndefined();
    });

    it('should return processing status for transaction with "processing" in ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=txn_processing_101');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe('txn_processing_101');
      expect(data.status).toBe('processing');
      expect(data.message).toBe('Payment is currently being processed');
      expect(data.amount).toBe(200);
      expect(data.phoneNumber).toBe('+91AAAAAAAAAA');
      expect(data.timestamp).toBeDefined();
      expect(data.reason).toBeUndefined();
    });

    it('should return successful status for regular transaction IDs', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=txn_123456');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe('txn_123456');
      expect(data.status).toBe('successful');
      expect(data.message).toBe('Payment processed successfully');
      expect(data.amount).toBeGreaterThan(0);
      expect(data.phoneNumber).toBe('+91XXXXXXXXXX');
      expect(data.timestamp).toBeDefined();
      expect(data.reason).toBeUndefined();
    });

    it('should handle transaction IDs with special characters', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=txn-123_456.abc');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe('txn-123_456.abc');
      expect(data.status).toBe('successful');
    });

    it('should trim whitespace from transactionId', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=  txn_success_123  ');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe('txn_success_123');
      expect(data.status).toBe('successful');
    });
  });
});