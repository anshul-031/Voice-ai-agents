/**
 * @jest-environment node
 */

import { GET, POST, PUT } from '@/app/api/campaigns/route'
import dbConnect from '@/lib/dbConnect'
import Campaign from '@/models/Campaign'
import { NextRequest } from 'next/server'

jest.mock('@/lib/dbConnect')
jest.mock('@/models/Campaign')

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>

const asMock = <T extends (...args: any[]) => any>(fn: T) => fn as unknown as jest.MockedFunction<T>

const buildJsonRequest = (url: string, method: 'POST' | 'PUT', body: unknown) =>
  new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })

describe('Campaigns API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDbConnect.mockResolvedValue(undefined as any)
  })

  describe('GET /api/campaigns', () => {
    it('returns campaigns sorted by update time', async () => {
      const mockSort = jest.fn().mockResolvedValue([
        { _id: '2', updated_at: new Date('2024-01-02') },
        { _id: '1', updated_at: new Date('2024-01-01') },
      ])
      asMock(Campaign.find).mockReturnValue({ sort: mockSort } as any)

      const response = await GET()
      const payload = await response.json()

      expect(mockDbConnect).toHaveBeenCalled()
      expect(Campaign.find).toHaveBeenCalledWith({})
      expect(mockSort).toHaveBeenCalledWith({ updated_at: -1 })
      expect(response.status).toBe(200)
      expect(payload.success).toBe(true)
      expect(payload.data).toHaveLength(2)
    })

    it('returns Unknown error when thrown value is not an Error', async () => {
      const mockSort = jest.fn().mockRejectedValue('failed')
      asMock(Campaign.find).mockReturnValue({ sort: mockSort } as any)

      const response = await GET()
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe('Unknown error')
    })
  })

  describe('POST /api/campaigns', () => {
    it('creates a campaign with defaults when optional fields missing', async () => {
      const mockCampaign = { _id: '123', status: 'running' }
      asMock(Campaign.create).mockResolvedValue(mockCampaign as any)

      const request = buildJsonRequest('http://localhost/api/campaigns', 'POST', {
        title: 'Spring Promo',
        start_date: '2024-03-01',
        user_id: 'user-42',
      })

      const response = await POST(request)
      const payload = await response.json()

      expect(mockDbConnect).toHaveBeenCalled()
      expect(Campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Spring Promo',
          start_date: '2024-03-01',
          status: 'running',
          agent_id: 'emi reminder',
          user_id: 'user-42',
        }),
      )
      expect(response.status).toBe(201)
      expect(payload.success).toBe(true)
      expect(payload.data).toEqual(mockCampaign)
    })

    it('bubbles database errors with descriptive messages', async () => {
      asMock(Campaign.create).mockRejectedValue(new Error('db down'))

      const request = buildJsonRequest('http://localhost/api/campaigns', 'POST', {
        title: 'Spring Promo',
        start_date: '2024-03-01',
        user_id: 'user-42',
      })

      const response = await POST(request)
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe('db down')
    })

    it('falls back to Unknown error when thrown value is not an Error instance', async () => {
      asMock(Campaign.create).mockRejectedValue('nope')

      const request = buildJsonRequest('http://localhost/api/campaigns', 'POST', {
        title: 'Missing Error',
        start_date: '2024-03-01',
        user_id: 'user-42',
      })

      const response = await POST(request)
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe('Unknown error')
    })
  })

  describe('PUT /api/campaigns', () => {
    it('validates presence of campaign id', async () => {
      const request = buildJsonRequest('http://localhost/api/campaigns', 'PUT', {
        title: 'No ID',
      })

      const response = await PUT(request)
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe('Campaign ID is required')
      expect(Campaign.findByIdAndUpdate).not.toHaveBeenCalled()
    })

    it('updates a campaign and returns the new document', async () => {
      const mockCampaign = { _id: '123', title: 'Updated' }
      asMock(Campaign.findByIdAndUpdate).mockResolvedValue(mockCampaign as any)

      const request = buildJsonRequest('http://localhost/api/campaigns', 'PUT', {
        id: '123',
        title: 'Updated',
        status: 'paused',
      })

      const response = await PUT(request)
      const payload = await response.json()

      expect(mockDbConnect).toHaveBeenCalled()
      expect(Campaign.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          title: 'Updated',
          status: 'paused',
          updated_at: expect.any(Date),
        }),
        { new: true, runValidators: true },
      )
      expect(response.status).toBe(200)
      expect(payload.success).toBe(true)
      expect(payload.data).toEqual(mockCampaign)
    })

    it('returns 404 when campaign cannot be found', async () => {
      asMock(Campaign.findByIdAndUpdate).mockResolvedValue(null)

      const request = buildJsonRequest('http://localhost/api/campaigns', 'PUT', {
        id: 'missing',
        title: 'Attempt',
      })

      const response = await PUT(request)
      const payload = await response.json()

      expect(response.status).toBe(404)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe('Campaign not found')
    })

    it('returns Unknown error when thrown value is not an Error', async () => {
      asMock(Campaign.findByIdAndUpdate).mockRejectedValue('boom')

      const request = buildJsonRequest('http://localhost/api/campaigns', 'PUT', {
        id: '123',
        title: 'Fails',
      })

      const response = await PUT(request)
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe('Unknown error')
    })
  })
})
