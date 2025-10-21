/**
 * @jest-environment node
 */
import { DELETE, GET, POST, PUT } from '@/app/api/whatsapp-numbers/route';
import { NextRequest } from 'next/server';

const mockWhatsAppNumberInstance = {
  _id: { toString: () => 'wa1' },
  save: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/whatsappUtils', () => {
  const actual = jest.requireActual('@/lib/whatsappUtils');
  return {
    __esModule: true,
    ...actual,
    normalizeWhatsAppNumber: jest.fn(actual.normalizeWhatsAppNumber),
  };
});

const actualWhatsAppUtils = jest.requireActual('@/lib/whatsappUtils');
const whatsappUtils = require('@/lib/whatsappUtils');

jest.mock('@/lib/mongodb', () => jest.fn());

jest.mock('@/models/WhatsAppNumber', () => {
  const MockModel = jest.fn().mockImplementation((data) => ({
    ...data,
    ...mockWhatsAppNumberInstance,
  })) as any;
  MockModel.find = jest.fn();
  MockModel.findOne = jest.fn();
  MockModel.findByIdAndUpdate = jest.fn();
  MockModel.findByIdAndDelete = jest.fn();
  MockModel.exists = jest.fn();
  MockModel.create = jest.fn();
  return MockModel;
});

const mockDbConnect = require('@/lib/mongodb');
const mockWhatsAppNumber = require('@/models/WhatsAppNumber');

