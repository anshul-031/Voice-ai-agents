/**
 * @jest-environment node
 */
import { GET } from '@/app/api/chat/sessions/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/mongodb')
jest.mock('@/models/Chat')

import dbConnect, { clearMongoConnection } from '@/lib/mongodb'
import Chat from '@/models/Chat'

describe('API: /api/chat/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET Request - Fetch chat sessions', () => {
    it('should return all sessions for a user', async () => {
      const mockSessions = [
        {
          sessionId: 'session-1',
          userId: 'testuser',
          messageCount: 10,
          firstMessage: 'Hello',
          lastMessage: 'Goodbye',
          lastTimestamp: new Date('2025-10-10T12:00:00'),
          firstTimestamp: new Date('2025-10-10T10:00:00')
        },
        {
          sessionId: 'session-2',
          userId: 'testuser',
          messageCount: 5,
          firstMessage: 'Hi there',
          lastMessage: 'See you later',
          lastTimestamp: new Date('2025-10-09T15:00:00'),
          firstTimestamp: new Date('2025-10-09T14:00:00')
        }
      ]

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.aggregate as jest.Mock).mockResolvedValue(mockSessions)

      const request = new NextRequest('http://localhost:3000/api/chat/sessions?userId=testuser')

      const response = await GET(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(Chat.aggregate).toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.userId).toBe('testuser')
      expect(data.count).toBe(2)
      expect(data.sessions).toHaveLength(2)
      expect(data.sessions[0]).toMatchObject({
        sessionId: 'session-1',
        messageCount: 10
      })
    })

    it('should use default userId "mukul" when not provided', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.aggregate as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/chat/sessions')

      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.userId).toBe('mukul')
    })

    it('should return empty array when no sessions found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.aggregate as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/chat/sessions?userId=newuser')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.sessions).toEqual([])
      expect(data.count).toBe(0)
    })

    it('should retry connection on initial failure', async () => {
      ;(dbConnect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined)
      ;(clearMongoConnection as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.aggregate as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/chat/sessions')

      const response = await GET(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalledTimes(2)
      expect(clearMongoConnection).toHaveBeenCalled()
      expect(data.success).toBe(true)
    })

    it('should verify aggregate pipeline structure', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.aggregate as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/chat/sessions?userId=testuser')

      await GET(request)

      expect(Chat.aggregate).toHaveBeenCalledWith([
        { $match: { userId: 'testuser' } },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$sessionId',
            sessionId: { $first: '$sessionId' },
            userId: { $first: '$userId' },
            messageCount: { $sum: 1 },
            firstMessage: { $last: '$content' },
            lastMessage: { $first: '$content' },
            lastTimestamp: { $first: '$timestamp' },
            firstTimestamp: { $last: '$timestamp' }
          }
        },
        { $sort: { lastTimestamp: -1 } },
        {
          $project: {
            _id: 0,
            sessionId: 1,
            userId: 1,
            messageCount: 1,
            firstMessage: 1,
            lastMessage: 1,
            lastTimestamp: 1,
            firstTimestamp: 1
          }
        }
      ])
    })

    it('should handle database aggregation errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.aggregate as jest.Mock).mockRejectedValue(new Error('Aggregation failed'))

      const request = new NextRequest('http://localhost:3000/api/chat/sessions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch sessions')
      expect(data.details).toBe('Aggregation failed')
    })

    it('should handle non-Error instance errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(Chat.aggregate as jest.Mock).mockRejectedValue('String error')

      const request = new NextRequest('http://localhost:3000/api/chat/sessions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch sessions')
      expect(data.details).toBe('Unknown error')
    })
  })
})
