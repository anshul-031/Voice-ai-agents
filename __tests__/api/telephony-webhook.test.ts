/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/telephony/webhook/[phoneId]/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/mongodb')
jest.mock('@/models/Chat')
jest.mock('@/models/PhoneNumber')
jest.mock('@/models/VoiceAgent')

import dbConnect from '@/lib/mongodb'
import Chat from '@/models/Chat'
import PhoneNumber from '@/models/PhoneNumber'
import VoiceAgent from '@/models/VoiceAgent'

describe('API: /api/telephony/webhook/[phoneId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const basePayload = {
    CallSid: 'call-123',
    From: '+911234567890',
    To: '+911112223334',
    Status: 'in-progress'
  }

  const headers = { 'content-type': 'application/json' }

  describe('POST - handle webhook', () => {
    it('processes webhook with linked agent and returns streaming XML', async () => {
      const phoneDoc = {
        _id: 'phone-1',
        userId: 'mukul',
        linkedAgentId: 'agent-9',
        webhookUrl: 'https://example.com/hook/phone-1',
        websocketUrl: 'wss://stream.example.com',
        lastUsed: undefined,
        save: jest.fn().mockResolvedValue(true)
      }

      const agentDoc = {
        _id: 'agent-9',
        prompt: 'You are a helpful assistant.',
        toObject: () => ({ _id: 'agent-9' })
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(PhoneNumber.findOne as jest.Mock).mockResolvedValue(phoneDoc)
      ;(VoiceAgent.findById as jest.Mock).mockResolvedValue(agentDoc)
      ;(Chat.create as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/telephony/webhook/phone-1', {
        method: 'POST',
        body: JSON.stringify(basePayload),
        headers
      })

      const response = await POST(request, { params: Promise.resolve({ phoneId: 'phone-1' }) })
      const body = await response.text()

      expect(dbConnect).toHaveBeenCalled()
      expect(PhoneNumber.findOne).toHaveBeenCalledWith({
        $or: [
          { _id: 'phone-1' },
          { webhookUrl: { $regex: 'phone-1' } }
        ]
      })
      expect(phoneDoc.save).toHaveBeenCalled()
      expect(VoiceAgent.findById).toHaveBeenCalledWith('agent-9')
      expect(Chat.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'mukul',
        role: 'system',
        content: `Call initiated from ${basePayload.From} to ${basePayload.To}`
      }))
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('application/xml')
      expect(body).toContain('<Stream url="wss://stream.example.com">')
      expect(body).toContain('<Parameter name="agentId" value="agent-9" />')
    })

    it('falls back to latest agent when no linked agent exists', async () => {
      const phoneDoc = {
        _id: 'phone-1',
        userId: 'mukul',
        linkedAgentId: undefined,
        webhookUrl: 'https://example.com/hook/phone-1',
        websocketUrl: undefined,
        lastUsed: undefined,
        save: jest.fn().mockResolvedValue(true)
      }

      const fallbackAgent = {
        _id: 'agent-99',
        prompt: 'नमस्ते, आप एक मददगार सहायक हैं।'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(PhoneNumber.findOne as jest.Mock).mockResolvedValue(phoneDoc)
      ;(VoiceAgent.findById as jest.Mock).mockResolvedValue(null)
      const mockSort = jest.fn().mockResolvedValue(fallbackAgent)
      ;(VoiceAgent.findOne as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(Chat.create as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/telephony/webhook/phone-1', {
        method: 'POST',
        body: JSON.stringify(basePayload),
        headers
      })

      const response = await POST(request, { params: Promise.resolve({ phoneId: 'phone-1' }) })
      const body = await response.text()

  expect(VoiceAgent.findById).not.toHaveBeenCalled()
      expect(VoiceAgent.findOne).toHaveBeenCalledWith({ userId: 'mukul' })
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(body).toContain('नमस्ते। कृपया प्रतीक्षा करें।')
      expect(body).toContain('<Hangup/>')
      expect(response.status).toBe(200)
    })

    it('returns 404 when phone configuration is missing', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(PhoneNumber.findOne as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/telephony/webhook/missing', {
        method: 'POST',
        body: JSON.stringify(basePayload),
        headers
      })

      const response = await POST(request, { params: Promise.resolve({ phoneId: 'missing' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Phone number not found')
      expect(Chat.create).not.toHaveBeenCalled()
    })

    it('returns 500 when no agent can be resolved', async () => {
      const phoneDoc = {
        _id: 'phone-1',
        userId: 'mukul',
        linkedAgentId: undefined,
        webhookUrl: 'https://example.com/hook/phone-1',
        websocketUrl: undefined,
        lastUsed: undefined,
        save: jest.fn().mockResolvedValue(true)
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(PhoneNumber.findOne as jest.Mock).mockResolvedValue(phoneDoc)
      ;(VoiceAgent.findById as jest.Mock).mockResolvedValue(null)
      ;(VoiceAgent.findOne as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(null) })

      const request = new NextRequest('http://localhost:3000/api/telephony/webhook/phone-1', {
        method: 'POST',
        body: JSON.stringify(basePayload),
        headers
      })

      const response = await POST(request, { params: Promise.resolve({ phoneId: 'phone-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('No agent configured')
    })

    it('handles unexpected errors gracefully', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(PhoneNumber.findOne as jest.Mock).mockImplementation(() => { throw new Error('db down') })

      const request = new NextRequest('http://localhost:3000/api/telephony/webhook/phone-1', {
        method: 'POST',
        body: JSON.stringify(basePayload),
        headers
      })

      const response = await POST(request, { params: Promise.resolve({ phoneId: 'phone-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process webhook')
      expect(data.details).toBe('db down')
    })
  })

  describe('GET - health check', () => {
    it('returns active status for the webhook', async () => {
      const request = new NextRequest('http://localhost:3000/api/telephony/webhook/phone-1')
      const response = await GET(request, { params: Promise.resolve({ phoneId: 'phone-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'active',
        phoneId: 'phone-1',
        message: 'Exotel webhook endpoint is active'
      })
    })
  })
})