describe('/api/whatsapp-numbers', () => {

  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockWhatsAppNumberInstance.save.mockResolvedValue(undefined);
    (whatsappUtils.normalizeWhatsAppNumber as jest.Mock).mockImplementation(actualWhatsAppUtils.normalizeWhatsAppNumber);
  });

  describe('GET', () => {
    it('returns WhatsApp numbers successfully and masks secrets', async () => {
      mockWhatsAppNumber.exists.mockResolvedValue(true);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            _id: { toString: () => 'wa1' },
            userId: 'user1',
            phoneNumber: '+919873016484',
            phoneNumberId: '12345',
            displayName: 'Support',
            linkedAgentId: 'agent1',
            webhookUrl: 'https://example.com/api/meta-webhook',
            status: 'active',
            metaConfig: {
              appId: 'app-123456',
              appSecret: 'secret-9876',
              businessId: 'biz-6789',
              accessToken: 'token-4321',
              graphApiVersion: 'v20.0',
            },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
          },
        ]),
      };
      mockWhatsAppNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/whatsapp-numbers?userId=user1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBe('user1');
      expect(data.count).toBe(1);
      expect(data.whatsappNumbers[0].metaConfig.appId).toBe('***3456');
  expect(data.whatsappNumbers[0].webhookUrl).toBe('/api/meta-webhook');
      expect(mockWhatsAppNumber.find).toHaveBeenCalledWith({ userId: 'user1' });
      expect(mockWhatsAppNumber.exists).toHaveBeenCalledWith({ phoneNumber: '+919873016484' });
    });

    it('creates mock number when missing', async () => {
      mockWhatsAppNumber.exists.mockResolvedValue(false);
      mockWhatsAppNumber.create.mockResolvedValue(undefined);
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockWhatsAppNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/whatsapp-numbers');
      await GET(request);

      expect(mockWhatsAppNumber.exists).toHaveBeenCalled();
      expect(mockWhatsAppNumber.create).toHaveBeenCalled();
    });

    it('returns 500 when db connection fails', async () => {
      mockDbConnect.mockRejectedValue(new Error('db failure'));

      const request = new NextRequest('http://localhost/api/whatsapp-numbers');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch WhatsApp numbers');
    });

    it('skips creating a mock number when normalization returns empty', async () => {
      (whatsappUtils.normalizeWhatsAppNumber as jest.Mock).mockReturnValueOnce('');
      mockWhatsAppNumber.exists.mockResolvedValue(false);
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockWhatsAppNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/whatsapp-numbers');
      await GET(request);

      expect(mockWhatsAppNumber.exists).not.toHaveBeenCalled();
      expect(mockWhatsAppNumber.create).not.toHaveBeenCalled();
    });

    it('preserves original webhook value when parsing fails', async () => {
      mockWhatsAppNumber.exists.mockResolvedValue(true);
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            _id: { toString: () => 'wa1' },
            userId: 'user1',
            phoneNumber: '+123',
            status: 'active',
            webhookUrl: 'not a valid url',
            metaConfig: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };
      mockWhatsAppNumber.find.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/whatsapp-numbers?userId=user1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.whatsappNumbers[0].webhookUrl).toBe('not a valid url');
    });
  });

  describe('POST', () => {
    it('persists a new WhatsApp number', async () => {
      mockWhatsAppNumber.exists.mockResolvedValue(true);
      mockWhatsAppNumber.findOne.mockResolvedValue(null);
      mockWhatsAppNumberInstance.save.mockImplementation(() => {
        return Promise.resolve({
          ...mockWhatsAppNumberInstance,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const payload = {
        phoneNumber: '+91-98730 16484',
        phoneNumberId: '12345',
        displayName: 'Support Line',
        metaConfig: {
          appId: 'appId',
          appSecret: 'appSecret',
          businessId: 'businessId',
          accessToken: 'accessToken',
          graphApiVersion: 'v19.0',
        },
      };

      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWhatsAppNumber.findOne).toHaveBeenCalledWith({ phoneNumber: '+919873016484' });
      expect(mockWhatsAppNumber).toHaveBeenCalledWith(expect.objectContaining({
        phoneNumber: '+919873016484',
        phoneNumberId: '12345',
        webhookUrl: '/api/meta-webhook',
        metaConfig: expect.objectContaining({
          graphApiVersion: 'v19.0',
        }),
      }));
    });

    it('validates required meta fields', async () => {
      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '+91 1234567890',
          metaConfig: { appId: 'x' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required meta configuration fields');
    });

    it('rejects missing or invalid phone numbers', async () => {
      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '',
          phoneNumberId: '123',
          metaConfig: {
            appId: 'app',
            appSecret: 'secret',
            businessId: 'biz',
            accessToken: 'token',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing or invalid phoneNumber');
    });

    it('requires phoneNumberId when creating', async () => {
      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '+91 98730 16484',
          metaConfig: {
            appId: 'app',
            appSecret: 'secret',
            businessId: 'biz',
            accessToken: 'token',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('phoneNumberId is required');
    });

    it('returns 400 when number already exists', async () => {
      mockWhatsAppNumber.exists.mockResolvedValue(true);
      mockWhatsAppNumber.findOne.mockResolvedValue({ _id: 'wa1' });

      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '+91 98730 16484',
          phoneNumberId: 'meta-1',
          metaConfig: {
            appId: 'app',
            appSecret: 'secret',
            businessId: 'biz',
            accessToken: 'token',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('WhatsApp number already exists');
    });

    it('returns 500 when persistence fails', async () => {
      mockWhatsAppNumber.exists.mockResolvedValue(true);
      mockWhatsAppNumber.findOne.mockResolvedValue(null);
      mockWhatsAppNumberInstance.save.mockRejectedValue(new Error('save error'));

      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '+91 98730 16484',
          phoneNumberId: '123',
          metaConfig: {
            appId: 'app',
            appSecret: 'secret',
            businessId: 'biz',
            accessToken: 'token',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create WhatsApp number');
    });

    it('defaults graph version when not supplied', async () => {
      mockWhatsAppNumber.exists.mockResolvedValue(true);
      mockWhatsAppNumber.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '+91 98730 16484',
          phoneNumberId: 'meta-1',
          metaConfig: {
            appId: 'app',
            appSecret: 'secret',
            businessId: 'biz',
            accessToken: 'token',
          },
        }),
      });

      await POST(request);

      expect(mockWhatsAppNumber).toHaveBeenCalledWith(expect.objectContaining({
        metaConfig: expect.objectContaining({ graphApiVersion: 'v20.0' }),
      }));
    });
  });

  describe('PUT', () => {
    it('updates fields when valid', async () => {
      mockWhatsAppNumber.findByIdAndUpdate.mockResolvedValue({
        _id: { toString: () => 'wa1' },
        userId: 'user1',
        phoneNumber: '+919873016484',
        status: 'inactive',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'wa1',
          displayName: 'Updated Name',
          status: 'inactive',
          metaConfig: {
            appId: 'newApp',
            appSecret: 'newSecret',
            businessId: 'newBiz',
            accessToken: 'newToken',
          },
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWhatsAppNumber.findByIdAndUpdate).toHaveBeenCalledWith(
        'wa1',
        expect.objectContaining({
          displayName: 'Updated Name',
          status: 'inactive',
          metaConfig: expect.objectContaining({ appId: 'newApp' }),
        }),
        { new: true, runValidators: true },
      );
    });

    it('returns 400 when id missing', async () => {
      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'PUT',
        body: JSON.stringify({ displayName: 'Name' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: id');
    });

    it('returns 404 when number missing', async () => {
      mockWhatsAppNumber.findByIdAndUpdate.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'PUT',
        body: JSON.stringify({ id: 'na' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('WhatsApp number not found');
    });

    it('returns 500 on update failure', async () => {
      mockWhatsAppNumber.findByIdAndUpdate.mockRejectedValue(new Error('update error'));

      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'PUT',
        body: JSON.stringify({ id: 'wa1' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update WhatsApp number');
    });

    it('ignores invalid status and empty meta updates', async () => {
      mockWhatsAppNumber.findByIdAndUpdate.mockResolvedValue({
        _id: { toString: () => 'wa1' },
        userId: 'user1',
        phoneNumber: '+919873016484',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/whatsapp-numbers', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'wa1',
          status: 'pending',
          linkedAgentId: '',
          metaConfig: {},
          phoneNumberId: '  pn-1  ',
        }),
      });

      await PUT(request);

      expect(mockWhatsAppNumber.findByIdAndUpdate).toHaveBeenCalledWith(
        'wa1',
        expect.objectContaining({
          linkedAgentId: undefined,
          phoneNumberId: 'pn-1',
        }),
        { new: true, runValidators: true },
      );
      const updateArg = (mockWhatsAppNumber.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updateArg.status).toBeUndefined();
      expect(updateArg.metaConfig).toBeUndefined();
    });
  });

  describe('DELETE', () => {
    it('removes a WhatsApp number', async () => {
      mockWhatsAppNumber.findByIdAndDelete.mockResolvedValue({ _id: 'wa1' });

      const request = new NextRequest('http://localhost/api/whatsapp-numbers?id=wa1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWhatsAppNumber.findByIdAndDelete).toHaveBeenCalledWith('wa1');
    });

    it('validates id for delete', async () => {
      const request = new NextRequest('http://localhost/api/whatsapp-numbers', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('WhatsApp number ID is required');
    });

    it('returns 404 when delete target missing', async () => {
      mockWhatsAppNumber.findByIdAndDelete.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/whatsapp-numbers?id=missing', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('WhatsApp number not found');
    });

    it('returns 500 when delete fails', async () => {
      mockWhatsAppNumber.findByIdAndDelete.mockRejectedValue(new Error('delete error'));

      const request = new NextRequest('http://localhost/api/whatsapp-numbers?id=wa1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete WhatsApp number');
    });
  });
});
