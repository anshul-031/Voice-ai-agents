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

  describe('POST Request - Save chat message', () => {
    it('should save a user message', async () => {
      const chatData = {
        userId: 'testuser',
        sessionId: 'session-123',
        role: 'user',
        content: 'Hello, how are you?',
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

    it('should save an assistant message', async () => {
      const chatData = {
        sessionId: 'session-123',
        role: 'assistant',
        content: 'I am doing well, thank you!'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat as any).mockImplementation(function() {
        return {
          _id: 'chat-id-456',
          timestamp: new Date(),
          save: jest.fn().mockResolvedValue({})
        }
      })

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(chatData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should save a system message', async () => {
      const chatData = {
        sessionId: 'session-123',
        role: 'system',
        content: 'System initialized'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat as any).mockImplementation(function() {
        return {
          _id: 'chat-id-789',
          timestamp: new Date(),
          save: jest.fn().mockResolvedValue({})
        }
      })

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(chatData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should use default userId "mukul" when not provided', async () => {
      const chatData = {
        sessionId: 'session-123',
        role: 'user',
        content: 'Test message'
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
        role: 'user',
        content: 'Hello'
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

    it('should return 400 when role is missing', async () => {
      const invalidData = {
        sessionId: 'session-123',
        content: 'Hello'
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

    it('should return 400 when content is missing', async () => {
      const invalidData = {
        sessionId: 'session-123',
        role: 'user'
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

    it('should return 400 for invalid role', async () => {
      const invalidData = {
        sessionId: 'session-123',
        role: 'invalid-role',
        content: 'Hello'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/chat/save', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid role')
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
          role: 'user',
          content: 'Test'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save chat')
      expect(data.details).toBe('Save failed')
    })
  })
})
