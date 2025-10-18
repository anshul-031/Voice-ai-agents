/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/telephony/webhook/[phoneId]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb', () => jest.fn());
jest.mock('@/models/PhoneNumber', () => ({
  findOne: jest.fn(),
  prototype: { save: jest.fn() },
}));
jest.mock('@/models/VoiceAgent', () => ({
  findById: jest.fn(),
  findOne: jest.fn(() => ({
    sort: jest.fn().mockReturnThis(),
  })),
}));
jest.mock('@/models/Chat', () => ({
  create: jest.fn(),
}));

const mockDbConnect = require('@/lib/mongodb');
const mockPhoneNumber = require('@/models/PhoneNumber');
const mockVoiceAgent = require('@/models/VoiceAgent');
const mockChat = require('@/models/Chat');

describe('/api/telephony/webhook/[phoneId]', () => {
  const mockParams = { phoneId: 'test-phone-123' };
  const mockContext = { params: Promise.resolve(mockParams) };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('GET', () => {
    it('should return active status', async () => {
      const request = new NextRequest('http://localhost/api/telephony/webhook/test-phone-123');

      const response = await GET(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('active');
      expect(data.phoneId).toBe('test-phone-123');
      expect(data.message).toBe('Exotel webhook endpoint is active');
    });
  });

  describe('POST', () => {
    it('should handle form-urlencoded webhook successfully', async () => {
      const formDataString = 'CallSid=call123&From=%2B1234567890&To=%2B0987654321&Status=ringing';

      const mockPhone = {
        _id: 'phone123',
        userId: 'user1',
        linkedAgentId: 'agent123',
        websocketUrl: 'ws://example.com/ws',
        save: jest.fn().mockResolvedValue(undefined),
      };

      const mockAgent = {
        _id: 'agent123',
        prompt: 'Hello, how can I help you?',
        userId: 'user1',
      };

      mockPhoneNumber.findOne.mockResolvedValue(mockPhone);
      mockVoiceAgent.findById.mockResolvedValue(mockAgent);
      mockChat.create.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/telephony/webhook/test-phone-123', {
        method: 'POST',
        body: formDataString,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });

      const response = await POST(request, mockContext);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/xml');
      expect(text).toContain('<Response>');
      expect(text).toContain('Hello, please wait');
      expect(text).toContain('<Stream url="ws://example.com/ws">');
      expect(mockPhone.save).toHaveBeenCalled();
      expect(mockChat.create).toHaveBeenCalledWith({
        userId: 'user1',
        sessionId: expect.stringContaining('exotel_call123'),
        role: 'system',
        content: 'Call initiated from +1234567890 to +0987654321',
        systemPrompt: 'Hello, how can I help you?',
        timestamp: expect.any(Date),
      });
    });

    it('should handle JSON webhook successfully', async () => {
      const jsonData = {
        CallSid: 'call456',
        From: '+1111111111',
        To: '+2222222222',
        Status: 'in-progress',
      };

      const mockPhone = {
        _id: 'phone456',
        userId: 'user2',
        linkedAgentId: 'agent456',
        websocketUrl: 'ws://example.com/ws2',
        save: jest.fn().mockResolvedValue(undefined),
      };

      const mockAgent = {
        _id: 'agent456',
        prompt: 'नमस्ते, मैं आपकी कैसे मदद कर सकता हूँ?',
        userId: 'user2',
      };

      mockPhoneNumber.findOne.mockResolvedValue(mockPhone);
      mockVoiceAgent.findById.mockResolvedValue(mockAgent);
      mockChat.create.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/telephony/webhook/test-phone-123', {
        method: 'POST',
        body: JSON.stringify(jsonData),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request, mockContext);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toContain('नमस्ते। कृपया प्रतीक्षा करें।');
      expect(text).toContain('<Stream url="ws://example.com/ws2">');
    });

    it('should return 404 if phone number not found', async () => {
      mockPhoneNumber.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/telephony/webhook/test-phone-123', {
        method: 'POST',
        body: JSON.stringify({ CallSid: 'call123' }),
      });

      const response = await POST(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Phone number not found');
    });

    it('should use default agent if no linked agent', async () => {
      const mockPhone = {
        _id: 'phone123',
        userId: 'user1',
        linkedAgentId: null, // No linked agent
        websocketUrl: 'ws://example.com/ws',
        save: jest.fn().mockResolvedValue(undefined),
      };

      const mockDefaultAgent = {
        _id: 'default-agent',
        prompt: 'I am the default agent',
        userId: 'user1',
      };

      const mockFindOne = jest.fn(() => ({
        sort: jest.fn().mockResolvedValue(mockDefaultAgent),
      }));

      mockPhoneNumber.findOne.mockResolvedValue(mockPhone);
      mockVoiceAgent.findById.mockResolvedValue(null); // No linked agent found
      mockVoiceAgent.findOne.mockImplementation(mockFindOne);
      mockChat.create.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/telephony/webhook/test-phone-123', {
        method: 'POST',
        body: 'CallSid=call123&From=%2B1234567890&To=%2B0987654321&Status=ringing',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });

      const response = await POST(request, mockContext);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'user1' });
    });

    it('should return 500 if no agent available', async () => {
      const mockPhone = {
        _id: 'phone123',
        userId: 'user1',
        linkedAgentId: null, // No linked agent
        websocketUrl: 'ws://example.com/ws',
        save: jest.fn().mockResolvedValue(undefined),
      };

      const mockFindOne = jest.fn(() => ({
        sort: jest.fn().mockResolvedValue(null), // No default agent found
      }));

      mockPhoneNumber.findOne.mockResolvedValue(mockPhone);
      mockVoiceAgent.findById.mockResolvedValue(null); // No linked agent found
      mockVoiceAgent.findOne.mockImplementation(mockFindOne);

      const request = new NextRequest('http://localhost/api/telephony/webhook/test-phone-123', {
        method: 'POST',
        body: 'CallSid=call123&From=%2B1234567890&To=%2B0987654321&Status=ringing',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });

      const response = await POST(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No agent configured');
    });

    it('should return 500 on database error', async () => {
      mockDbConnect.mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost/api/telephony/webhook/test-phone-123', {
        method: 'POST',
        body: JSON.stringify({ CallSid: 'call-error' }),
      });

      const response = await POST(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process webhook');
    });

    it('should handle missing websocket URL', async () => {
      const mockPhone = {
        _id: 'phone123',
        userId: 'user1',
        linkedAgentId: 'agent123',
        websocketUrl: null, // Missing websocket URL
        save: jest.fn().mockResolvedValue(undefined),
      };

      const mockAgent = {
        _id: 'agent123',
        prompt: 'Hello, how can I help you?',
        userId: 'user1',
      };

      mockPhoneNumber.findOne.mockResolvedValue(mockPhone);
      mockVoiceAgent.findById.mockResolvedValue(mockAgent);
      mockChat.create.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/telephony/webhook/test-phone-123', {
        method: 'POST',
        body: 'CallSid=call123&From=%2B1234567890&To=%2B0987654321&Status=ringing',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });

      const response = await POST(request, mockContext);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toContain('We are experiencing technical difficulties');
      expect(text).toContain('<Hangup/>');
    });
  });
});