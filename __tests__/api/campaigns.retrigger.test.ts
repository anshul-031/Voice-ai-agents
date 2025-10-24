/**
 * @jest-environment node
 */

import { POST } from '@/app/api/campaigns/[campaignId]/retrigger/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/dbConnect', () => jest.fn())
jest.mock('@/models/Campaign', () => ({
  findById: jest.fn()
}))
jest.mock('@/models/CampaignContact', () => ({
  find: jest.fn(),
  updateMany: jest.fn()
}))
jest.mock('@/app/api/campaigns/start/route', () => ({
  triggerCampaignCalls: jest.fn().mockResolvedValue(undefined)
}))

const mockDbConnect = require('@/lib/dbConnect') as jest.Mock
const mockCampaign = require('@/models/Campaign') as {
  findById: jest.Mock
}
const mockCampaignContact = require('@/models/CampaignContact') as {
  find: jest.Mock
  updateMany: jest.Mock
}
const mockTriggerCampaignCalls = require('@/app/api/campaigns/start/route').triggerCampaignCalls as jest.Mock

describe('POST /api/campaigns/[campaignId]/retrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDbConnect.mockResolvedValue(undefined)
    mockCampaign.findById.mockReset()
    mockCampaignContact.find.mockReset()
    mockCampaignContact.updateMany.mockReset()
    mockTriggerCampaignCalls.mockResolvedValue(undefined)
  })

  it('returns 400 when campaignId is missing', async () => {
    const request = new NextRequest('http://localhost/api/campaigns//retrigger', {
      method: 'POST'
    })

    const response = await POST(request, { params: Promise.resolve({ campaignId: '' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Campaign ID is required')
    expect(mockDbConnect).not.toHaveBeenCalled()
  })

  it('returns 404 when campaign does not exist', async () => {
    mockCampaign.findById.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost/api/campaigns/abc/retrigger', {
      method: 'POST'
    })

    const response = await POST(request, { params: Promise.resolve({ campaignId: 'abc' }) })
    const data = await response.json()

    expect(mockDbConnect).toHaveBeenCalled()
    expect(mockCampaign.findById).toHaveBeenCalledWith('abc')
    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Campaign not found')
  })

  it('returns 400 when no contacts are found for the campaign', async () => {
    const mockCampaignDoc = {
      _id: 'campaign-1',
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined)
    }
    mockCampaign.findById.mockResolvedValueOnce(mockCampaignDoc)
    mockCampaignContact.find.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost/api/campaigns/campaign-1/retrigger', {
      method: 'POST'
    })

    const response = await POST(request, { params: Promise.resolve({ campaignId: 'campaign-1' }) })
    const data = await response.json()

    expect(mockDbConnect).toHaveBeenCalled()
    expect(mockCampaign.findById).toHaveBeenCalledWith('campaign-1')
    expect(mockCampaignContact.find).toHaveBeenCalledWith({ campaign_id: 'campaign-1' })
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('No contacts found for this campaign')
  })

  it('re-triggers campaign successfully and resets contact state', async () => {
    const campaignId = 'campaign-42'
    const mockCampaignDoc = {
      _id: campaignId,
      status: 'completed',
      total_contacts: 0,
      calls_completed: 5,
      calls_failed: 1,
      started_at: null as Date | null,
      updated_at: null as Date | null,
      save: jest.fn().mockResolvedValue(undefined)
    }
    const initialContacts = [
      { _id: 'contact-1', call_status: 'completed', call_done: 'yes' }
    ]
    const refreshedContacts = [
      { _id: 'contact-1', call_status: 'pending', call_done: 'no' },
      { _id: 'contact-2', call_status: 'pending', call_done: 'no' }
    ]

    mockCampaign.findById.mockResolvedValueOnce(mockCampaignDoc)
    mockCampaignContact.find
      .mockResolvedValueOnce(initialContacts)
      .mockResolvedValueOnce(refreshedContacts)
    mockCampaignContact.updateMany.mockResolvedValueOnce({ acknowledged: true })
    mockTriggerCampaignCalls.mockRejectedValueOnce(new Error('background failure'))

    const request = new NextRequest(`http://localhost/api/campaigns/${campaignId}/retrigger`, {
      method: 'POST'
    })

    const response = await POST(request, { params: Promise.resolve({ campaignId }) })
    const data = await response.json()

    expect(mockDbConnect).toHaveBeenCalled()
    expect(mockCampaign.findById).toHaveBeenCalledWith(campaignId)
    expect(mockCampaignContact.updateMany).toHaveBeenCalledWith(
      { campaign_id: campaignId },
      {
        $set: { call_done: 'no', call_status: 'pending' },
        $unset: { call_sid: '', call_started_at: '', call_ended_at: '', call_error: '' }
      }
    )
    expect(mockCampaignDoc.save).toHaveBeenCalled()
    expect(mockCampaignDoc.status).toBe('running')
    expect(mockCampaignDoc.total_contacts).toBe(refreshedContacts.length)
    expect(mockCampaignDoc.calls_completed).toBe(0)
    expect(mockCampaignDoc.calls_failed).toBe(0)
    expect(mockTriggerCampaignCalls).toHaveBeenCalledWith(campaignId, refreshedContacts)
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toMatchObject({
      campaign_id: campaignId,
      total_contacts: refreshedContacts.length,
      status: 'running'
    })
    await Promise.resolve()
  })

  it('returns 500 when an unexpected error occurs', async () => {
    const campaignId = 'campaign-error'
    const mockCampaignDoc = {
      _id: campaignId,
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined)
    }

    mockCampaign.findById.mockResolvedValueOnce(mockCampaignDoc)
    mockCampaignContact.find.mockResolvedValueOnce([{ _id: 'contact-1' }])
    mockCampaignContact.updateMany.mockRejectedValueOnce(new Error('Update failed'))

    const request = new NextRequest(`http://localhost/api/campaigns/${campaignId}/retrigger`, {
      method: 'POST'
    })

    const response = await POST(request, { params: Promise.resolve({ campaignId }) })
    const data = await response.json()

    expect(mockDbConnect).toHaveBeenCalled()
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Update failed')
  })

  it('returns generic failure message for non-Error rejections', async () => {
    const campaignId = 'campaign-non-error'
    const mockCampaignDoc = {
      _id: campaignId,
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined)
    }

    mockCampaign.findById.mockResolvedValueOnce(mockCampaignDoc)
    mockCampaignContact.find.mockResolvedValueOnce([{ _id: 'contact-1' }])
    mockCampaignContact.updateMany.mockRejectedValueOnce('non-error rejection')

    const request = new NextRequest(`http://localhost/api/campaigns/${campaignId}/retrigger`, {
      method: 'POST'
    })

    const response = await POST(request, { params: Promise.resolve({ campaignId }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to retrigger campaign')
  })
})
