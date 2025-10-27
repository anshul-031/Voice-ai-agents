/**
 * @jest-environment node
 */

import { DELETE, GET, POST, PUT } from '@/app/api/voice-agents/route'
import dbConnect, { clearMongoConnection } from '@/lib/mongodb'
import VoiceAgent from '@/models/VoiceAgent'
import { sanitizeKnowledgeItems } from '@/lib/knowledge'
import { NextRequest } from 'next/server'

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1]

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
  clearMongoConnection: jest.fn(),
}))
jest.mock('@/models/VoiceAgent')
jest.mock('@/lib/knowledge', () => ({
  sanitizeKnowledgeItems: jest.fn(),
}))

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>
const mockClearMongo = clearMongoConnection as jest.MockedFunction<typeof clearMongoConnection>
const mockSanitize = sanitizeKnowledgeItems as jest.MockedFunction<typeof sanitizeKnowledgeItems>

const voiceAgentCtor = VoiceAgent as jest.MockedFunction<any>
const mockVoiceAgentFind = jest.fn()
const mockVoiceAgentFindByIdAndUpdate = jest.fn()
const mockVoiceAgentFindByIdAndDelete = jest.fn()

;(VoiceAgent as any).find = mockVoiceAgentFind
;(VoiceAgent as any).findByIdAndUpdate = mockVoiceAgentFindByIdAndUpdate
;(VoiceAgent as any).findByIdAndDelete = mockVoiceAgentFindByIdAndDelete

const buildRequest = (url: string, init?: NextRequestInit) => new NextRequest(url, init)
const buildJsonRequest = (url: string, method: 'POST' | 'PUT', body: unknown) =>
  buildRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

