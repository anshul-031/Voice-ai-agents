/**
 * @jest-environment node
 */

import { GET } from '@/app/api/campaigns/[campaignId]/status/route';
import dbConnect from '@/lib/dbConnect';
import Campaign from '@/models/Campaign';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/dbConnect');
jest.mock('@/models/Campaign');

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockCampaign = Campaign as jest.Mocked<typeof Campaign>;

describe('GET /api/campaigns/[campaignId]/status', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDbConnect.mockResolvedValue(undefined as any);
    });

    it('should return 400 if campaignId is missing', async () => {
        const request = new NextRequest('http://localhost/api/campaigns//status', {
            method: 'GET',
        });
        const context = { params: Promise.resolve({ campaignId: '' }) };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Campaign ID is required');
    });

    it('should return 404 if campaign is not found', async () => {
        mockCampaign.findById = jest.fn().mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/campaigns/123/status', {
            method: 'GET',
        });
        const context = { params: Promise.resolve({ campaignId: '123' }) };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Campaign not found');
        expect(mockCampaign.findById).toHaveBeenCalledWith('123');
    });

    it('should return campaign status successfully', async () => {
        const mockCampaignData = {
            _id: '123',
            title: 'Test Campaign',
            status: 'running',
            total_contacts: 100,
            calls_completed: 50,
            calls_failed: 5,
            started_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-02'),
        };

        mockCampaign.findById = jest.fn().mockResolvedValue(mockCampaignData);

        const request = new NextRequest('http://localhost/api/campaigns/123/status', {
            method: 'GET',
        });
        const context = { params: Promise.resolve({ campaignId: '123' }) };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toMatchObject({
            _id: '123',
            title: 'Test Campaign',
            status: 'running',
            total_contacts: 100,
            calls_completed: 50,
            calls_failed: 5,
        });
        expect(data.data.started_at).toBeDefined();
        expect(data.data.updated_at).toBeDefined();
        expect(mockCampaign.findById).toHaveBeenCalledWith('123');
    });

    it('should return campaign status with completed status', async () => {
        const mockCampaignData = {
            _id: '456',
            title: 'Completed Campaign',
            status: 'completed',
            total_contacts: 100,
            calls_completed: 100,
            calls_failed: 0,
            started_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-02'),
        };

        mockCampaign.findById = jest.fn().mockResolvedValue(mockCampaignData);

        const request = new NextRequest('http://localhost/api/campaigns/456/status', {
            method: 'GET',
        });
        const context = { params: Promise.resolve({ campaignId: '456' }) };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('completed');
    });

    it('should handle database errors', async () => {
        mockCampaign.findById = jest.fn().mockRejectedValue(new Error('Database error'));

        const request = new NextRequest('http://localhost/api/campaigns/123/status', {
            method: 'GET',
        });
        const context = { params: Promise.resolve({ campaignId: '123' }) };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Database error');
    });

    it('should connect to database before querying', async () => {
        const mockCampaignData = {
            _id: '123',
            title: 'Test Campaign',
            status: 'running',
            total_contacts: 50,
            calls_completed: 25,
            calls_failed: 2,
            started_at: new Date(),
            updated_at: new Date(),
        };

        mockCampaign.findById = jest.fn().mockResolvedValue(mockCampaignData);

        const request = new NextRequest('http://localhost/api/campaigns/123/status', {
            method: 'GET',
        });
        const context = { params: Promise.resolve({ campaignId: '123' }) };

        await GET(request, context);

        expect(mockDbConnect).toHaveBeenCalled();
    });
});
