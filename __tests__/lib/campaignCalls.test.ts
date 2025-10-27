/**
 * @jest-environment node
 */

import { triggerCampaignCalls } from '@/lib/campaignCalls';

jest.mock('@/lib/dbConnect', () => jest.fn());
jest.mock('@/lib/exotel', () => ({
  triggerExotelCall: jest.fn(),
}));
jest.mock('@/models/Campaign', () => ({
  findByIdAndUpdate: jest.fn(),
}));

const mockDbConnect = require('@/lib/dbConnect');
const mockTriggerExotelCall = require('@/lib/exotel').triggerExotelCall;
const mockCampaign = require('@/models/Campaign');

describe('triggerCampaignCalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockReset();
    mockDbConnect.mockResolvedValue(undefined);
    mockTriggerExotelCall.mockReset();
    mockTriggerExotelCall.mockResolvedValue({ success: true, callSid: 'test-sid' });
    mockCampaign.findByIdAndUpdate.mockReset();
    mockCampaign.findByIdAndUpdate.mockResolvedValue(undefined);
  });

  it('should successfully trigger calls for all contacts', async () => {
    const mockContacts = [
      {
        _id: 'contact1',
        number: '+1234567890',
        name: 'John Doe',
        save: jest.fn().mockResolvedValue(undefined),
        call_status: '',
        call_started_at: null,
        call_done: '',
        call_sid: '',
        call_ended_at: null,
        call_error: '',
      },
      {
        _id: 'contact2',
        number: '+0987654321',
        name: 'Jane Smith',
        save: jest.fn().mockResolvedValue(undefined),
        call_status: '',
        call_started_at: null,
        call_done: '',
        call_sid: '',
        call_ended_at: null,
        call_error: '',
      },
    ];

    let callCount = 0;
    mockTriggerExotelCall.mockImplementation(() => {
      callCount += 1;
      return Promise.resolve({
        success: true,
        callSid: `sid${callCount}`,
      });
    });

    await triggerCampaignCalls('campaign123', mockContacts as any);

    expect(mockDbConnect).toHaveBeenCalledTimes(1);
    expect(mockTriggerExotelCall).toHaveBeenCalledTimes(mockContacts.length);
    expect(mockTriggerExotelCall).toHaveBeenCalledWith({
      phoneNumber: '+1234567890',
      contactName: 'John Doe',
      contactId: 'contact1',
    });
    expect(mockTriggerExotelCall).toHaveBeenCalledWith({
      phoneNumber: '+0987654321',
      contactName: 'Jane Smith',
      contactId: 'contact2',
    });

    expect(mockContacts[0].save).toHaveBeenCalledTimes(2);
    expect(mockContacts[1].save).toHaveBeenCalledTimes(2);
    expect(mockContacts[0].call_status).toBe('completed');
    expect(mockContacts[0].call_done).toBe('yes');
    expect(mockContacts[0].call_sid).toBe('sid1');
    expect(mockContacts[1].call_status).toBe('completed');
    expect(mockContacts[1].call_done).toBe('yes');
    expect(mockContacts[1].call_sid).toBe('sid2');

    expect(mockCampaign.findByIdAndUpdate).toHaveBeenCalledWith('campaign123', {
      calls_completed: 1,
      calls_failed: 0,
      updated_at: expect.any(Date),
    });
    expect(mockCampaign.findByIdAndUpdate).toHaveBeenCalledWith('campaign123', {
      status: 'completed',
      updated_at: expect.any(Date),
    });
  });

  it('should handle failed calls correctly', async () => {
    const mockContacts = [
      {
        _id: 'contact1',
        number: '+1234567890',
        name: 'John Doe',
        save: jest.fn().mockResolvedValue(undefined),
        call_status: '',
        call_started_at: null,
        call_done: '',
        call_sid: '',
        call_ended_at: null,
        call_error: '',
      },
    ];

    mockTriggerExotelCall.mockResolvedValue({ success: false, error: 'Call failed' });

    await triggerCampaignCalls('campaign123', mockContacts as any);

    expect(mockContacts[0].call_status).toBe('failed');
    expect(mockContacts[0].call_error).toBe('Call failed');
    expect(mockContacts[0].call_done).toBe('');
    expect(mockContacts[0].call_sid).toBe('');

    expect(mockCampaign.findByIdAndUpdate).toHaveBeenCalledWith('campaign123', {
      calls_completed: 0,
      calls_failed: 1,
      updated_at: expect.any(Date),
    });
    expect(mockCampaign.findByIdAndUpdate).toHaveBeenLastCalledWith('campaign123', {
      status: 'completed',
      updated_at: expect.any(Date),
    });
  });

  it('should handle exceptions during call processing', async () => {
    const mockContacts = [
      {
        _id: 'contact1',
        number: '+1234567890',
        name: 'John Doe',
        save: jest.fn().mockResolvedValue(undefined),
        call_status: '',
        call_started_at: null,
        call_done: '',
        call_sid: '',
        call_ended_at: null,
        call_error: '',
      },
    ];

    mockTriggerExotelCall.mockRejectedValue(new Error('Network error'));

    await triggerCampaignCalls('campaign123', mockContacts as any);

    expect(mockContacts[0].call_status).toBe('failed');
    expect(mockContacts[0].call_error).toBe('Network error');

    expect(mockCampaign.findByIdAndUpdate).toHaveBeenCalledWith('campaign123', {
      calls_failed: 1,
      updated_at: expect.any(Date),
    });
    expect(mockCampaign.findByIdAndUpdate).toHaveBeenLastCalledWith('campaign123', {
      status: 'completed',
      updated_at: expect.any(Date),
    });
  });

  it('should handle mixed success and failure scenarios', async () => {
    const mockContacts = [
      {
        _id: 'contact1',
        number: '+1234567890',
        name: 'John Doe',
        save: jest.fn().mockResolvedValue(undefined),
        call_status: '',
        call_started_at: null,
        call_done: '',
        call_sid: '',
        call_ended_at: null,
        call_error: '',
      },
      {
        _id: 'contact2',
        number: '+0987654321',
        name: 'Jane Smith',
        save: jest.fn().mockResolvedValue(undefined),
        call_status: '',
        call_started_at: null,
        call_done: '',
        call_sid: '',
        call_ended_at: null,
        call_error: '',
      },
    ];

    let callCount = 0;
    mockTriggerExotelCall.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ success: true, callSid: 'sid1' });
      }
      return Promise.reject(new Error('Network error'));
    });

    await triggerCampaignCalls('campaign123', mockContacts as any);

    expect(mockContacts[0].call_status).toBe('completed');
    expect(mockContacts[0].call_done).toBe('yes');
    expect(mockContacts[0].call_sid).toBe('sid1');

    expect(mockContacts[1].call_status).toBe('failed');
    expect(mockContacts[1].call_error).toBe('Network error');

    expect(mockCampaign.findByIdAndUpdate).toHaveBeenCalledWith('campaign123', {
      calls_completed: 1,
      calls_failed: 0,
      updated_at: expect.any(Date),
    });
    expect(mockCampaign.findByIdAndUpdate).toHaveBeenCalledWith('campaign123', {
      calls_failed: 1,
      updated_at: expect.any(Date),
    });
    expect(mockCampaign.findByIdAndUpdate).toHaveBeenLastCalledWith('campaign123', {
      status: 'completed',
      updated_at: expect.any(Date),
    });
  });

  it('should handle empty contacts array', async () => {
    await triggerCampaignCalls('campaign123', [] as any);

    expect(mockDbConnect).toHaveBeenCalledTimes(1);
    expect(mockTriggerExotelCall).not.toHaveBeenCalled();
    expect(mockCampaign.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockCampaign.findByIdAndUpdate).toHaveBeenCalledWith('campaign123', {
      status: 'completed',
      updated_at: expect.any(Date),
    });
  });

  it('should handle non-Error exceptions during call processing', async () => {
    const mockContacts = [
      {
        _id: 'contact1',
        number: '+1234567890',
        name: 'Test Contact 1',
        call_status: 'pending',
        call_error: '',
        save: jest.fn().mockResolvedValue(undefined),
      },
    ];

    mockTriggerExotelCall.mockRejectedValue('String error');

    await triggerCampaignCalls('campaign123', mockContacts as any);

    expect(mockContacts[0].call_status).toBe('failed');
    expect(mockContacts[0].call_error).toBe('Unknown error');
    expect(mockContacts[0].save).toHaveBeenCalled();
  });
});
