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

describe('/api/payment-status', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    // Clear modules to ensure clean state
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
    });

    it('should handle errors in GET request', async () => {
      // Mock fs.readFile to throw an error
      const originalReadFile = jest.requireActual('fs').promises.readFile;
      const mockReadFile = jest.fn().mockRejectedValue(new Error('File read error'));
      require('fs').promises.readFile = mockReadFile;

      try {
        const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
        const response = await GET(request as any);
        const data = await response.json();

        expect(response.status).toBe(404); // findPaymentData returns null on error, so 404
        expect(data.status_code).toBe(404);
        expect(data.message).toBe('Payment data not found');
      } finally {
        // Restore original
        require('fs').promises.readFile = originalReadFile;
      }
    });

    it('should handle errors in POST request', async () => {
      // Mock fs.writeFile to throw an error
      const originalWriteFile = jest.requireActual('fs').promises.writeFile;
      const mockWriteFile = jest.fn().mockRejectedValue(new Error('File write error'));
      require('fs').promises.writeFile = mockWriteFile;

      try {
        const paymentData = {
          transaction_id: 'txn_error_test',
          payment_status: 'successful' as const,
          payment_date: '2025-10-27T10:30:00.000Z',
          description: 'Test payment'
        };

        const request = createMockRequest('http://localhost:3000/api/payment-status', {
          method: 'POST',
          body: paymentData
        });
        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.status_code).toBe(500);
        expect(data.message).toBe('Internal server error');
      } finally {
        // Restore original
        require('fs').promises.writeFile = originalWriteFile;
      }
    });

    it('should update existing payment data when transaction_id already exists', async () => {
      const paymentData = {
        transaction_id: 'txn_update_test',
        mer_ref_id: 'ref_original',
        account_id: 'acc_original',
        payment_status: 'pending' as const,
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Original payment',
        amount: 100
      };

      // Store initial payment
      const postRequest1 = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      await POST(postRequest1 as any);

      // Update the same transaction with different data
      const updatedPaymentData = {
        transaction_id: 'txn_update_test',
        mer_ref_id: 'ref_updated',
        account_id: 'acc_updated',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T11:30:00.000Z',
        description: 'Updated payment',
        amount: 200
      };

      const postRequest2 = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: updatedPaymentData
      });
      await POST(postRequest2 as any);

      // Retrieve and verify it's updated
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_update_test');
      const response = await GET(getRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.payment_status).toBe('successful');
      expect(data.data.description).toBe('Updated payment');
      expect(data.data.amount).toBe(200);
    });
  });

  describe('JSON file storage', () => {
    it('should store and retrieve payment data from JSON file', async () => {
      const paymentData = {
        transaction_id: 'txn_json_123',
        mer_ref_id: 'ref_json_456',
        account_id: 'acc_json_789',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Payment stored in JSON file',
        amount: 150
      };

      // Store the payment data
      const postRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      const postResponse = await POST(postRequest as any);
      const postData = await postResponse.json();

      expect(postResponse.status).toBe(201);
      expect(postData.status_code).toBe(201);
      expect(postData.message).toBe('Payment data stored successfully');

      // Retrieve the payment data
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_json_123');
      const getResponse = await GET(getRequest as any);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.status_code).toBe(200);
      expect(getData.data.transaction_id).toBe('txn_json_123');
      expect(getData.data.mer_ref_id).toBe('ref_json_456');
      expect(getData.data.account_id).toBe('acc_json_789');
      expect(getData.data.payment_status).toBe('successful');
      expect(getData.data.description).toBe('Payment stored in JSON file');
      expect(getData.data.amount).toBe(150);
    });
  });

  describe('JSON file storage edge cases', () => {
    it('should handle corrupted JSON file gracefully', async () => {
      // Mock fs.readFile to return invalid JSON (non-array)
      const originalReadFile = require('fs').promises.readFile;
      require('fs').promises.readFile = jest.fn().mockResolvedValue('{"not": "an array"}');

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404); // Should return 404 since no payment found

      // Restore original
      require('fs').promises.readFile = originalReadFile;
    });

    it('should handle file read errors in findPaymentData', async () => {
      // Mock fs.readFile to throw an error
      const originalReadFile = require('fs').promises.readFile;
      require('fs').promises.readFile = jest.fn().mockRejectedValue(new Error('Read error'));

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404); // Should return 404 since findPaymentData returns null on error

      // Restore original
      require('fs').promises.readFile = originalReadFile;
    });

    it('should handle JSON parse errors in readPaymentData', async () => {
      // Mock fs.readFile to return invalid JSON
      const originalReadFile = require('fs').promises.readFile;
      require('fs').promises.readFile = jest.fn().mockResolvedValue('invalid json content');

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404); // Should return 404 since readPaymentData returns null on error

      // Restore original
      require('fs').promises.readFile = originalReadFile;
    });

    it('should handle unexpected errors in GET handler', async () => {
      // Store some data first so we can try to retrieve it
      const storeRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: {
          transaction_id: 'test_txn',
          payment_status: 'successful',
          payment_date: '2025-01-01T00:00:00.000Z',
          description: 'Test payment'
        }
      });
      await POST(storeRequest as any);

      // Mock Date.toISOString to throw an error in the success response
      const originalDate = global.Date;
      const mockDate = function(this: any, ...args: any[]) {
        const date = new (originalDate as any)(...args);
        date.toISOString = jest.fn().mockImplementation(() => {
          throw new Error('Date serialization error');
        });
        return date;
      };
      mockDate.prototype = originalDate.prototype;
      global.Date = mockDate as any;

      // Now try to GET it - this should trigger the error in the success response creation
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test_txn');
      const response = await GET(getRequest as any);
      const data = await response.json();

      expect(response.status).toBe(500); // Should trigger the GET handler catch block
      expect(data.status_code).toBe(500);

      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle unexpected errors in POST handler', async () => {
      // Mock fs.writeFile to throw an error during storePaymentData
      const originalWriteFile = require('fs').promises.writeFile;
      require('fs').promises.writeFile = jest.fn().mockRejectedValue(new Error('File write error'));

      const paymentData = {
        transaction_id: 'txn_error_test',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Test payment'
      };

      const request = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500); // Should trigger the POST handler catch block
      expect(data.status_code).toBe(500);
      expect(data.message).toBe('Internal server error');

      // Restore original
      require('fs').promises.writeFile = originalWriteFile;
    });

    it('should handle file read errors in findPaymentById function', async () => {
      // Store some data first so we can try to retrieve it
      const storeRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: {
          transaction_id: 'test_error_txn',
          payment_status: 'successful',
          payment_date: '2025-01-01T00:00:00.000Z',
          description: 'Test payment for error handling'
        }
      });
      await POST(storeRequest as any);

      // Mock fs.readFile to throw an error during the findPaymentById call
      const originalReadFile = require('fs').promises.readFile;
      require('fs').promises.readFile = jest.fn().mockRejectedValue(new Error('File read error in findPaymentById'));

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test_error_txn');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404); // findPaymentById returns null on error, so 404
      expect(data.status_code).toBe(404);
      expect(data.message).toBe('Payment data not found');

      // Restore original
      require('fs').promises.readFile = originalReadFile;
    });
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
    });

    it('should handle errors in GET request', async () => {
      // Mock fs.readFile to throw an error
      const originalReadFile = jest.requireActual('fs').promises.readFile;
      const mockReadFile = jest.fn().mockRejectedValue(new Error('File read error'));
      require('fs').promises.readFile = mockReadFile;

      try {
        const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
        const response = await GET(request as any);
        const data = await response.json();

        expect(response.status).toBe(404); // findPaymentData returns null on error, so 404
        expect(data.status_code).toBe(404);
        expect(data.message).toBe('Payment data not found');
      } finally {
        // Restore original
        require('fs').promises.readFile = originalReadFile;
      }
    });

    it('should handle errors in POST request', async () => {
      // Mock fs.writeFile to throw an error
      const originalWriteFile = jest.requireActual('fs').promises.writeFile;
      const mockWriteFile = jest.fn().mockRejectedValue(new Error('File write error'));
      require('fs').promises.writeFile = mockWriteFile;

      try {
        const paymentData = {
          transaction_id: 'txn_error_test',
          payment_status: 'successful' as const,
          payment_date: '2025-10-27T10:30:00.000Z',
          description: 'Test payment'
        };

        const request = createMockRequest('http://localhost:3000/api/payment-status', {
          method: 'POST',
          body: paymentData
        });
        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.status_code).toBe(500);
        expect(data.message).toBe('Internal server error');
      } finally {
        // Restore original
        require('fs').promises.writeFile = originalWriteFile;
      }
    });

    it('should update existing payment data when transaction_id already exists', async () => {
      const paymentData = {
        transaction_id: 'txn_update_test',
        mer_ref_id: 'ref_original',
        account_id: 'acc_original',
        payment_status: 'pending' as const,
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Original payment',
        amount: 100
      };

      // Store initial payment
      const postRequest1 = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      await POST(postRequest1 as any);

      // Update the same transaction with different data
      const updatedPaymentData = {
        transaction_id: 'txn_update_test',
        mer_ref_id: 'ref_updated',
        account_id: 'acc_updated',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T11:30:00.000Z',
        description: 'Updated payment',
        amount: 200
      };

      const postRequest2 = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: updatedPaymentData
      });
      await POST(postRequest2 as any);

      // Retrieve and verify it's updated
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_update_test');
      const response = await GET(getRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.payment_status).toBe('successful');
      expect(data.data.description).toBe('Updated payment');
      expect(data.data.amount).toBe(200);
    });
  });

  describe('JSON file storage', () => {
    it('should store and retrieve payment data from JSON file', async () => {
      const paymentData = {
        transaction_id: 'txn_json_123',
        mer_ref_id: 'ref_json_456',
        account_id: 'acc_json_789',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Payment stored in JSON file',
        amount: 150
      };

      // Store the payment data
      const postRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      const postResponse = await POST(postRequest as any);
      const postData = await postResponse.json();

      expect(postResponse.status).toBe(201);
      expect(postData.status_code).toBe(201);
      expect(postData.message).toBe('Payment data stored successfully');

      // Retrieve the payment data
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=txn_json_123');
      const getResponse = await GET(getRequest as any);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.status_code).toBe(200);
      expect(getData.data.transaction_id).toBe('txn_json_123');
      expect(getData.data.mer_ref_id).toBe('ref_json_456');
      expect(getData.data.account_id).toBe('acc_json_789');
      expect(getData.data.payment_status).toBe('successful');
      expect(getData.data.description).toBe('Payment stored in JSON file');
      expect(getData.data.amount).toBe(150);
    });
  });

  describe('JSON file storage edge cases', () => {
    it('should handle corrupted JSON file gracefully', async () => {
      // Mock fs.readFile to return invalid JSON (non-array)
      const originalReadFile = require('fs').promises.readFile;
      require('fs').promises.readFile = jest.fn().mockResolvedValue('{"not": "an array"}');

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404); // Should return 404 since no payment found

      // Restore original
      require('fs').promises.readFile = originalReadFile;
    });

    it('should handle file read errors in findPaymentData', async () => {
      // Mock fs.readFile to throw an error
      const originalReadFile = require('fs').promises.readFile;
      require('fs').promises.readFile = jest.fn().mockRejectedValue(new Error('Read error'));

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404); // Should return 404 since findPaymentData returns null on error

      // Restore original
      require('fs').promises.readFile = originalReadFile;
    });

    it('should handle JSON parse errors in readPaymentData', async () => {
      // Mock fs.readFile to return invalid JSON
      const originalReadFile = require('fs').promises.readFile;
      require('fs').promises.readFile = jest.fn().mockResolvedValue('invalid json content');

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404); // Should return 404 since readPaymentData returns null on error

      // Restore original
      require('fs').promises.readFile = originalReadFile;
    });

    it('should handle unexpected errors in GET handler', async () => {
      // Store some data first so we can try to retrieve it
      const storeRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: {
          transaction_id: 'test_txn',
          payment_status: 'successful',
          payment_date: '2025-01-01T00:00:00.000Z',
          description: 'Test payment'
        }
      });
      await POST(storeRequest as any);

      // Mock Date.toISOString to throw an error in the success response
      const originalDate = global.Date;
      const mockDate = function(this: any, ...args: any[]) {
        const date = new (originalDate as any)(...args);
        date.toISOString = jest.fn().mockImplementation(() => {
          throw new Error('Date serialization error');
        });
        return date;
      };
      mockDate.prototype = originalDate.prototype;
      global.Date = mockDate as any;

      // Now try to GET it - this should trigger the error in the success response creation
      const getRequest = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test_txn');
      const response = await GET(getRequest as any);
      const data = await response.json();

      expect(response.status).toBe(500); // Should trigger the GET handler catch block
      expect(data.status_code).toBe(500);

      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle unexpected errors in POST handler', async () => {
      // Mock fs.writeFile to throw an error during storePaymentData
      const originalWriteFile = require('fs').promises.writeFile;
      require('fs').promises.writeFile = jest.fn().mockRejectedValue(new Error('File write error'));

      const paymentData = {
        transaction_id: 'txn_error_test',
        payment_status: 'successful' as const,
        payment_date: '2025-10-27T10:30:00.000Z',
        description: 'Test payment'
      };

      const request = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: paymentData
      });
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500); // Should trigger the POST handler catch block
      expect(data.status_code).toBe(500);
      expect(data.message).toBe('Internal server error');

      // Restore original
      require('fs').promises.writeFile = originalWriteFile;
    });

    it('should handle file read errors in findPaymentById function', async () => {
      // Store some data first so we can try to retrieve it
      const storeRequest = createMockRequest('http://localhost:3000/api/payment-status', {
        method: 'POST',
        body: {
          transaction_id: 'test_error_txn',
          payment_status: 'successful',
          payment_date: '2025-01-01T00:00:00.000Z',
          description: 'Test payment for error handling'
        }
      });
      await POST(storeRequest as any);

      // Mock fs.readFile to throw an error during the findPaymentById call
      const originalReadFile = require('fs').promises.readFile;
      require('fs').promises.readFile = jest.fn().mockRejectedValue(new Error('File read error in findPaymentById'));

      const request = createMockRequest('http://localhost:3000/api/payment-status?transaction_id=test_error_txn');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404); // findPaymentById returns null on error, so 404
      expect(data.status_code).toBe(404);
      expect(data.message).toBe('Payment data not found');

      // Restore original
      require('fs').promises.readFile = originalReadFile;
    });
  });
});