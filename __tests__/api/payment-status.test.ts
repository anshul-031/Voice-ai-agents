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

    it('should handle non-Error exceptions in catch block', async () => {
      // Mock NextRequest to throw a non-Error exception
      const originalNextRequest = (global as any).NextRequest;
      (global as any).NextRequest = jest.fn(() => {
        throw 'String error';
      });

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status_code).toBe(500);
      expect(data.message).toBe('Internal server error');
      expect(data.data.error).toBe('String error');

      // Restore original
      (global as any).NextRequest = originalNextRequest;
    });

    it('should handle Error objects in catch block', async () => {
      // Mock NextRequest to throw an Error
      const originalNextRequest = (global as any).NextRequest;
      (global as any).NextRequest = jest.fn(() => {
        throw new Error('Test error message');
      });

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status_code).toBe(500);
      expect(data.message).toBe('Internal server error');
      expect(data.data.error).toBe('Test error message');

      // Restore original
      (global as any).NextRequest = originalNextRequest;
    });
  });
});
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
      expect(data.message).toBe('At least one identifier (transaction_id, mer_ref_id, or account_id) is required');
    });

    it('should return 400 when transaction_id is whitespace and account_id is whitespace', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=%20%20&account_id=%20%20');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status_code).toBe(400);
      expect(data.message).toBe('At least one identifier (transaction_id, mer_ref_id, or account_id) is required');
    });

    it('should return successful status for transaction with "success" in ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_success_123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn_success_123');
      expect(data.data.payment_status).toBe('successful');
      expect(data.data.description).toBe('Payment processed successfully');
      expect(data.data.payment_date).toBeDefined();
    });

    it('should return failed status for transaction with "fail" in ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_fail_456');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn_fail_456');
      expect(data.data.payment_status).toBe('failed');
      expect(data.data.description).toBe('Payment failed');
      expect(data.data.payment_date).toBeDefined();
    });

    it('should return pending status for transaction with "pending" in ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_pending_789');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn_pending_789');
      expect(data.data.payment_status).toBe('pending');
      expect(data.data.description).toBe('Payment is being processed');
      expect(data.data.payment_date).toBeDefined();
    });

    it('should return processing status for transaction with "processing" in ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_processing_101');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn_processing_101');
      expect(data.data.payment_status).toBe('processing');
      expect(data.data.description).toBe('Payment is currently being processed');
      expect(data.data.payment_date).toBeDefined();
    });

    it('should return successful status for regular transaction IDs', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_123456');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn_123456');
      expect(data.data.payment_status).toBe('successful');
      expect(data.data.description).toBe('Payment processed successfully');
      expect(data.data.payment_date).toBeDefined();
    });

    it('should handle transaction IDs with special characters', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn-123_456.abc');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn-123_456.abc');
      expect(data.data.payment_status).toBe('successful');
    });

    it('should trim whitespace from transaction_id', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=  txn_success_123  ');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn_success_123');
      expect(data.data.payment_status).toBe('successful');
    });

    it('should return successful status when querying by account_id', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=+919876543210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+919876543210');
      expect(data.data.payment_status).toBe('successful');
      expect(data.data.description).toBe('Payment processed successfully');
      expect(data.data.transaction_id).toBeDefined();
      expect(data.data.payment_date).toBeDefined();
    });

    it('should normalize account_id format (remove +91 prefix)', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=9876543210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+9876543210');
      expect(data.data.payment_status).toBe('successful');
    });

    it('should handle account_id with spaces and dashes', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=+91 987-654 3210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+919876543210');
      expect(data.data.payment_status).toBe('successful');
    });

    it('should return failed status when querying by account_id with "fail"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=+91fail123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+91fail123');
      expect(data.data.payment_status).toBe('failed');
      expect(data.data.description).toBe('Payment failed');
    });

    it('should accept both transaction_id and account_id (prefer transaction_id)', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_success_123&account_id=+919876543210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.transaction_id).toBe('txn_success_123');
      expect(data.data.account_id).toBe('+91XXXXXXXXXX');
      expect(data.data.payment_status).toBe('successful');
    });

    it('should return successful status for account_id containing "success"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=+91success123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+91success123');
      expect(data.data.payment_status).toBe('successful');
      expect(data.data.description).toBe('Payment processed successfully');
      expect(data.data.transaction_id).toBeDefined();
    });

    it('should return failed status for account_id containing "fail"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=+91fail456');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+91fail456');
      expect(data.data.payment_status).toBe('failed');
      expect(data.data.description).toBe('Payment failed');
      expect(data.data.transaction_id).toBeDefined();
    });

    it('should return pending status for account_id containing "pending"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=+91pending789');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+91pending789');
      expect(data.data.payment_status).toBe('pending');
      expect(data.data.description).toBe('Payment is being processed');
      expect(data.data.transaction_id).toBeDefined();
    });

    it('should return processing status for account_id containing "processing"', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=+91processing101');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+91processing101');
      expect(data.data.payment_status).toBe('processing');
      expect(data.data.description).toBe('Payment is currently being processed');
      expect(data.data.transaction_id).toBeDefined();
    });

    it('should handle account_id starting with 00 (international format)', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=009876543210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+9876543210');
      expect(data.data.payment_status).toBe('successful');
    });

    it('should handle account_id with parentheses and multiple spaces', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=(+91) 987-654  3210');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+919876543210');
      expect(data.data.payment_status).toBe('successful');
    });

    it('should handle default case with account_id fallback when transaction_id is not provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/payment-status?account_id=+91default123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status_code).toBe(200);
      expect(data.message).toBe('Payment status retrieved successfully');
      expect(data.data).toBeDefined();
      expect(data.data.account_id).toBe('+91default123');
      expect(data.data.transaction_id).toBeDefined();
      expect(data.data.payment_status).toBe('successful');
    });

    it('should handle non-Error exceptions in catch block', async () => {
      // Create a mock request that will cause URL parsing to fail with a non-Error
      const mockRequest = {
        url: 'http://localhost:3000/api/payment-status?transaction_id=test',
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
        expect(data.status_code).toBe(500);
        expect(data.message).toBe('Internal server error');
      } finally {
        global.URL = originalURL;
      }
    });

    it('should handle Error objects in catch block', async () => {
      // Create a mock request that will cause URL parsing to fail with an Error
      const mockRequest = {
        url: 'http://localhost:3000/api/payment-status?transaction_id=test',
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
        expect(data.status_code).toBe(500);
        expect(data.message).toBe('Internal server error');
      } finally {
        global.URL = originalURL;
      }
    });
  });
});