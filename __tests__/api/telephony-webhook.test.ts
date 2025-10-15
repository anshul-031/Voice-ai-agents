/**
 * @jest-environment node
 */

/**
 * Unit tests for Telephony Webhook Handler
 * Tests Exotel webhook processing, agent linking, and session management
 */

import { GET, POST } from '@/app/api/telephony/webhook/[phoneId]/route';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import PhoneNumber from '@/models/PhoneNumber';
import VoiceAgent from '@/models/VoiceAgent';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/PhoneNumber');
jest.mock('@/models/VoiceAgent');
jest.mock('@/models/Chat');

describe('Telephony Webhook API', () => {
    const mockPhoneId = 'phone123';
    const mockPhoneNumber = {
        _id: mockPhoneId,
        userId: 'user123',
        phoneNumber: '+1234567890',
        linkedAgentId: 'agent123',
        websocketUrl: 'wss://example.com/api/telephony/ws/phone123',
        save: jest.fn().mockResolvedValue(true)
    };

    const mockAgent = {
        _id: 'agent123',
        name: 'Test Agent',
        prompt: 'You are a helpful assistant',
        voiceId: 'voice123'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (dbConnect as jest.Mock).mockResolvedValue(undefined);
    });

    describe('POST - Handle incoming webhook', () => {
        it('should process valid Exotel webhook and return XML response', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890',
                CallStatus: 'ringing',
                Direction: 'inbound'
            };

            const request = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams(webhookData).toString()
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/xml');
            expect(xmlText).toContain('<Response>');
            expect(xmlText).toContain('<Say>');
            expect(xmlText).toContain('<Stream');
            
            // Verify phone number lastUsed was updated
            expect(mockPhoneNumber.save).toHaveBeenCalled();
            
            // Verify NO system message was created (this was the bug we fixed)
            expect(Chat.create).not.toHaveBeenCalled();
        });

        it('should return 404 if phone number not found', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(null);

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890'
            };

            const request = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/nonexistent`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString()
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: 'nonexistent' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toContain('Phone number not found');
        });

        it('should return 404 if linked agent not found', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(null);

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890'
            };

            const request = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString()
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toContain('Agent not found');
        });

        it('should return 400 if phone number has no linked agent', async () => {
            const phoneWithoutAgent = {
                ...mockPhoneNumber,
                linkedAgentId: null
            };
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(phoneWithoutAgent);

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890'
            };

            const request = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString()
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('No agent linked');
        });

        it('should generate unique session IDs for each call', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            const webhookData1 = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890'
            };

            const webhookData2 = {
                CallSid: 'call456',
                From: '+9876543210',
                To: '+1234567890'
            };

            const request1 = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData1).toString()
                }
            );

            const request2 = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData2).toString()
                }
            );

            const response1 = await POST(request1, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const response2 = await POST(request2, { params: Promise.resolve({ phoneId: mockPhoneId }) });

            const xml1 = await response1.text();
            const xml2 = await response2.text();

            // Session IDs should be different for different calls
            expect(xml1).not.toEqual(xml2);
            
            // Both should contain CallSid in session ID
            expect(xml1).toContain('call123');
            expect(xml2).toContain('call456');
        });
    });

    describe('GET - Webhook configuration info', () => {
        it('should return webhook configuration information', async () => {
            const request = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/${mockPhoneId}`,
                { method: 'GET' }
            );

            const response = await GET(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toContain('Webhook endpoint');
            expect(data.phoneId).toBe(mockPhoneId);
            expect(data.instructions).toBeDefined();
        });
    });

    describe('XML Response Generation', () => {
        it('should include agent greeting in Say element', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue({
                ...mockAgent,
                prompt: 'Hello! How can I help you today?'
            });

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890'
            };

            const request = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString()
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(xmlText).toContain('<Say');
            expect(xmlText).toContain('Hello');
        });

        it('should include Stream element with WebSocket URL', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890'
            };

            const request = new NextRequest(
                `http://localhost:3000/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString()
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(xmlText).toContain('<Stream');
            expect(xmlText).toContain('wss://');
        });
    });
});
