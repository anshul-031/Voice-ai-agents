/**
 * @jest-environment node
 */
import { DELETE, GET } from '@/app/api/chat/history/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/mongodb')
jest.mock('@/models/Chat')

import dbConnect from '@/lib/mongodb'
import Chat from '@/models/Chat'

describe('API: /api/chat/history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET Request - Fetch chat history', () => {
    it('should return chat history for a session', async () => {
      const mockChats = [
        {
          _id: 'chat-1',
          sessionId: 'session-123',
          role: 'user',
          content: 'Hello',
          timestamp: new Date('2025-10-10T10:00:00'),
          systemPrompt: 'You are a helper'
        },
        {
          _id: 'chat-2',
          sessionId: 'session-123',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date('2025-10-10T10:01:00'),
          systemPrompt: 'You are a helper'
        }
      ]

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockChats)
      }
      ;(Chat.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/chat/history?sessionId=session-123')

      const response = await GET(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(Chat.find).toHaveBeenCalledWith({ sessionId: 'session-123' })
      expect(mockChain.sort).toHaveBeenCalledWith({ timestamp: 1 })
      expect(mockChain.skip).toHaveBeenCalledWith(0)
      expect(mockChain.limit).toHaveBeenCalledWith(100)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.sessionId).toBe('session-123')
      expect(data.count).toBe(2)
      expect(data.chats).toHaveLength(2)
    })

    it('should apply custom limit and skip', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      }
      ;(Chat.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/chat/history?sessionId=session-123&limit=50&skip=10')

      await GET(request)

      expect(mockChain.skip).toHaveBeenCalledWith(10)
      expect(mockChain.limit).toHaveBeenCalledWith(50)
    })

    it('should return 400 when sessionId is missing', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/chat/history')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('sessionId is required')
    })

    it('should return empty array when no chats found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      }
      ;(Chat.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/chat/history?sessionId=empty-session')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.chats).toEqual([])
      expect(data.count).toBe(0)
    })

    it('should handle database errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      }
      ;(Chat.find as jest.Mock).mockReturnValue(mockChain)

      const request = new NextRequest('http://localhost:3000/api/chat/history?sessionId=session-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch chat history')
      expect(data.details).toBe('Database error')
    })
  })

  describe('DELETE Request - Delete chat history', () => {
    it('should delete all chats for a session', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 })

      const request = new NextRequest('http://localhost:3000/api/chat/history?sessionId=session-123')

      const response = await DELETE(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(Chat.deleteMany).toHaveBeenCalledWith({ sessionId: 'session-123' })
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.deletedCount).toBe(5)
    })

    it('should return 400 when sessionId is missing', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/chat/history')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('sessionId is required')
      expect(Chat.deleteMany).not.toHaveBeenCalled()
    })

    it('should handle deletion of empty session (0 deleted)', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 })

      const request = new NextRequest('http://localhost:3000/api/chat/history?sessionId=empty-session')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.deletedCount).toBe(0)
    })

    it('should handle database errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.deleteMany as jest.Mock).mockRejectedValue(new Error('Delete failed'))

      const request = new NextRequest('http://localhost:3000/api/chat/history?sessionId=session-123')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete chat history')
      expect(data.details).toBe('Delete failed')
    })
  })
})
