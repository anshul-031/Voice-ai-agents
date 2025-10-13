/**
 * @jest-environment node
 */
import { DELETE, GET, POST, PUT } from '@/app/api/voice-agents/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/mongodb')
jest.mock('@/models/VoiceAgent')

import dbConnect, { clearMongoConnection } from '@/lib/mongodb'
import VoiceAgent from '@/models/VoiceAgent'

describe('API: /api/voice-agents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET Request - Fetch voice agents', () => {
    it('should return all agents for a specific user', async () => {
      const mockAgents = [
        {
          _id: 'agent-1',
          userId: 'mukul',
          title: 'Customer Support Agent',
          prompt: 'You are a helpful customer support agent',
          llmModel: 'Gemini 1.5 Flash',
          sttModel: 'AssemblyAI Universal',
          ttsModel: 'Sarvam Manisha',
          lastUpdated: new Date('2025-10-10'),
          createdAt: new Date('2025-10-01')
        },
        {
          _id: 'agent-2',
          userId: 'mukul',
          title: 'Sales Agent',
          prompt: 'You are a sales assistant',
          llmModel: 'Gemini 1.5 Pro',
          sttModel: 'AssemblyAI Universal',
          ttsModel: 'Deepgram Aura Stella',
          lastUpdated: new Date('2025-10-09'),
          createdAt: new Date('2025-09-15')
        }
      ]

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAgents)
      }
      ;(VoiceAgent.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/voice-agents?userId=mukul')

      const response = await GET(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(VoiceAgent.find).toHaveBeenCalledWith({ userId: 'mukul' })
      expect(mockChain.sort).toHaveBeenCalledWith({ lastUpdated: -1 })
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.userId).toBe('mukul')
      expect(data.count).toBe(2)
      expect(data.agents).toHaveLength(2)
      expect(data.agents[0]).toMatchObject({
        id: 'agent-1',
        userId: 'mukul',
        title: 'Customer Support Agent'
      })
    })

    it('should use default userId "mukul" when not provided', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      }
      ;(VoiceAgent.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/voice-agents')

      const response = await GET(request)
      const data = await response.json()

      expect(VoiceAgent.find).toHaveBeenCalledWith({ userId: 'mukul' })
      expect(data.success).toBe(true)
      expect(data.userId).toBe('mukul')
    })

    it('should return empty array when no agents found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      }
      ;(VoiceAgent.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/voice-agents?userId=newuser')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agents).toEqual([])
      expect(data.count).toBe(0)
    })

    it('should retry connection on initial failure', async () => {
      ;(dbConnect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined)
      ;(clearMongoConnection as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      }
      ;(VoiceAgent.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/voice-agents')

      const response = await GET(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalledTimes(2)
      expect(clearMongoConnection).toHaveBeenCalled()
      expect(data.success).toBe(true)
    })

    it('should handle database query errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Query failed'))
      }
      ;(VoiceAgent.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/voice-agents')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch voice agents')
      expect(data.details).toBe('Query failed')
    })
  })

  describe('POST Request - Create new voice agent', () => {
    it('should create a new agent with all fields', async () => {
      const newAgent = {
        userId: 'testuser',
        title: 'New Agent',
        prompt: 'You are a helpful assistant',
        llmModel: 'Gemini 1.5 Pro',
        sttModel: 'AssemblyAI Best',
        ttsModel: 'Deepgram Aura Stella'
      }

      const mockSavedAgent = {
        _id: 'new-agent-id',
        ...newAgent,
        lastUpdated: new Date('2025-10-10'),
        createdAt: new Date('2025-10-10'),
        toString: () => 'new-agent-id'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent as any).mockImplementation(function(data: any) {
        return {
          ...data,
          _id: mockSavedAgent._id,
          save: jest.fn().mockResolvedValue(mockSavedAgent)
        }
      })

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'POST',
        body: JSON.stringify(newAgent)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agent).toMatchObject({
        id: 'new-agent-id',
        userId: 'testuser',
        title: 'New Agent',
        llmModel: 'Gemini 1.5 Pro'
      })
    })

    it('should create agent with default values when optional fields missing', async () => {
      const minimalAgent = {
        title: 'Minimal Agent',
        prompt: 'Basic prompt'
      }

      const mockSavedAgent = {
        _id: 'minimal-id',
        userId: 'mukul',
        title: 'Minimal Agent',
        prompt: 'Basic prompt',
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Sarvam Manisha',
        lastUpdated: new Date(),
        createdAt: new Date()
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent as any).mockImplementation(function(data: any) {
        return {
          ...mockSavedAgent,
          _id: { toString: () => 'minimal-id' },
          save: jest.fn().mockResolvedValue(mockSavedAgent)
        }
      })

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'POST',
        body: JSON.stringify(minimalAgent)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agent.userId).toBe('mukul')
      expect(data.agent.llmModel).toBe('Gemini 1.5 Flash')
      expect(data.agent.sttModel).toBe('AssemblyAI Universal')
      expect(data.agent.ttsModel).toBe('Sarvam Manisha')
    })

    it('should trim whitespace from title and prompt', async () => {
      const agentWithSpaces = {
        title: '  Spaced Agent  ',
        prompt: '  Spaced prompt  '
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      let capturedData: any
      ;(VoiceAgent as any).mockImplementation(function(data: any) {
        capturedData = data
        return {
          ...data,
          _id: { toString: () => 'test-id' },
          save: jest.fn().mockResolvedValue({ ...data, _id: 'test-id' })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'POST',
        body: JSON.stringify(agentWithSpaces)
      })

      await POST(request)

      expect(capturedData.title).toBe('Spaced Agent')
      expect(capturedData.prompt).toBe('Spaced prompt')
    })

    it('should return 400 when title is missing', async () => {
      const invalidAgent = {
        prompt: 'Has prompt but no title'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'POST',
        body: JSON.stringify(invalidAgent)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 when prompt is missing', async () => {
      const invalidAgent = {
        title: 'Has title but no prompt'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'POST',
        body: JSON.stringify(invalidAgent)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should handle database save errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent as any).mockImplementation(function() {
        return {
          save: jest.fn().mockRejectedValue(new Error('Database error'))
        }
      })

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', prompt: 'Test prompt' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create voice agent')
      expect(data.details).toBe('Database error')
    })
  })

  describe('PUT Request - Update voice agent', () => {
    it('should update agent with all fields', async () => {
      const updateData = {
        id: 'agent-123',
        title: 'Updated Title',
        prompt: 'Updated prompt',
        llmModel: 'Gemini 1.5 Pro',
        sttModel: 'AssemblyAI Best',
        ttsModel: 'Deepgram Aura Stella'
      }

      const mockUpdatedAgent = {
        _id: 'agent-123',
        userId: 'mukul',
        ...updateData,
        lastUpdated: new Date('2025-10-10'),
        createdAt: new Date('2025-09-01')
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedAgent)

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(VoiceAgent.findByIdAndUpdate).toHaveBeenCalledWith(
        'agent-123',
        expect.objectContaining({
          title: 'Updated Title',
          prompt: 'Updated prompt',
          llmModel: 'Gemini 1.5 Pro',
          sttModel: 'AssemblyAI Best',
          ttsModel: 'Deepgram Aura Stella'
        }),
        { new: true, runValidators: true }
      )
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agent.title).toBe('Updated Title')
    })

    it('should update only provided fields', async () => {
      const partialUpdate = {
        id: 'agent-123',
        title: 'Only Title Updated'
      }

      const mockUpdatedAgent = {
        _id: 'agent-123',
        userId: 'mukul',
        title: 'Only Title Updated',
        prompt: 'Original prompt',
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Sarvam Manisha',
        lastUpdated: new Date(),
        createdAt: new Date()
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedAgent)

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(VoiceAgent.findByIdAndUpdate).toHaveBeenCalledWith(
        'agent-123',
        expect.objectContaining({
          title: 'Only Title Updated',
          lastUpdated: expect.any(Date)
        }),
        { new: true, runValidators: true }
      )
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should trim whitespace from updated values', async () => {
      const updateWithSpaces = {
        id: 'agent-123',
        title: '  Spaced Title  ',
        prompt: '  Spaced Prompt  '
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: 'agent-123',
        userId: 'mukul',
        title: 'Spaced Title',
        prompt: 'Spaced Prompt',
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Sarvam Manisha',
        lastUpdated: new Date(),
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'PUT',
        body: JSON.stringify(updateWithSpaces)
      })

      await PUT(request)

      expect(VoiceAgent.findByIdAndUpdate).toHaveBeenCalledWith(
        'agent-123',
        expect.objectContaining({
          title: 'Spaced Title',
          prompt: 'Spaced Prompt'
        }),
        expect.any(Object)
      )
    })

    it('should return 400 when id is missing', async () => {
      const noId = {
        title: 'Updated Title'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'PUT',
        body: JSON.stringify(noId)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 when no update fields provided', async () => {
      const onlyId = {
        id: 'agent-123'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'PUT',
        body: JSON.stringify(onlyId)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 404 when agent not found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findByIdAndUpdate as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'PUT',
        body: JSON.stringify({ id: 'non-existent', title: 'Update' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Voice agent not found')
    })

    it('should handle database update errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest('http://localhost:3000/api/voice-agents', {
        method: 'PUT',
        body: JSON.stringify({ id: 'agent-123', title: 'Update' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update voice agent')
      expect(data.details).toBe('Update failed')
    })
  })

  describe('DELETE Request - Delete voice agent', () => {
    it('should delete an existing agent', async () => {
      const mockDeletedAgent = {
        _id: 'agent-to-delete',
        userId: 'mukul',
        title: 'Deleted Agent',
        prompt: 'This will be deleted'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findByIdAndDelete as jest.Mock).mockResolvedValue(mockDeletedAgent)

      const request = new NextRequest('http://localhost:3000/api/voice-agents?id=agent-to-delete')

      const response = await DELETE(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(VoiceAgent.findByIdAndDelete).toHaveBeenCalledWith('agent-to-delete')
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Voice agent deleted successfully')
    })

    it('should return 400 when id is missing', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/voice-agents')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Agent ID is required')
      expect(VoiceAgent.findByIdAndDelete).not.toHaveBeenCalled()
    })

    it('should return 404 when agent not found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findByIdAndDelete as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/voice-agents?id=non-existent')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Voice agent not found')
    })

    it('should handle database deletion errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(VoiceAgent.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Deletion failed'))

      const request = new NextRequest('http://localhost:3000/api/voice-agents?id=agent-123')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete voice agent')
      expect(data.details).toBe('Deletion failed')
    })
  })
})

