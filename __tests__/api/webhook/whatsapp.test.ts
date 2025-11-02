/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/webhook/whatsapp/route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

describe('/api/webhook/whatsapp', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        process.env.WHATSAPP_TOKEN = 'test-token-123';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('POST', () => {
        it('should successfully send WhatsApp message with valid phone number', async () => {
            process.env.WHATSAPP_TOKEN = 'test-token-123';
            
            const mockResponse = {
                messaging_product: 'whatsapp',
                contacts: [{ input: '919953969666', wa_id: '919953969666' }],
                messages: [{ id: 'wamid.test123' }],
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                method: 'POST',
                body: JSON.stringify({ phoneNumber: '919953969666' }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.message).toBe('WhatsApp message sent successfully');
            expect(data.data).toEqual(mockResponse);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://graph.facebook.com/v18.0/788971100971297/messages',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token-123',
                    },
                }),
            );
        });

        it('should return error when phone number is missing', async () => {
            process.env.WHATSAPP_TOKEN = 'test-token-123';
            
            const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.message).toBe('Phone number is required');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should return error for invalid phone number format', async () => {
            process.env.WHATSAPP_TOKEN = 'test-token-123';
            
            const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                method: 'POST',
                body: JSON.stringify({ phoneNumber: '123' }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.message).toBe('Invalid phone number format');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should return error when WhatsApp token is not configured', async () => {
            delete process.env.WHATSAPP_TOKEN;

            const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                method: 'POST',
                body: JSON.stringify({ phoneNumber: '919953969666' }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
            expect(data.message).toBe('WhatsApp token not configured');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should handle WhatsApp API error responses', async () => {
            process.env.WHATSAPP_TOKEN = 'test-token-123';
            
            const mockError = {
                error: {
                    message: 'Invalid token',
                    type: 'OAuthException',
                    code: 190,
                },
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => mockError,
            });

            const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                method: 'POST',
                body: JSON.stringify({ phoneNumber: '919953969666' }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.message).toBe('Failed to send WhatsApp message');
            expect(data.error).toBe('Invalid token');
        });

        it('should handle network errors gracefully', async () => {
            process.env.WHATSAPP_TOKEN = 'test-token-123';
            
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                method: 'POST',
                body: JSON.stringify({ phoneNumber: '919953969666' }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
            expect(data.message).toBe('Internal server error');
            expect(data.error).toBe('Network error');
        });

        it('should handle invalid JSON in request body', async () => {
            process.env.WHATSAPP_TOKEN = 'test-token-123';
            
            const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                method: 'POST',
                body: 'invalid json',
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.message).toBe('Invalid request body');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should validate phone number with country code', async () => {
            process.env.WHATSAPP_TOKEN = 'test-token-123';
            
            const validPhoneNumbers = ['919953969666', '12025551234', '442071838750'];

            for (const phoneNumber of validPhoneNumbers) {
                (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({ success: true }),
                });

                const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                    method: 'POST',
                    body: JSON.stringify({ phoneNumber }),
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
            }
        });

        it('should reject phone numbers without proper format', async () => {
            process.env.WHATSAPP_TOKEN = 'test-token-123';
            
            const invalidPhoneNumbers = ['123', 'abc123', '+91-9953969666', '(919) 953-9666'];

            for (const phoneNumber of invalidPhoneNumbers) {
                const request = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
                    method: 'POST',
                    body: JSON.stringify({ phoneNumber }),
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.success).toBe(false);
                expect(data.message).toBe('Invalid phone number format');
            }
        });
    });

    describe('GET', () => {
        it('should return webhook information', async () => {
            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.message).toBe('WhatsApp webhook is running');
            expect(data.endpoint).toBe('/api/webhook/whatsapp');
            expect(data.method).toBe('POST');
            expect(data.requiredFields).toEqual(['phoneNumber']);
        });
    });
});
