/**
 * @jest-environment node
 */
import { POST } from '@/app/api/campaigns/[campaignId]/retrigger/route';
import dbConnect from '@/lib/dbConnect';
import Campaign from '@/models/Campaign';
import CampaignContact from '@/models/CampaignContact';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/dbConnect');
jest.mock('@/models/Campaign');
jest.mock('@/models/CampaignContact');

describe('/api/campaigns/[campaignId]/retrigger', () => {
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
  const mockCampaign = Campaign as jest.Mocked<typeof Campaign>;
  const mockCampaignContact = CampaignContact as jest.Mocked<typeof CampaignContact>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined as any);
  });

  describe('POST', () => {
    it('should return 400 when campaignId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/campaigns//retrigger', {
        method: 'POST',
      });
      const context = { params: Promise.resolve({ campaignId: '' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Campaign ID is required');
    });

    it('should return 404 when campaign is not found', async () => {
      mockCampaign.findById = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/campaigns/invalid-id/retrigger', {
        method: 'POST',
      });
      const context = { params: Promise.resolve({ campaignId: 'invalid-id' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Campaign not found');
    });

    it('should retrigger failed calls successfully', async () => {
      const mockCampaignData = {
        _id: 'campaign-123',
        title: 'Test Campaign',
        status: 'completed',
        total_contacts: 5,
        calls_completed: 0,
        calls_failed: 0,
        started_at: null,
        updated_at: null,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockContacts = [
        { _id: '1', campaign_id: 'campaign-123', phone_number: '+1234567890' },
        { _id: '2', campaign_id: 'campaign-123', phone_number: '+1234567891' },
        { _id: '3', campaign_id: 'campaign-123', phone_number: '+1234567892' },
        { _id: '4', campaign_id: 'campaign-123', phone_number: '+1234567893' },
        { _id: '5', campaign_id: 'campaign-123', phone_number: '+1234567894' },
      ];

      mockCampaign.findById = jest.fn().mockResolvedValue(mockCampaignData);
      mockCampaignContact.find = jest.fn().mockResolvedValue(mockContacts);
      mockCampaignContact.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 5 });

      const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-123/retrigger', {
        method: 'POST',
      });
      const context = { params: Promise.resolve({ campaignId: 'campaign-123' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total_contacts).toBe(5);
    });

    it('should handle database errors during retrigger', async () => {
      mockCampaign.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-123/retrigger', {
        method: 'POST',
      });
      const context = { params: Promise.resolve({ campaignId: 'campaign-123' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });

    it('should handle non-Error exceptions', async () => {
      mockCampaign.findById = jest.fn().mockRejectedValue({ message: 'Custom error object' });

      const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-123/retrigger', {
        method: 'POST',
      });
      const context = { params: Promise.resolve({ campaignId: 'campaign-123' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to retrigger campaign');
    });
  });
});
