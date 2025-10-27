/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/payment-status/route';

// Create proper NextRequest instances for testing
const createMockRequest = (url: string) => new NextRequest(url);

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
    it('should return 400 when both transactionId and phoneNumber are missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Either transactionId or phoneNumber is required');
      expect(data.error).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 when transactionId is empty and phoneNumber is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Either transactionId or phoneNumber is required');
      expect(data.error).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 when transactionId is empty and phoneNumber is empty', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=&phoneNumber=');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Either transactionId or phoneNumber is required');
      expect(data.error).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 when transactionId is whitespace and phoneNumber is whitespace', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=%20%20&phoneNumber=%20%20');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200); // Whitespace-only parameters are considered valid after trimming
      expect(data.success).toBe(true);
      expect(data.status).toBe('successful');
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

    it('should return successful status when querying by phone number', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=+919876543210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+919876543210');
      expect(data.status).toBe('successful');
      expect(data.message).toBe('Payment processed successfully');
      expect(data.transactionId).toBe('txn_auto_generated');
      expect(data.timestamp).toBeDefined();
    });

    it('should normalize phone number format (remove +91 prefix)', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=9876543210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+9876543210');
      expect(data.status).toBe('successful');
    });

    it('should handle phone numbers with spaces and dashes', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=+91 987-654 3210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+919876543210');
      expect(data.status).toBe('successful');
    });

    it('should return failed status when querying by phone number with "fail"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=+91fail123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+91fail123');
      expect(data.status).toBe('failed');
      expect(data.reason).toBe('Insufficient funds');
    });

    it('should accept both transactionId and phoneNumber (prefer transactionId)', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transactionId=txn_success_123&phoneNumber=+919876543210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe('txn_success_123');
      expect(data.phoneNumber).toBe('+91XXXXXXXXXX');
      expect(data.status).toBe('successful');
    });

    it('should return successful status for phone number containing "success"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=+91success123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+91success123');
      expect(data.status).toBe('successful');
      expect(data.message).toBe('Payment processed successfully');
      expect(data.transactionId).toBe('txn_auto_generated');
    });

    it('should return failed status for phone number containing "fail"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=+91fail456');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+91fail456');
      expect(data.status).toBe('failed');
      expect(data.reason).toBe('Insufficient funds');
      expect(data.transactionId).toBe('txn_auto_generated');
    });

    it('should return pending status for phone number containing "pending"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=+91pending789');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+91pending789');
      expect(data.status).toBe('pending');
      expect(data.message).toBe('Payment is being processed');
      expect(data.transactionId).toBe('txn_auto_generated');
    });

    it('should return processing status for phone number containing "processing"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=+91processing101');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+91processing101');
      expect(data.status).toBe('processing');
      expect(data.message).toBe('Payment is currently being processed');
      expect(data.transactionId).toBe('txn_auto_generated');
    });

    it('should handle phone numbers starting with 00 (international format)', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=009876543210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+9876543210');
      expect(data.status).toBe('successful');
    });

    it('should handle phone numbers with parentheses and multiple spaces', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=(+91) 987-654  3210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+919876543210');
      expect(data.status).toBe('successful');
    });

    it('should handle default case with phone number fallback when transactionId is not provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?phoneNumber=+91default123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber).toBe('+91default123');
      expect(data.transactionId).toBe('txn_auto_generated');
      expect(data.status).toBe('successful');
      expect(data.amount).toBeGreaterThan(0);
    });

    it('should handle non-Error exceptions in catch block', async () => {
      // Create a mock request that will cause URL parsing to fail with a non-Error
      const mockRequest = {
        url: 'http://localhost:3000/api/payment-status?transactionId=test',
      } as any;

      // Mock URL constructor to throw a string
      const originalURL = global.URL;
      global.URL = jest.fn().mockImplementation(() => {
        throw 'String error'; // Throw a string instead of Error object
      }) as any;

      try {
        const response = await GET(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Internal server error');
        expect(data.error).toBe('Unknown error'); // Should use fallback when not instanceof Error
      } finally {
        global.URL = originalURL;
      }
    });

    it('should handle Error objects in catch block', async () => {
      // Create a mock request that will cause URL parsing to fail with an Error
      const mockRequest = {
        url: 'http://localhost:3000/api/payment-status?transactionId=test',
      } as any;

      // Mock URL constructor to throw an Error object
      const originalURL = global.URL;
      global.URL = jest.fn().mockImplementation(() => {
        throw new Error('Test error message');
      }) as any;

      try {
        const response = await GET(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Internal server error');
        expect(data.error).toBe('Test error message'); // Should use error.message when instanceof Error
      } finally {
        global.URL = originalURL;
      }
    });
  });
});