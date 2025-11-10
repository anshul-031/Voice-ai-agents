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

describe('/api/campaigns/[campaignId]/status', () => {
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
  const mockCampaign = Campaign as jest.Mocked<typeof Campaign>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('GET', () => {
    it('should return 400 when campaignId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/campaigns//status');
      const context = { params: Promise.resolve({ campaignId: '' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Campaign ID is required');
    });

    it('should return 404 when campaign is not found', async () => {
      mockCampaign.findById = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/campaigns/invalid-id/status');
      const context = { params: Promise.resolve({ campaignId: 'invalid-id' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Campaign not found');
    });

    it('should return campaign status successfully', async () => {
      const mockCampaignData = {
        _id: 'campaign-123',
        title: 'Test Campaign',
        status: 'running',
        total_contacts: 100,
        calls_completed: 50,
        calls_failed: 5,
        started_at: '2025-11-10T10:00:00.000Z',
        updated_at: '2025-11-10T12:00:00.000Z',
      };

      mockCampaign.findById = jest.fn().mockResolvedValue(mockCampaignData);

      const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-123/status');
      const context = { params: Promise.resolve({ campaignId: 'campaign-123' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCampaignData);
    });

    it('should handle database errors', async () => {
      mockCampaign.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-123/status');
      const context = { params: Promise.resolve({ campaignId: 'campaign-123' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockCampaign.findById = jest.fn().mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-123/status');
      const context = { params: Promise.resolve({ campaignId: 'campaign-123' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unknown error');
    });
  });
});
