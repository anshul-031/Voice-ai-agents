/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chat/save/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/mongodb')
jest.mock('@/models/Chat')

import dbConnect from '@/lib/mongodb'
import Chat from '@/models/Chat'

describe('API: /api/chat/save', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST Request - Save chat session log', () => {
    it('should save a session log with only user and assistant messages', async () => {
      const chatData = {
        userId: 'testuser',
        sessionId: 'session-123',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi, how can I help?' },
          { role: 'system', content: 'System message' },
          { role: 'user', content: 'Tell me a joke.' },
          { role: 'assistant', content: 'Why did the chicken cross the road?' }
        ],
        systemPrompt: 'You are helpful'
      }

      const mockSavedChat = {
        _id: 'chat-id-123',
        ...chatData,
        timestamp: new Date('2025-10-10T10:00:00')
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat as any).mockImplementation(function(data: any) {
        return {
          ...data,
          _id: mockSavedChat._id,
          timestamp: mockSavedChat.timestamp,
          save: jest.fn().mockResolvedValue(mockSavedChat)
        }
      })

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(chatData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.chatId).toBe('chat-id-123')
      expect(data.timestamp).toBeDefined()
    })

    it('should use default userId "mukul" when not provided', async () => {
      const chatData = {
        sessionId: 'session-123',
        messages: [
          { role: 'user', content: 'Test message' }
        ]
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      let capturedData: any
      ;(Chat as any).mockImplementation(function(data: any) {
        capturedData = data
        return {
          _id: 'test-id',
          timestamp: new Date(),
          save: jest.fn().mockResolvedValue({})
        }
      })

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(chatData)
      })

      await POST(request)

      expect(capturedData.userId).toBe('mukul')
    })

    it('should return 400 when sessionId is missing', async () => {
      const invalidData = {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 when messages array is missing or empty', async () => {
      const invalidData = {
        sessionId: 'session-123',
        messages: []
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 for no valid user/assistant messages to save', async () => {
      const invalidData = {
        sessionId: 'session-123',
        messages: [
          { role: 'system', content: 'System message' }
        ]
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('No valid user/assistant messages to save')
    })

    it('should handle database save errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat as any).mockImplementation(function() {
        return {
          save: jest.fn().mockRejectedValue(new Error('Save failed'))
        }
      })

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-123',
          messages: [
            { role: 'user', content: 'Test' }
          ]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save chat')
      expect(data.details).toBe('Save failed')
    })

    it('should return 400 when messages is not an array', async () => {
      const invalidData = {
        sessionId: 'session-123',
        messages: 'not an array'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should handle non-Error instance save errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat as any).mockImplementation(function() {
        return {
          save: jest.fn().mockRejectedValue('String error')
        }
      })

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-123',
          messages: [
            { role: 'user', content: 'Test' }
          ]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save chat')
      expect(data.details).toBe('Unknown error')
    })
  })
})