describe('Voice agents API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDbConnect.mockResolvedValue(undefined as any)
    mockSanitize.mockImplementation((items: any) => items ?? [])
    voiceAgentCtor.mockReset()
    mockVoiceAgentFind.mockReset()
    mockVoiceAgentFindByIdAndUpdate.mockReset()
    mockVoiceAgentFindByIdAndDelete.mockReset()
  })

  describe('GET /api/voice-agents', () => {
    const buildFindChain = (agents: any[] | Promise<any[]>) => {
      const mockExec = jest.fn().mockImplementation(() => agents)
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec })
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      mockVoiceAgentFind.mockReturnValue({ sort: mockSort } as any)
      return { mockSort, mockLean, mockExec }
    }

    it('returns mapped agents for provided user', async () => {
      const now = new Date()
      const { mockSort } = buildFindChain(Promise.resolve([
        {
          _id: { toString: () => 'agent-1' },
          userId: 'custom-user',
          title: 'Agent 1',
          prompt: 'Prompt',
          llmModel: 'LLM',
          sttModel: 'STT',
          ttsModel: 'TTS',
          knowledgeItems: ['k'],
          lastUpdated: now,
          createdAt: now,
        },
      ]))

      const request = buildRequest('http://localhost/api/voice-agents?userId=custom-user')
      const response = await GET(request)
      const payload = await response.json()

    expect(mockDbConnect).toHaveBeenCalledTimes(1)
    expect(mockVoiceAgentFind).toHaveBeenCalledWith({ userId: 'custom-user' })
      expect(mockSort).toHaveBeenCalledWith({ lastUpdated: -1 })
      expect(response.status).toBe(200)
      expect(payload.success).toBe(true)
      expect(payload.count).toBe(1)
      expect(payload.agents[0]).toMatchObject({ id: 'agent-1', userId: 'custom-user' })
    })

    it('retries connection when initial attempt fails', async () => {
      mockDbConnect.mockRejectedValueOnce(new Error('connect fail')).mockResolvedValueOnce(undefined as any)
      buildFindChain(Promise.resolve([]))

      const request = buildRequest('http://localhost/api/voice-agents')
      const response = await GET(request)
      const payload = await response.json()

    expect(mockDbConnect).toHaveBeenCalledTimes(2)
    expect(mockClearMongo).toHaveBeenCalled()
    expect(mockVoiceAgentFind).toHaveBeenCalledWith({ userId: 'mukul' })
      expect(response.status).toBe(200)
      expect(payload.success).toBe(true)
    })

    it('returns 500 when fetching agents fails', async () => {
      buildFindChain(Promise.reject('boom'))

      const request = buildRequest('http://localhost/api/voice-agents')
      const response = await GET(request)
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe('Failed to fetch voice agents')
      expect(payload.details).toBe('Unknown error')
    })
  })

  describe('POST /api/voice-agents', () => {
    it('creates a new agent with defaults and sanitized knowledge', async () => {
      const save = jest.fn().mockResolvedValue(undefined)
      const knowledgeInput = [{
        itemId: 'item-1',
        name: 'Doc',
        type: 'text',
        size: 10,
        content: 'Body',
        createdAt: '2024-01-01T00:00:00.000Z',
        preview: 'Body',
      }]
      const sanitizedKnowledge = [{
        itemId: 'item-1',
        name: 'Doc',
        type: 'text' as const,
        size: 10,
        content: 'Body',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        preview: 'Body',
      }]
      mockSanitize.mockReturnValueOnce(sanitizedKnowledge)

      const agentInstance = {
        _id: { toString: () => 'agent-123' },
        userId: '',
        title: '',
        prompt: '',
        llmModel: '',
        sttModel: '',
        ttsModel: '',
        knowledgeItems: [] as typeof sanitizedKnowledge,
        lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        save,
      }
  voiceAgentCtor.mockImplementationOnce((payload: any) => Object.assign(agentInstance, payload))

      const response = await POST(
        buildJsonRequest('http://localhost/api/voice-agents', 'POST', {
          title: 'Hello',
          prompt: 'Prompt',
          knowledgeItems: knowledgeInput,
        }),
      )

      const payload = await response.json()

      expect(mockDbConnect).toHaveBeenCalled()
      expect(mockSanitize).toHaveBeenCalledWith(knowledgeInput)
      expect(save).toHaveBeenCalled()
      expect(agentInstance.title).toBe('Hello')
      expect(agentInstance.prompt).toBe('Prompt')
      expect(agentInstance.knowledgeItems).toEqual(sanitizedKnowledge)
      expect(response.status).toBe(200)
      expect(payload.success).toBe(true)
      expect(payload.agent.id).toBe('agent-123')
    })

    it('returns 400 when required fields missing', async () => {
      const response = await POST(
        buildJsonRequest('http://localhost/api/voice-agents', 'POST', {
          title: '',
          prompt: '',
        }),
      )

      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.error).toContain('Missing required fields')
      expect(voiceAgentCtor).not.toHaveBeenCalled()
    })

    it('returns 500 with details when save fails', async () => {
      const save = jest.fn().mockRejectedValueOnce(new Error('save failed'))
      voiceAgentCtor.mockImplementationOnce(() => ({
        _id: { toString: () => 'agent-1' },
        userId: 'mukul',
        title: 'Hi',
        prompt: 'Prompt',
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Sarvam Manisha',
        knowledgeItems: [],
        lastUpdated: new Date(),
        createdAt: new Date(),
        save,
      }))

      const response = await POST(
        buildJsonRequest('http://localhost/api/voice-agents', 'POST', {
          title: 'Hi',
          prompt: 'Prompt',
        }),
      )

      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(payload.error).toBe('Failed to create voice agent')
      expect(payload.details).toBe('save failed')
    })
  })

  describe('PUT /api/voice-agents', () => {
    it('validates presence of id and at least one update field', async () => {
      const request = buildJsonRequest('http://localhost/api/voice-agents', 'PUT', { id: '' })

      const response = await PUT(request)
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.error).toContain('Missing required fields')
      expect(mockVoiceAgentFindByIdAndUpdate).not.toHaveBeenCalled()
    })

    it('updates fields and sanitizes knowledge items when provided', async () => {
      const sanitizedKnowledge = [{
        itemId: 'item-2',
        name: 'FAQ',
        type: 'text' as const,
        size: 42,
        content: 'Faq text',
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        preview: 'Faq text',
      }]
      mockSanitize.mockReturnValueOnce(sanitizedKnowledge)
      mockVoiceAgentFindByIdAndUpdate.mockResolvedValue({
        _id: { toString: () => 'agent-1' },
        userId: 'mukul',
        title: 'Updated',
        prompt: 'Prompt',
        llmModel: 'LLM',
        sttModel: 'STT',
        ttsModel: 'TTS',
        knowledgeItems: sanitizedKnowledge,
        lastUpdated: new Date(),
        createdAt: new Date(),
      } as any)

      const request = buildJsonRequest('http://localhost/api/voice-agents', 'PUT', {
        id: 'agent-1',
        title: ' Updated ',
        knowledgeItems: [{ itemId: 'item-2', name: ' FAQ ', content: 'Faq text', type: 'csv', size: 100 }],
      })

      const response = await PUT(request)
      const payload = await response.json()

      expect(mockSanitize).toHaveBeenCalledWith([
        { itemId: 'item-2', name: ' FAQ ', content: 'Faq text', type: 'csv', size: 100 },
      ])
      expect(mockVoiceAgentFindByIdAndUpdate).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          title: 'Updated',
          knowledgeItems: sanitizedKnowledge,
          lastUpdated: expect.any(Date),
        }),
        { new: true, runValidators: true },
      )
      expect(response.status).toBe(200)
      expect(payload.success).toBe(true)
    })

    it('returns 404 when agent not found', async () => {
      mockVoiceAgentFindByIdAndUpdate.mockResolvedValue(null)

      const request = buildJsonRequest('http://localhost/api/voice-agents', 'PUT', {
        id: 'missing',
        title: 'Hi',
      })

      const response = await PUT(request)
      const payload = await response.json()

      expect(response.status).toBe(404)
      expect(payload.error).toBe('Voice agent not found')
    })

    it('returns 500 with Unknown error string when update fails unexpectedly', async () => {
      mockVoiceAgentFindByIdAndUpdate.mockRejectedValue('nope')

      const request = buildJsonRequest('http://localhost/api/voice-agents', 'PUT', {
        id: 'agent-1',
        title: 'Fail',
      })

      const response = await PUT(request)
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(payload.error).toBe('Failed to update voice agent')
      expect(payload.details).toBe('Unknown error')
    })
  })

  describe('DELETE /api/voice-agents', () => {
    it('requires the agent id in query string', async () => {
      const request = buildRequest('http://localhost/api/voice-agents')

      const response = await DELETE(request)
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.error).toBe('Agent ID is required')
    })

    it('returns success when agent is deleted', async () => {
      mockVoiceAgentFindByIdAndDelete.mockResolvedValue({ _id: 'agent-1' } as any)

      const request = buildRequest('http://localhost/api/voice-agents?id=agent-1', { method: 'DELETE' })
      const response = await DELETE(request)
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(payload.success).toBe(true)
      expect(payload.message).toBe('Voice agent deleted successfully')
    })

    it('returns 404 when agent missing', async () => {
      mockVoiceAgentFindByIdAndDelete.mockResolvedValue(null)

      const request = buildRequest('http://localhost/api/voice-agents?id=missing', { method: 'DELETE' })
      const response = await DELETE(request)
      const payload = await response.json()

      expect(response.status).toBe(404)
      expect(payload.error).toBe('Voice agent not found')
    })

    it('returns 500 when deletion throws non-error value', async () => {
      mockVoiceAgentFindByIdAndDelete.mockRejectedValue('kaboom')

      const request = buildRequest('http://localhost/api/voice-agents?id=agent-1', { method: 'DELETE' })
      const response = await DELETE(request)
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(payload.error).toBe('Failed to delete voice agent')
      expect(payload.details).toBe('Unknown error')
    })
  })
})
