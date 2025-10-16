/**
 * Unit tests for Exotel API integration
 */

import { triggerBulkCalls, triggerExotelCall, validateExotelConfig } from '@/lib/exotel';

// Mock fetch globally
global.fetch = jest.fn();

describe('Exotel Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerExotelCall', () => {
    it('should successfully trigger an outbound call', async () => {
      const mockResponse = {
        Call: {
          Sid: 'test-call-sid-123',
          Status: 'queued'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await triggerExotelCall({
        phoneNumber: '9876543210',
        contactName: 'Test User',
        contactId: 'contact-123'
      });

      expect(result.success).toBe(true);
      expect(result.callSid).toBe('test-call-sid-123');
      expect(result.status).toBe('queued');
      expect(result.phoneNumber).toBe('9876543210');
    });

    it('should handle 10-digit phone number format', async () => {
      const mockResponse = {
        Call: {
          Sid: 'test-call-sid-456',
          Status: 'queued'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await triggerExotelCall({
        phoneNumber: '9876543210'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('From=919876543210')
        })
      );
    });

    it('should handle phone number with country code', async () => {
      const mockResponse = {
        Call: {
          Sid: 'test-call-sid-789',
          Status: 'queued'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await triggerExotelCall({
        phoneNumber: '919876543210'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('From=919876543210')
        })
      );
    });

    it('should handle invalid phone number format', async () => {
      const result = await triggerExotelCall({
        phoneNumber: '123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        RestException: {
          Message: 'Invalid caller ID'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse
      });

      const result = await triggerExotelCall({
        phoneNumber: '9876543210'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid caller ID');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await triggerExotelCall({
        phoneNumber: '9876543210'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should include proper authentication headers', async () => {
      const mockResponse = {
        Call: {
          Sid: 'test-call-sid',
          Status: 'queued'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await triggerExotelCall({
        phoneNumber: '9876543210'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /),
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      );
    });
  });

  describe('triggerBulkCalls', () => {
    it('should trigger multiple calls sequentially', async () => {
      const mockResponse = {
        Call: {
          Sid: 'test-call-sid',
          Status: 'queued'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const contacts = [
        { phoneNumber: '9876543210', contactName: 'User 1' },
        { phoneNumber: '9876543211', contactName: 'User 2' },
        { phoneNumber: '9876543212', contactName: 'User 3' }
      ];

      const results = await triggerBulkCalls(contacts, undefined, 0); // 0 delay for testing

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should call progress callback for each contact', async () => {
      const mockResponse = {
        Call: {
          Sid: 'test-call-sid',
          Status: 'queued'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const contacts = [
        { phoneNumber: '9876543210' },
        { phoneNumber: '9876543211' }
      ];

      const progressCallback = jest.fn();

      await triggerBulkCalls(contacts, progressCallback, 0);

      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(1, 2, expect.any(Object));
      expect(progressCallback).toHaveBeenCalledWith(2, 2, expect.any(Object));
    });

    it('should continue calling even if one call fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ Call: { Sid: 'sid1', Status: 'queued' } })
        })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ Call: { Sid: 'sid3', Status: 'queued' } })
        });

      const contacts = [
        { phoneNumber: '9876543210' },
        { phoneNumber: '9876543211' },
        { phoneNumber: '9876543212' }
      ];

      const results = await triggerBulkCalls(contacts, undefined, 0);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('validateExotelConfig', () => {
    it('should validate configuration successfully', () => {
      const result = validateExotelConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // Note: This test would require mocking environment variables
    // For now, we're assuming default config values are present
  });

  describe('Phone number formatting', () => {
    it('should format 10-digit number correctly', async () => {
      const mockResponse = {
        Call: { Sid: 'sid', Status: 'queued' }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      await triggerExotelCall({ phoneNumber: '9876543210' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].body).toContain('From=919876543210');
    });

    it('should handle number starting with 0', async () => {
      const mockResponse = {
        Call: { Sid: 'sid', Status: 'queued' }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      await triggerExotelCall({ phoneNumber: '09876543210' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].body).toContain('From=919876543210');
    });

    it('should handle number with spaces and dashes', async () => {
      const mockResponse = {
        Call: { Sid: 'sid', Status: 'queued' }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      await triggerExotelCall({ phoneNumber: '987-654-3210' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].body).toContain('From=919876543210');
    });
  });
});
