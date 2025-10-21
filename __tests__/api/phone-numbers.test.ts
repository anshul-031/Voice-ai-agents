/**
 * @jest-environment node
 */
import { DELETE, GET, POST, PUT } from '@/app/api/phone-numbers/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb', () => jest.fn());

const mockPhoneNumberInstance = {
  _id: { toString: () => 'phone1' },
  save: jest.fn().mockResolvedValue({
    _id: { toString: () => 'phone1' },
    webhookUrl: 'https://example.com/api/telephony/webhook/phone_123',
    websocketUrl: 'wss://example.com/api/telephony/ws/phone_123',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};

jest.mock('@/models/PhoneNumber', () => {
  const MockPhoneNumber = jest.fn().mockImplementation((data) => ({
    ...data,
    ...mockPhoneNumberInstance,
  })) as any;
  MockPhoneNumber.find = jest.fn();
  MockPhoneNumber.findOne = jest.fn();
  MockPhoneNumber.findByIdAndUpdate = jest.fn();
  MockPhoneNumber.findByIdAndDelete = jest.fn();
  return MockPhoneNumber;
});

const mockDbConnect = require('@/lib/mongodb');
const mockPhoneNumber = require('@/models/PhoneNumber');

describe('/api/phone-numbers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('GET', () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    afterEach(() => {
      if (originalAppUrl === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
      }
    });

    it('should return phone numbers successfully', async () => {
      const mockPhoneNumbers = [
        {
          _id: { toString: () => 'phone1' },
          userId: 'user1',
          phoneNumber: '+1234567890',
          provider: 'exotel',
          displayName: 'Test Phone',
          exotelConfig: { apiKey: 'key123', apiToken: 'token123' },
          linkedAgentId: 'agent1',
          webhookUrl: 'http://example.com/webhook',
          websocketUrl: 'ws://example.com/ws',
          status: 'active',
          lastUsed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPhoneNumbers),
      };
      mockPhoneNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/phone-numbers?userId=user1');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBe('user1');
      expect(data.count).toBe(1);
      expect(mockPhoneNumber.find).toHaveBeenCalledWith({ userId: 'user1' });
    });

    it('should use default userId when not provided', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockPhoneNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/phone-numbers');

      await GET(request);

      expect(mockPhoneNumber.find).toHaveBeenCalledWith({ userId: 'mukul' });
    });

    it('should return 500 on database error', async () => {
      mockDbConnect.mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost/api/phone-numbers');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch phone numbers');
    });

    it('should return 500 on non-Error database error', async () => {
      mockDbConnect.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost/api/phone-numbers');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch phone numbers');
      expect(data.details).toBe('Unknown error');
    });

    it('should retain existing webhook values when identifier cannot be derived', async () => {
      const mockPhoneNumbers = [
        {
          _id: { toString: () => 'phone-missing-identifier' },
          userId: 'user-missing',
          phoneNumber: '+1010101010',
          provider: 'exotel',
          displayName: 'Missing Identifier',
          exotelConfig: undefined,
          linkedAgentId: undefined,
          webhookIdentifier: undefined,
          webhookUrl: undefined,
          websocketUrl: undefined,
          status: 'inactive',
          lastUsed: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPhoneNumbers),
      };
      mockPhoneNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/phone-numbers');

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.phoneNumbers[0].webhookUrl).toBeUndefined();
      expect(data.phoneNumbers[0].websocketUrl).toBeUndefined();
    });

    it('should derive webhook URLs from NEXT_PUBLIC_APP_URL and trim trailing slashes', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://my-app.example.com/';

      const mockPhoneNumbers = [
        {
          _id: { toString: () => 'phone-env' },
          userId: 'user-env',
          phoneNumber: '+1987654321',
          provider: 'exotel',
          displayName: 'Env Phone',
          exotelConfig: {
            apiKey: 'envkey1234',
            apiToken: 'envtoken5678',
            sid: 'sid123',
            appId: 'app123',
            domain: 'example',
            region: 'in',
          },
          linkedAgentId: undefined,
          webhookIdentifier: 'env-identifier',
          webhookUrl: undefined,
          websocketUrl: undefined,
          status: 'active',
          lastUsed: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPhoneNumbers),
      };
      mockPhoneNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.phoneNumbers[0].webhookUrl).toBe('https://my-app.example.com/api/telephony/webhook/env-identifier');
      expect(data.phoneNumbers[0].websocketUrl).toBe('wss://my-app.example.com/api/telephony/ws/env-identifier');
    });

    it('should fall back to forwarded origin when app URL is placeholder and derive identifier from websocket URL', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://your-domain.com';

      const mockPhoneNumbers = [
        {
          _id: { toString: () => 'phone-fallback' },
          userId: 'user-fallback',
          phoneNumber: '+1098765432',
          provider: 'custom',
          displayName: 'Fallback Phone',
          exotelConfig: undefined,
          linkedAgentId: undefined,
          webhookIdentifier: undefined,
          webhookUrl: undefined,
          websocketUrl: 'ws://legacy-host/api/telephony/ws/fallback-identifier',
          status: 'active',
          lastUsed: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPhoneNumbers),
      };
      mockPhoneNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        headers: {
          'x-forwarded-host': 'edge.example.net',
          'x-forwarded-proto': 'http',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.phoneNumbers[0].webhookUrl).toBe('http://edge.example.net/api/telephony/webhook/fallback-identifier');
      expect(data.phoneNumbers[0].websocketUrl).toBe('ws://edge.example.net/api/telephony/ws/fallback-identifier');
    });
  });

  describe('POST', () => {
    it('should create phone number successfully', async () => {
      const newPhoneData = {
        userId: 'user1',
        phoneNumber: '+1234567890',
        provider: 'exotel',
        displayName: 'Test Phone',
        exotelConfig: { apiKey: 'key123', apiToken: 'token123' },
        linkedAgentId: 'agent1',
      };

      mockPhoneNumber.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue({
        _id: { toString: () => 'phone1' },
        ...newPhoneData,
        webhookUrl: 'https://example.com/api/telephony/webhook/phone_123',
        websocketUrl: 'wss://example.com/api/telephony/ws/phone_123',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPhoneNumber.prototype.save = mockSave;

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'POST',
        body: JSON.stringify(newPhoneData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber.phoneNumber).toBe('+1234567890');
      expect(mockPhoneNumber.findOne).toHaveBeenCalledWith({ phoneNumber: '+1234567890' });
    });

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: phoneNumber, displayName');
    });

    it('should return 400 if phone number already exists', async () => {
      mockPhoneNumber.findOne.mockResolvedValue({ _id: 'existing' });

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '+1234567890',
          displayName: 'Test Phone',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Phone number already exists');
    });

    it('should ignore exotel config for non-exotel providers', async () => {
      mockPhoneNumber.findOne.mockResolvedValue(null);
      const customSave = jest.fn().mockResolvedValue({
        _id: { toString: () => 'phone-custom' },
        userId: 'mukul',
        phoneNumber: '+1555000111',
        provider: 'custom',
        displayName: 'Custom Provider',
        exotelConfig: undefined,
        linkedAgentId: undefined,
        webhookUrl: 'https://example.com/api/telephony/webhook/phone_custom',
        websocketUrl: 'wss://example.com/api/telephony/ws/phone_custom',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPhoneNumber.prototype.save = customSave;

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '+1555000111',
          displayName: 'Custom Provider',
          provider: 'custom',
          exotelConfig: { apiKey: 'unused', apiToken: 'unused' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber.provider).toBe('custom');
      expect(data.phoneNumber.exotelConfig).toBeUndefined();
    });

    it('should return 500 on database error', async () => {
      mockPhoneNumber.findOne.mockResolvedValue(null);
      mockPhoneNumberInstance.save.mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          phoneNumber: '+1234567890',
          provider: 'exotel',
          displayName: 'Test Phone',
          hasExotelConfig: true,
          linkedAgentId: 'agent1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create phone number');
    });

    it('should return 500 on non-Error database error for POST', async () => {
      mockPhoneNumber.findOne.mockResolvedValue(null);
      mockPhoneNumberInstance.save.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          phoneNumber: '+1234567890',
          provider: 'exotel',
          displayName: 'Test Phone',
          hasExotelConfig: true,
          linkedAgentId: 'agent1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create phone number');
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('PUT', () => {
    it('should update phone number successfully', async () => {
      const updateData = {
        id: 'phone1',
        displayName: 'Updated Phone',
        status: 'inactive',
      };

      const mockUpdatedPhone = {
        _id: { toString: () => 'phone1' },
        userId: 'user1',
        phoneNumber: '+1234567890',
        displayName: 'Updated Phone',
        status: 'inactive',
        updatedAt: new Date(),
      };

      mockPhoneNumber.findByIdAndUpdate.mockResolvedValue(mockUpdatedPhone);

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.phoneNumber.displayName).toBe('Updated Phone');
      expect(mockPhoneNumber.findByIdAndUpdate).toHaveBeenCalledWith(
        'phone1',
        expect.objectContaining({ displayName: 'Updated Phone', status: 'inactive' }),
        { new: true, runValidators: true }
      );
    });

    it('should return 400 for missing id', async () => {
      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'PUT',
        body: JSON.stringify({ displayName: 'Test' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: id');
    });

    it('should return 404 if phone number not found', async () => {
      mockPhoneNumber.findByIdAndUpdate.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'PUT',
        body: JSON.stringify({ id: 'nonexistent' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Phone number not found');
    });

    it('should return 500 on database error', async () => {
      mockPhoneNumber.findByIdAndUpdate.mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'phone1',
          displayName: 'Updated Phone',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update phone number');
    });

    it('should return 500 on non-Error database error for PUT', async () => {
      mockPhoneNumber.findByIdAndUpdate.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'phone1',
          displayName: 'Updated Phone',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update phone number');
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('DELETE', () => {
    it('should delete phone number successfully', async () => {
      mockPhoneNumber.findByIdAndDelete.mockResolvedValue({ _id: 'phone1' });

      const request = new NextRequest('http://localhost/api/phone-numbers?id=phone1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Phone number deleted successfully');
      expect(mockPhoneNumber.findByIdAndDelete).toHaveBeenCalledWith('phone1');
    });

    it('should return 400 for missing id', async () => {
      const request = new NextRequest('http://localhost/api/phone-numbers', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Phone number ID is required');
    });

    it('should return 404 if phone number not found', async () => {
      mockPhoneNumber.findByIdAndDelete.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/phone-numbers?id=nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Phone number not found');
    });

    it('should return 500 on database error', async () => {
      mockPhoneNumber.findByIdAndDelete.mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost/api/phone-numbers?id=phone1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete phone number');
    });

    it('should return 500 on non-Error database error for DELETE', async () => {
      mockPhoneNumber.findByIdAndDelete.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost/api/phone-numbers?id=phone1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete phone number');
      expect(data.details).toBe('Unknown error');
    });
  });
});