/**
 * @jest-environment node
 */

/**
 * Comprehensive Unit Tests for Telephony Webhook Handler
 * Tests complete Exotel integration flow
 */

import { GET, POST } from '@/app/api/telephony/webhook/[phoneId]/route';
import dbConnect from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';
import VoiceAgent from '@/models/VoiceAgent';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/PhoneNumber');
jest.mock('@/models/VoiceAgent');

// Mock global fetch
global.fetch = jest.fn();

describe('Telephony Webhook API - Complete Flow', () => {
    const mockPhoneId = 'phone123';
    const mockPhoneNumber = {
        _id: mockPhoneId,
        userId: 'user123',
        phoneNumber: '+1234567890',
        linkedAgentId: 'agent123',
        webhookUrl: 'https://example.com/api/telephony/webhook/phone123',
        websocketUrl: 'wss://example.com/api/telephony/ws/phone123',
        lastUsed: null,
        save: jest.fn().mockResolvedValue(true),
    };

    const mockAgent = {
        _id: 'agent123',
        name: 'Test Agent',
        prompt: 'नमस्ते। मैं आपकी सहायता के लिए यहाँ हूँ। आप कैसे हैं?',
        voiceId: 'voice123',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (dbConnect as jest.Mock).mockResolvedValue(undefined);
        process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    });

    describe('POST - Initial Call', () => {
        it('should handle initial call and return greeting with Record instruction', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890',
                CallStatus: 'ringing',
            };

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(webhookData).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/xml');
            expect(xmlText).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xmlText).toContain('<Response>');
            expect(xmlText).toContain('<Say');
            expect(xmlText).toContain('नमस्ते');
            expect(xmlText).toContain('<Record');
            expect(xmlText).toContain('maxLength="30"');
            expect(xmlText).toContain(`action="https://example.com/api/telephony/webhook/${mockPhoneId}"`);
            expect(mockPhoneNumber.save).toHaveBeenCalled();
        });

        it('should handle phone number not found', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/nonexistent`,
                {
                    method: 'POST',
                    body: new URLSearchParams({ CallSid: 'call123' }).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: 'nonexistent' }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200); // Still 200 to avoid Exotel retries
            expect(xmlText).toContain('<Response>');
            expect(xmlText).toContain('<Say');
            expect(xmlText).toContain('<Hangup');
        });

        it('should handle no linked agent', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams({ CallSid: 'call123' }).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200);
            expect(xmlText).toContain('<Hangup');
        });
    });

    describe('POST - User Input with Recording', () => {
        it('should process audio recording and return LLM response', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            // Mock STT service response
            (global.fetch as jest.Mock).mockImplementation((url: string) => {
                if (url.includes('/api/telephony/stt')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            success: true,
                            text: 'मुझे लोन चाहिए',
                        }),
                    });
                }
                if (url.includes('/api/llm')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            llmText: 'जी हाँ, मैं आपको लोन के बारे में जानकारी दे सकता हूँ। आपको कितनी राशि चाहिए?',
                        }),
                    });
                }
                return Promise.reject(new Error('Unexpected fetch call'));
            });

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890',
                RecordingUrl: 'https://exotel.com/recordings/rec123.wav',
            };

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200);
            expect(xmlText).toContain('<Say');
            expect(xmlText).toContain('लोन');
            expect(xmlText).toContain('<Record');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/telephony/stt'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('https://exotel.com/recordings/rec123.wav'),
                })
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/llm'),
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('should handle STT service failure gracefully', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                statusText: 'Service Unavailable',
            });

            const webhookData = {
                CallSid: 'call123',
                RecordingUrl: 'https://exotel.com/recordings/rec123.wav',
            };

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200);
            expect(xmlText).toContain('<Hangup');
        });
    });

    describe('POST - User Input with Text (SpeechResult)', () => {
        it('should process speech result directly without STT', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    llmText: 'मैं आपकी मदद कर सकता हूँ।',
                }),
            });

            const webhookData = {
                CallSid: 'call123',
                SpeechResult: 'मुझे सहायता चाहिए',
            };

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200);
            expect(xmlText).toContain('<Say');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/llm'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('मुझे सहायता चाहिए'),
                })
            );
            // Should NOT call STT service for text input
            expect(global.fetch).not.toHaveBeenCalledWith(
                expect.stringContaining('/api/telephony/stt'),
                expect.anything()
            );
        });
    });

    describe('GET - Webhook Verification', () => {
        it('should return active status for webhook verification', async () => {
            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                { method: 'GET' }
            );

            const response = await GET(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.status).toBe('active');
            expect(data.phoneId).toBe(mockPhoneId);
            expect(data.message).toContain('active');
        });
    });

    describe('XML Response Format', () => {
        it('should escape XML special characters in messages', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue({
                ...mockAgent,
                prompt: 'Hello & welcome! Use <tags> "carefully"',
            });

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams({ CallSid: 'call123' }).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(xmlText).toContain('&amp;');
            expect(xmlText).toContain('&lt;');
            expect(xmlText).toContain('&gt;');
            expect(xmlText).toContain('&quot;');
        });

        it('should include proper action URLs for Record tag', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams({ CallSid: 'call123' }).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(xmlText).toContain(`action="https://example.com/api/telephony/webhook/${mockPhoneId}"`);
            expect(xmlText).toContain('method="POST"');
        });
    });

    describe('Session Management', () => {
        it('should generate session ID from CallSid', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ llmText: 'Response' }),
            });

            const webhookData = {
                CallSid: 'UNIQUE_CALL_ID_123',
                SpeechResult: 'test',
            };

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString(),
                }
            );

            await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/llm'),
                expect.objectContaining({
                    body: expect.stringContaining('exotel_UNIQUE_CALL_ID_123'),
                })
            );
        });
    });

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            (dbConnect as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams({ CallSid: 'call123' }).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200);
            expect(xmlText).toContain('<Response>');
            expect(xmlText).toContain('<Hangup');
        });

        it('should handle LLM API errors gracefully', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            const webhookData = {
                CallSid: 'call123',
                SpeechResult: 'test input',
            };

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    body: new URLSearchParams(webhookData).toString(),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            const xmlText = await response.text();

            expect(response.status).toBe(200);
            expect(xmlText).toContain('<Say');
            expect(xmlText).toContain('क्षमा करें');
            expect(xmlText).toContain('<Hangup');
        });
    });

    describe('Content Type Handling', () => {
        it('should handle JSON content type', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            const webhookData = {
                CallSid: 'call123',
                From: '+9876543210',
                To: '+1234567890',
            };

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify(webhookData),
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            
            expect(response.status).toBe(200);
            expect(mockPhoneNumber.save).toHaveBeenCalled();
        });

        it('should handle query parameters when no body', async () => {
            (PhoneNumber.findById as jest.Mock).mockResolvedValue(mockPhoneNumber);
            (VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent);

            const request = new NextRequest(
                `https://example.com/api/telephony/webhook/${mockPhoneId}?CallSid=call123&From=+9876543210`,
                {
                    method: 'POST',
                }
            );

            const response = await POST(request, { params: Promise.resolve({ phoneId: mockPhoneId }) });
            
            expect(response.status).toBe(200);
        });
    });
});
