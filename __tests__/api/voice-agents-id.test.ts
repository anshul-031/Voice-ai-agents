/**
 * @jest-environment node
 */
import { GET } from '@/app/api/voice-agents/[id]/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/mongodb')
jest.mock('@/models/VoiceAgent')

import dbConnect from '@/lib/mongodb'
import VoiceAgent from '@/models/VoiceAgent'

describe('API: /api/voice-agents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET Request - Fetch specific voice agent', () => {
    it('should return agent by id', async () => {
      const mockAgent = {
        _id: 'agent-123',
        userId: 'mukul',
        title: 'Test Agent',
        prompt: 'You are a test agent',
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Sarvam Manisha',
        lastUpdated: new Date('2025-10-10'),
        createdAt: new Date('2025-10-01')
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findById as jest.Mock).mockResolvedValue(mockAgent)

      const request = new NextRequest('http://localhost:3000/api/voice-agents/agent-123')
      const params = Promise.resolve({ id: 'agent-123' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(VoiceAgent.findById).toHaveBeenCalledWith('agent-123')
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agent).toMatchObject({
        id: 'agent-123',
        userId: 'mukul',
        title: 'Test Agent',
        llmModel: 'Gemini 1.5 Flash'
      })
    })

    it('should return 404 when agent not found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/voice-agents/non-existent')
      const params = Promise.resolve({ id: 'non-existent' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Agent not found')
    })

    it('should return 400 when id is missing', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/voice-agents/')
      const params = Promise.resolve({ id: '' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Agent ID is required')
    })

    it('should handle database errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findById as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/voice-agents/agent-123')
      const params = Promise.resolve({ id: 'agent-123' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch agent')
    })
  })
})

