/**
 * @jest-environment node
 */

/**
 * Unit tests for Phone Numbers API
 * Tests CRUD operations for phone number management with Exotel integration
 */

import { DELETE, GET, POST, PUT } from '@/app/api/phone-numbers/route';
import dbConnect from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/PhoneNumber');

describe('Phone Numbers API', () => {
    const mockUserId = 'user123';
    const mockPhoneNumber = {
        _id: 'phone123',
        userId: mockUserId,
        phoneNumber: '+1234567890',
        provider: 'exotel',
        exotelConfig: {
            apiKey: 'key123',
            apiToken: 'token123',
            sid: 'sid123',
            domain: 'example.exotel.com',
            region: 'us'
        },
        linkedAgentId: 'agent123',
        webhookUrl: 'https://example.com/api/telephony/webhook/phone123',
        websocketUrl: 'wss://example.com/api/telephony/ws/phone123',
        status: 'active',
        lastUsed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: function() { return { ...this }; }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (dbConnect as jest.Mock).mockResolvedValue(undefined);
    });

    describe('GET - Fetch phone numbers', () => {
        it('should return all phone numbers for a user', async () => {
            const mockFind = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([mockPhoneNumber])
            });
            (PhoneNumber.find as jest.Mock) = mockFind;

            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'GET',
                headers: {
                    'x-user-id': mockUserId
                }
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.phoneNumbers).toHaveLength(1);
            expect(data.phoneNumbers[0].phoneNumber).toBe('+1234567890');
            
            // API key should be masked
            expect(data.phoneNumbers[0].exotelConfig.apiKey).toBe('key***');
            expect(data.phoneNumbers[0].exotelConfig.apiToken).toBe('tok***');
        });

        it('should return 401 if no user ID provided', async () => {
            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'GET'
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('should handle database errors', async () => {
            const mockFind = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });
            (PhoneNumber.find as jest.Mock) = mockFind;

            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'GET',
                headers: {
                    'x-user-id': mockUserId
                }
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to fetch phone numbers');
        });
    });

    describe('POST - Create phone number', () => {
        it('should create a new phone number with Exotel config', async () => {
            const mockSave = jest.fn().mockResolvedValue(mockPhoneNumber);
            (PhoneNumber.prototype.save as jest.Mock) = mockSave;
            (PhoneNumber as any).mockImplementation(() => ({
                ...mockPhoneNumber,
                save: mockSave
            }));

            const requestBody = {
                phoneNumber: '+1234567890',
                provider: 'exotel',
                exotelConfig: {
                    apiKey: 'key123',
                    apiToken: 'token123',
                    sid: 'sid123',
                    domain: 'example.exotel.com',
                    region: 'us'
                }
            };

            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'POST',
                headers: {
                    'x-user-id': mockUserId,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.phoneNumber).toBeDefined();
            expect(data.message).toBe('Phone number added successfully');
        });

        it('should return 400 if phone number is missing', async () => {
            const requestBody = {
                provider: 'exotel'
            };

            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'POST',
                headers: {
                    'x-user-id': mockUserId,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Phone number and provider are required');
        });

        it('should return 401 if no user ID provided', async () => {
            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'POST',
                body: JSON.stringify({ phoneNumber: '+1234567890' })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });
    });

    describe('PUT - Update phone number', () => {
        it('should update phone number and link agent', async () => {
            const mockFindOneAndUpdate = jest.fn().mockResolvedValue(mockPhoneNumber);
            (PhoneNumber.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

            const requestBody = {
                id: 'phone123',
                linkedAgentId: 'agent456',
                status: 'inactive'
            };

            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'PUT',
                headers: {
                    'x-user-id': mockUserId,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.phoneNumber).toBeDefined();
            expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'phone123', userId: mockUserId },
                expect.objectContaining({
                    linkedAgentId: 'agent456',
                    status: 'inactive'
                }),
                { new: true }
            );
        });

        it('should return 400 if ID is missing', async () => {
            const requestBody = {
                status: 'inactive'
            };

            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'PUT',
                headers: {
                    'x-user-id': mockUserId,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Phone number ID is required');
        });

        it('should return 404 if phone number not found', async () => {
            (PhoneNumber.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

            const requestBody = {
                id: 'nonexistent',
                status: 'inactive'
            };

            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'PUT',
                headers: {
                    'x-user-id': mockUserId,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Phone number not found');
        });
    });

    describe('DELETE - Remove phone number', () => {
        it('should delete a phone number', async () => {
            (PhoneNumber.findOneAndDelete as jest.Mock).mockResolvedValue(mockPhoneNumber);

            const url = new URL('http://localhost:3000/api/phone-numbers?id=phone123');
            const request = new NextRequest(url, {
                method: 'DELETE',
                headers: {
                    'x-user-id': mockUserId
                }
            });

            const response = await DELETE(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('Phone number deleted successfully');
            expect(PhoneNumber.findOneAndDelete).toHaveBeenCalledWith({
                _id: 'phone123',
                userId: mockUserId
            });
        });

        it('should return 400 if ID is missing', async () => {
            const request = new NextRequest('http://localhost:3000/api/phone-numbers', {
                method: 'DELETE',
                headers: {
                    'x-user-id': mockUserId
                }
            });

            const response = await DELETE(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Phone number ID is required');
        });

        it('should return 404 if phone number not found', async () => {
            (PhoneNumber.findOneAndDelete as jest.Mock).mockResolvedValue(null);

            const url = new URL('http://localhost:3000/api/phone-numbers?id=nonexistent');
            const request = new NextRequest(url, {
                method: 'DELETE',
                headers: {
                    'x-user-id': mockUserId
                }
            });

            const response = await DELETE(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Phone number not found');
        });
    });
});
