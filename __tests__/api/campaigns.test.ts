/**
 * @jest-environment node
 */
import { GET, POST, PUT } from '@/app/api/campaigns/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/dbConnect')
jest.mock('@/models/Campaign')

import dbConnect from '@/lib/dbConnect'
import Campaign from '@/models/Campaign'

describe('API: /api/campaigns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET Request - List all campaigns', () => {
    it('should return all campaigns sorted by updated_at', async () => {
      const mockCampaigns = [
        {
          _id: '1',
          title: 'Campaign 1',
          status: 'running',
          start_date: '2025-10-01',
          updated_at: '2025-10-10T00:00:00.000Z',
          agent_id: 'emi reminder',
          user_id: 'user1'
        },
        {
          _id: '2',
          title: 'Campaign 2',
          status: 'paused',
          start_date: '2025-09-15',
          updated_at: '2025-10-09T00:00:00.000Z',
          agent_id: 'emi reminder',
          user_id: 'user1'
        }
      ]

      const mockSort = jest.fn().mockResolvedValue(mockCampaigns)
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort })
      ;(Campaign.find as jest.Mock) = mockFind
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const response = await GET()
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(Campaign.find).toHaveBeenCalledWith({})
      expect(mockSort).toHaveBeenCalledWith({ updated_at: -1 })
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCampaigns)
      expect(data.data).toHaveLength(2)
    })

    it('should return empty array when no campaigns exist', async () => {
      const mockSort = jest.fn().mockResolvedValue([])
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort })
      ;(Campaign.find as jest.Mock) = mockFind
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should handle database connection errors', async () => {
      ;(dbConnect as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle Campaign.find errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      const mockSort = jest.fn().mockRejectedValue(new Error('Query failed'))
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort })
      ;(Campaign.find as jest.Mock) = mockFind

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Query failed')
    })

    it('should surface unknown error message for non-Error throws', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      const mockSort = jest.fn().mockRejectedValue('totally broken')
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort })
      ;(Campaign.find as jest.Mock) = mockFind

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unknown error')
    })
  })

  describe('POST Request - Create new campaign', () => {
    it('should create a new campaign with all fields', async () => {
      const newCampaign = {
        title: 'New Campaign',
        start_date: '2025-10-15',
        status: 'running',
        agent_id: 'emi reminder',
        user_id: 'user123'
      }

      const mockCreatedCampaign = {
        _id: 'new-id',
        ...newCampaign,
        updated_at: new Date('2025-10-15T10:00:00.000Z')
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.create as jest.Mock).mockResolvedValue(mockCreatedCampaign)

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(newCampaign)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(Campaign.create).toHaveBeenCalledWith({
        ...newCampaign,
        updated_at: expect.any(Date)
      })
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        _id: 'new-id',
        ...newCampaign
      })
      expect(data.data.updated_at).toBeDefined()
    })

    it('should create campaign with default values when optional fields are missing', async () => {
      const minimalData = {
        title: 'Minimal Campaign',
        start_date: '2025-10-15',
        user_id: 'user123'
      }

      const mockCreatedCampaign = {
        _id: 'new-id',
        ...minimalData,
        status: 'running',
        agent_id: 'emi reminder',
        updated_at: expect.any(Date)
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.create as jest.Mock).mockResolvedValue(mockCreatedCampaign)

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(minimalData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(Campaign.create).toHaveBeenCalledWith({
        title: minimalData.title,
        start_date: minimalData.start_date,
        updated_at: expect.any(Date),
        status: 'running',
        agent_id: 'emi reminder',
        user_id: minimalData.user_id
      })
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('should handle validation errors from Campaign model', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.create as jest.Mock).mockRejectedValue(
        new Error('Campaign validation failed: title: Path `title` is required.')
      )

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ start_date: '2025-10-15' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('validation failed')
    })

    it('should handle database errors during creation', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.create as jest.Mock).mockRejectedValue(new Error('Database write failed'))

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', start_date: '2025-10-15' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database write failed')
    })

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: 'invalid-json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should default to unknown error when rejection is not an Error instance', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.create as jest.Mock).mockRejectedValue('write failed badly')

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', start_date: '2025-10-15', user_id: 'user123' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unknown error')
    })
  })

  describe('PUT Request - Update existing campaign', () => {
    it('should update campaign successfully', async () => {
      const updateData = {
        id: 'campaign-id-123',
        title: 'Updated Campaign',
        status: 'completed'
      }

      const mockUpdatedCampaign = {
        _id: 'campaign-id-123',
        title: 'Updated Campaign',
        status: 'completed',
        start_date: '2025-10-01',
        updated_at: new Date('2025-10-15T10:00:00.000Z'),
        agent_id: 'emi reminder',
        user_id: 'user1'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedCampaign)

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(Campaign.findByIdAndUpdate).toHaveBeenCalledWith(
        'campaign-id-123',
        {
          title: 'Updated Campaign',
          status: 'completed',
          updated_at: expect.any(Date)
        },
        { new: true, runValidators: true }
      )
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        _id: 'campaign-id-123',
        title: 'Updated Campaign',
        status: 'completed',
        start_date: '2025-10-01',
        agent_id: 'emi reminder',
        user_id: 'user1'
      })
      expect(data.data.updated_at).toBeDefined()
    })

    it('should return error when campaign ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Campaign ID is required')
      expect(Campaign.findByIdAndUpdate).not.toHaveBeenCalled()
    })

    it('should return 404 when campaign not found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.findByIdAndUpdate as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'PUT',
        body: JSON.stringify({ id: 'non-existent-id', title: 'Updated' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Campaign not found')
    })

    it('should update only provided fields', async () => {
      const updateData = {
        id: 'campaign-123',
        status: 'paused'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: 'campaign-123',
        status: 'paused',
        updated_at: new Date('2025-10-15T10:00:00.000Z')
      })

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(Campaign.findByIdAndUpdate).toHaveBeenCalledWith(
        'campaign-123',
        {
          status: 'paused',
          updated_at: expect.any(Date)
        },
        { new: true, runValidators: true }
      )
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.updated_at).toBeDefined()
    })

    it('should handle validation errors during update', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error('Validation failed: status is not a valid enum value')
      )

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'PUT',
        body: JSON.stringify({ id: 'campaign-123', status: 'invalid-status' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Validation failed')
    })

    it('should automatically update the updated_at timestamp', async () => {
      const beforeUpdate = new Date()

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'PUT',
        body: JSON.stringify({ id: 'campaign-123', title: 'New Title' })
      })

      ;(Campaign.findByIdAndUpdate as jest.Mock).mockImplementation((id, data) => {
        expect(data.updated_at).toBeInstanceOf(Date)
        expect(data.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
        return Promise.resolve({ _id: id, ...data })
      })

      await PUT(request)

      expect(Campaign.findByIdAndUpdate).toHaveBeenCalled()
    })

    it('should respond with unknown error when rejection is not an Error instance', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Campaign.findByIdAndUpdate as jest.Mock).mockRejectedValue('unexpected failure')

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'PUT',
        body: JSON.stringify({ id: 'campaign-789', title: 'Broken Update' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unknown error')
    })
  })
})
