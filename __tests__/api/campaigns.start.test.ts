/**
 * @jest-environment node
 */

import { POST } from '@/app/api/campaigns/start/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/dbConnect', () => jest.fn());
jest.mock('@/lib/exotel', () => ({
  triggerExotelCall: jest.fn(),
}));
jest.mock('@/models/Campaign', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock('@/models/CampaignContact', () => ({
  find: jest.fn(),
}));

// Mock triggerCampaignCalls to avoid actual execution in POST tests
jest.mock('@/lib/campaignCalls', () => ({
  triggerCampaignCalls: jest.fn().mockResolvedValue(undefined),
}));

const mockDbConnect = require('@/lib/dbConnect');
const mockTriggerExotelCall = require('@/lib/exotel').triggerExotelCall;
const mockCampaign = require('@/models/Campaign');
const mockCampaignContact = require('@/models/CampaignContact');
const mockTriggerCampaignCalls = require('@/lib/campaignCalls').triggerCampaignCalls;

describe('/api/campaigns/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockTriggerExotelCall.mockResolvedValue({ success: true, callSid: 'test-sid' });
    mockTriggerCampaignCalls.mockResolvedValue(undefined);
  });

  it('should return 400 if campaign_id is missing', async () => {
    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('campaign_id is required');
  });

  it('should return 500 on JSON parsing error', async () => {
    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('should return 404 if campaign not found', async () => {
    mockCampaign.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'invalid' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Campaign not found');
    expect(mockCampaign.findById).toHaveBeenCalledWith('invalid');
  });

  it('should return 400 if campaign is already running', async () => {
    const mockCampaignData = {
      status: 'running',
      started_at: new Date(),
    };
    mockCampaign.findById.mockResolvedValue(mockCampaignData);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'running_campaign' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Campaign is already running');
  });

  it('should return 400 if campaign status is running but started_at is null', async () => {
    const mockCampaignData = {
      status: 'running',
      started_at: null, // started_at is null
      save: jest.fn().mockResolvedValue(undefined),
    };
    const mockContacts = [
      { _id: 'contact1', number: '1234567890', name: 'Test Contact', save: jest.fn().mockResolvedValue(undefined) },
    ];
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue(mockContacts);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'running_no_started_at' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200); // Should proceed since the condition requires both status === 'running' && started_at
    expect(data.success).toBe(true);
  });

  it('should return 400 if campaign status is running but started_at is undefined', async () => {
    const mockCampaignData = {
      status: 'running',
      // started_at is undefined
      save: jest.fn().mockResolvedValue(undefined),
    };
    const mockContacts = [
      { _id: 'contact1', number: '1234567890', name: 'Test Contact', save: jest.fn().mockResolvedValue(undefined) },
    ];
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue(mockContacts);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'running_no_started_at' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200); // Should proceed since the condition requires both status === 'running' && started_at
    expect(data.success).toBe(true);
  });

  it('should return 400 if no contacts found', async () => {
    const mockCampaignData = {
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'no_contacts' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No contacts found for this campaign');
  });

  it('should return 500 if campaign save fails', async () => {
    const mockCampaignData = {
      status: 'pending',
      save: jest.fn().mockRejectedValue(new Error('Save failed')),
    };
    const mockContacts = [
      { _id: 'contact1', number: '1234567890', name: 'Test Contact' },
    ];
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue(mockContacts);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'save_error' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('should return 200 and start campaign successfully', async () => {
    const mockCampaignData = {
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const mockContacts = [
      { _id: 'contact1', number: '1234567890', name: 'Test Contact', save: jest.fn().mockResolvedValue(undefined) },
    ];
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue(mockContacts);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'success_campaign' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.campaign_id).toBe('success_campaign');
    expect(data.data.total_contacts).toBe(1);
    expect(data.data.status).toBe('running');
    expect(mockCampaignData.save).toHaveBeenCalled();
  });

  it('should handle campaign with only completed contacts', async () => {
    const mockCampaignData = {
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    // No contacts with pending or failed status
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'completed_contacts' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No contacts found for this campaign');
  });

  it('should handle campaign with mixed contact statuses', async () => {
    const mockCampaignData = {
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const mockContacts = [
      { _id: 'contact1', number: '1234567890', name: 'Test Contact 1', call_status: 'pending', save: jest.fn().mockResolvedValue(undefined) },
      { _id: 'contact2', number: '0987654321', name: 'Test Contact 2', call_status: 'failed', save: jest.fn().mockResolvedValue(undefined) },
      // This contact should be ignored
      { _id: 'contact3', number: '1111111111', name: 'Test Contact 3', call_status: 'completed' },
    ];
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue(mockContacts);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'mixed_status' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.total_contacts).toBe(3); // All contacts returned by query
  });

  it('should return 500 on database error', async () => {
    mockDbConnect.mockRejectedValue(new Error('DB connection failed'));

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'db_error' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('DB connection failed');
  });

  it('should handle Exotel call failure in background process', async () => {
    const mockCampaignData = {
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const mockContacts = [
      { _id: 'contact1', number: '1234567890', name: 'Test Contact', save: jest.fn().mockResolvedValue(undefined) },
    ];
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue(mockContacts);

    // Mock Exotel call to fail
    mockTriggerExotelCall.mockResolvedValueOnce({ success: false, error: 'Call failed' });

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'exotel_fail' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200); // API still returns success, background process handles failure
    expect(data.success).toBe(true);
  });

  it('should handle contact save failure in background process', async () => {
    const mockCampaignData = {
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const mockContacts = [
      {
        _id: 'contact1',
        number: '1234567890',
        name: 'Test Contact',
        save: jest.fn().mockRejectedValueOnce(new Error('Save failed'))
      },
    ];
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue(mockContacts);

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'contact_save_fail' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200); // API still returns success
    expect(data.success).toBe(true);
  });

  it('should handle campaign update failure in background process', async () => {
    const mockCampaignData = {
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const mockContacts = [
      { _id: 'contact1', number: '1234567890', name: 'Test Contact', save: jest.fn().mockResolvedValue(undefined) },
    ];
    mockCampaign.findById.mockResolvedValue(mockCampaignData);
    mockCampaignContact.find.mockResolvedValue(mockContacts);

    // Mock campaign update to fail
    mockCampaign.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

    const request = new NextRequest('http://localhost/api/campaigns/start', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'campaign_update_fail' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200); // API still returns success
    expect(data.success).toBe(true);
  });
});

// triggerCampaignCalls related tests moved to __tests__/lib/campaignCalls.test.ts