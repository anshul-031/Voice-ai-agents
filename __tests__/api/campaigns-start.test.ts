/**
 * Unit tests for Campaign Start API endpoint
 */

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init: any = {}) => ({
      status: init?.status ?? 200,
      body,
      json: async () => body,
    })),
  },
  NextRequest: class MockNextRequest {},
}));

import { POST } from '@/app/api/campaigns/start/route';
import dbConnect from '@/lib/dbConnect';
import Campaign from '@/models/Campaign';
import CampaignContact from '@/models/CampaignContact';

const createRequest = (body: unknown) => ({
  json: jest.fn().mockResolvedValue(body),
}) as any;

// Mock dependencies
jest.mock('@/lib/dbConnect');
jest.mock('@/models/Campaign');
jest.mock('@/models/CampaignContact');
jest.mock('@/lib/exotel');

describe('POST /api/campaigns/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start a campaign successfully', async () => {
    const mockCampaign = {
      _id: 'campaign-123',
      title: 'Test Campaign',
      status: 'stopped',
      started_at: null,
      total_contacts: 0,
      calls_completed: 0,
      calls_failed: 0,
      updated_at: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    const mockContacts = [
      {
        _id: 'contact-1',
        number: '9876543210',
        name: 'User 1',
        campaign_id: 'campaign-123',
        call_status: 'pending',
        save: jest.fn()
      },
      {
        _id: 'contact-2',
        number: '9876543211',
        name: 'User 2',
        campaign_id: 'campaign-123',
        call_status: 'pending',
        save: jest.fn()
      }
    ];

    (dbConnect as jest.Mock).mockResolvedValue(true);
    (Campaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
    (CampaignContact.find as jest.Mock).mockResolvedValue(mockContacts);

  const request = createRequest({ campaign_id: 'campaign-123' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.total_contacts).toBe(2);
    expect(data.data.status).toBe('running');
    expect(mockCampaign.save).toHaveBeenCalled();
  });

  it('should return error if campaign_id is missing', async () => {
    const request = createRequest({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('campaign_id is required');
  });

  it('should return error if campaign not found', async () => {
    (dbConnect as jest.Mock).mockResolvedValue(true);
    (Campaign.findById as jest.Mock).mockResolvedValue(null);

    const request = createRequest({ campaign_id: 'non-existent' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Campaign not found');
  });

  it('should return error if campaign is already running', async () => {
    const mockCampaign = {
      _id: 'campaign-123',
      status: 'running',
      started_at: new Date()
    };

    (dbConnect as jest.Mock).mockResolvedValue(true);
    (Campaign.findById as jest.Mock).mockResolvedValue(mockCampaign);

  const request = createRequest({ campaign_id: 'campaign-123' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Campaign is already running');
  });

  it('should return error if no contacts found', async () => {
    const mockCampaign = {
      _id: 'campaign-123',
      status: 'stopped',
      started_at: null
    };

    (dbConnect as jest.Mock).mockResolvedValue(true);
    (Campaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
    (CampaignContact.find as jest.Mock).mockResolvedValue([]);

  const request = createRequest({ campaign_id: 'campaign-123' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No contacts found for this campaign');
  });

  it('should update campaign status to running', async () => {
    const mockCampaign = {
      _id: 'campaign-123',
      status: 'stopped',
      started_at: null,
      total_contacts: 0,
      calls_completed: 0,
      calls_failed: 0,
      updated_at: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    const mockContacts = [
      {
        _id: 'contact-1',
        number: '9876543210',
        name: 'User 1',
        campaign_id: 'campaign-123',
        call_status: 'pending',
        save: jest.fn()
      }
    ];

    (dbConnect as jest.Mock).mockResolvedValue(true);
    (Campaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
    (CampaignContact.find as jest.Mock).mockResolvedValue(mockContacts);

    const request = createRequest({ campaign_id: 'campaign-123' });

    await POST(request);

    expect(mockCampaign.status).toBe('running');
    expect(mockCampaign.started_at).toBeInstanceOf(Date);
    expect(mockCampaign.total_contacts).toBe(1);
    expect(mockCampaign.save).toHaveBeenCalled();
  });

  it('should only call pending and failed contacts', async () => {
    const mockCampaign = {
      _id: 'campaign-123',
      status: 'stopped',
      started_at: null,
      total_contacts: 0,
      calls_completed: 0,
      calls_failed: 0,
      updated_at: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    (dbConnect as jest.Mock).mockResolvedValue(true);
    (Campaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
    (CampaignContact.find as jest.Mock).mockResolvedValue([]);

    const request = createRequest({ campaign_id: 'campaign-123' });

    await POST(request);

    expect(CampaignContact.find).toHaveBeenCalledWith({
      campaign_id: 'campaign-123',
      call_status: { $in: ['pending', 'failed'] }
    });
  });

  it('should handle database errors gracefully', async () => {
    (dbConnect as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    const request = createRequest({ campaign_id: 'campaign-123' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database connection failed');
  });
});
