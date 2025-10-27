/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/agent-tools/route'
import { DELETE, PUT } from '@/app/api/agent-tools/[toolId]/route'
import dbConnect from '@/lib/mongodb'
import AgentTool from '@/models/AgentTool'
import { NextRequest } from 'next/server'

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1]

jest.mock('@/lib/mongodb', () => jest.fn())

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>

const asMock = <T extends (...args: any[]) => any>(fn: T) => fn as unknown as jest.MockedFunction<T>

const buildRequest = (url: string, init?: NextRequestInit) => new NextRequest(url, init)

const buildJsonRequest = (url: string, method: 'POST' | 'PUT', body: unknown) =>
  buildRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })

describe('Agent tools API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDbConnect.mockResolvedValue(undefined as any)
  })

  describe('GET /api/agent-tools', () => {
    it('returns tools filtered by agentId with most recent first', async () => {
      const mockLean = jest.fn().mockResolvedValue([
        { _id: 'tool-2' },
        { _id: 'tool-1' },
      ])
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      asMock(AgentTool.find).mockReturnValue({ sort: mockSort } as any)

      const request = buildRequest('http://localhost/api/agent-tools?agentId=agent-123')
      const response = await GET(request)
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(mockDbConnect).toHaveBeenCalled()
      expect(AgentTool.find).toHaveBeenCalledWith({ userId: 'mukul', agentId: 'agent-123' })
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(payload.tools).toHaveLength(2)
    })

    it('omits agent filter when no agentId is provided', async () => {
      const mockLean = jest.fn().mockResolvedValue([{ _id: 'tool-1' }])
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      asMock(AgentTool.find).mockReturnValue({ sort: mockSort } as any)

      const request = buildRequest('http://localhost/api/agent-tools')
      const response = await GET(request)
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(mockDbConnect).toHaveBeenCalled()
      expect(AgentTool.find).toHaveBeenCalledWith({ userId: 'mukul' })
      expect(payload.tools).toHaveLength(1)
    })

    it('handles database failures gracefully', async () => {
      const mockLean = jest.fn().mockRejectedValue(new Error('boom'))
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      asMock(AgentTool.find).mockReturnValue({ sort: mockSort } as any)

      const request = buildRequest('http://localhost/api/agent-tools')
      const response = await GET(request)
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(payload.error).toBe('Failed to fetch agent tools')
    })
  })

  describe('POST /api/agent-tools', () => {
    it('validates required fields', async () => {
      const request = buildJsonRequest('http://localhost/api/agent-tools', 'POST', {
        webhookUrl: 'https://example.com/hook',
      })

      const response = await POST(request)
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.error).toBe('Name and webhook URL are required')
      expect(AgentTool.create).not.toHaveBeenCalled()
    })

    it('creates a tool with trimmed data and filtered arrays', async () => {
      const mockTool = { _id: 'tool-123', name: 'Create Ticket' }
      asMock(AgentTool.create).mockResolvedValue(mockTool as any)

      const request = buildJsonRequest('http://localhost/api/agent-tools', 'POST', {
        agentId: 'agent-42',
        name: '  Create Ticket  ',
        description: '  escalate issue  ',
        webhookUrl: ' https://example.com/hook ',
        headers: [
          { key: ' Authorization ', value: 'Bearer token' },
          { key: '', value: 'skip' },
        ],
        parameters: [
          { name: ' ticketId ', description: '  ID  ', type: ' number ', required: true },
          { description: 'missing name' },
        ],
        triggerPhrases: ['  open ticket  ', '  '],
        successMessage: ' done ',
        failureMessage: ' fail ',
        runAfterCall: true,
        method: 'GET',
      })

      const response = await POST(request)
      const payload = await response.json()

  expect(response.status).toBe(200)
  expect(payload.tool).toMatchObject({ _id: 'tool-123', name: 'Create Ticket' })
      expect(AgentTool.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'mukul',
          agentId: 'agent-42',
          name: 'Create Ticket',
          description: 'escalate issue',
          webhookUrl: 'https://example.com/hook',
          method: 'GET',
          headers: [{ key: 'Authorization', value: 'Bearer token' }],
          parameters: [
            {
              name: 'ticketId',
              description: 'ID',
              type: 'number',
              required: true,
            },
          ],
          triggerPhrases: ['open ticket'],
          successMessage: 'done',
          failureMessage: 'fail',
          runAfterCall: true,
        }),
      )
    })

    it('returns 500 when creation fails', async () => {
      asMock(AgentTool.create).mockRejectedValue(new Error('db down'))

      const request = buildJsonRequest('http://localhost/api/agent-tools', 'POST', {
        name: 'Test',
        webhookUrl: 'https://example.com/hook',
      })

      const response = await POST(request)
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(payload.error).toBe('Failed to create agent tool')
    })

    it('normalizes optional parameter metadata and empty messages', async () => {
      asMock(AgentTool.create).mockResolvedValue({ _id: 'tool-456' } as any)

      const request = buildJsonRequest('http://localhost/api/agent-tools', 'POST', {
        name: 'Defaults',
        description: '',
        webhookUrl: 'https://example.com/default',
        parameters: [{ name: 'ticket' }],
        successMessage: '',
        failureMessage: '',
      })

      const response = await POST(request)
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(payload.tool).toMatchObject({ _id: 'tool-456' })
      expect(AgentTool.create).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          description: undefined,
          parameters: [
            {
              name: 'ticket',
              description: undefined,
              type: 'string',
              required: false,
            },
          ],
          successMessage: undefined,
          failureMessage: undefined,
          runAfterCall: false,
        }),
      )
    })

    it('defaults optional collections when payload uses non-array values', async () => {
      asMock(AgentTool.create).mockResolvedValue({ _id: 'tool-789' } as any)

      const request = buildJsonRequest('http://localhost/api/agent-tools', 'POST', {
        name: 'Malformed',
        webhookUrl: 'https://example.com/raw',
        headers: 'invalid',
        parameters: null,
        triggerPhrases: 'hook now',
      })

      const response = await POST(request)
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(payload.tool).toMatchObject({ _id: 'tool-789' })
      expect(AgentTool.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: [],
          parameters: [],
          triggerPhrases: [],
        }),
      )
    })
  })

  describe('PUT /api/agent-tools/[toolId]', () => {
    const params = Promise.resolve({ toolId: 'tool-1' })

    it('updates an existing tool', async () => {
      const mockTool = {
        name: 'Original',
        description: undefined,
        webhookUrl: 'https://old.example.com',
        method: 'POST',
        headers: [],
        parameters: [],
        triggerPhrases: [],
        successMessage: undefined,
        failureMessage: undefined,
        runAfterCall: false,
        save: jest.fn().mockResolvedValue(undefined),
      }
      asMock(AgentTool.findById).mockResolvedValue(mockTool as any)

      const request = buildJsonRequest('http://localhost/api/agent-tools/tool-1', 'PUT', {
        name: ' Updated ',
        description: ' desc ',
        webhookUrl: ' https://new.example.com ',
        method: 'GET',
        headers: [{ key: ' X-App ', value: 'core' }],
        parameters: [{ name: 'ref', description: 'Ref ID', type: 'number', required: true }],
        triggerPhrases: [' do thing '],
        successMessage: ' ok ',
        failureMessage: ' nope ',
        runAfterCall: true,
      })

      const response = await PUT(request, { params })
      const payload = await response.json()

  expect(response.status).toBe(200)
  expect(mockTool.name).toBe('Updated')
      expect(mockTool.description).toBe('desc')
      expect(mockTool.webhookUrl).toBe('https://new.example.com')
      expect(mockTool.method).toBe('GET')
      expect(mockTool.headers).toEqual([{ key: 'X-App', value: 'core' }])
      expect(mockTool.parameters).toEqual([
        { name: 'ref', description: 'Ref ID', type: 'number', required: true },
      ])
      expect(mockTool.triggerPhrases).toEqual(['do thing'])
      expect(mockTool.successMessage).toBe('ok')
      expect(mockTool.failureMessage).toBe('nope')
      expect(mockTool.runAfterCall).toBe(true)
      expect(mockTool.save).toHaveBeenCalled()
      expect(payload.tool).toMatchObject({
        name: 'Updated',
        description: 'desc',
        webhookUrl: 'https://new.example.com',
        method: 'GET',
        headers: [{ key: 'X-App', value: 'core' }],
        parameters: [{ name: 'ref', description: 'Ref ID', type: 'number', required: true }],
        triggerPhrases: ['do thing'],
        successMessage: 'ok',
        failureMessage: 'nope',
        runAfterCall: true,
      })
    })

    it('returns 404 when tool is missing', async () => {
      asMock(AgentTool.findById).mockResolvedValue(null)

      const request = buildJsonRequest('http://localhost/api/agent-tools/tool-1', 'PUT', {})
      const response = await PUT(request, { params })
      const payload = await response.json()

      expect(response.status).toBe(404)
      expect(payload.error).toBe('Tool not found')
    })

    it('returns 500 on unexpected errors', async () => {
      asMock(AgentTool.findById).mockRejectedValue(new Error('db failed'))

      const request = buildJsonRequest('http://localhost/api/agent-tools/tool-1', 'PUT', {})
      const response = await PUT(request, { params })
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(payload.error).toBe('Failed to update agent tool')
    })

    it('ignores non-array payload values while preserving existing data', async () => {
      const mockTool = {
        name: 'Original',
        description: 'keep',
        webhookUrl: 'https://existing.example.com',
        method: 'POST',
        headers: [{ key: 'Auth', value: 'token' }],
        parameters: [{ name: 'id', type: 'string', required: false }],
        triggerPhrases: ['fetch id'],
        successMessage: 'ok',
        failureMessage: 'fail',
        runAfterCall: true,
        save: jest.fn().mockResolvedValue(undefined),
      }
      asMock(AgentTool.findById).mockResolvedValue(mockTool as any)

      const request = buildJsonRequest('http://localhost/api/agent-tools/tool-1', 'PUT', {
        headers: 'not-an-array',
        parameters: null,
        triggerPhrases: 'run',
        successMessage: null,
        failureMessage: undefined,
      })

      const response = await PUT(request, { params })
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(mockTool.headers).toEqual([{ key: 'Auth', value: 'token' }])
      expect(mockTool.parameters).toEqual([{ name: 'id', type: 'string', required: false }])
      expect(mockTool.triggerPhrases).toEqual(['fetch id'])
      expect(mockTool.successMessage).toBeUndefined()
      expect(mockTool.failureMessage).toBe('fail')
      expect(mockTool.runAfterCall).toBe(true)
      expect(mockTool.save).toHaveBeenCalled()
      expect(payload.tool).toMatchObject({
        headers: [{ key: 'Auth', value: 'token' }],
        triggerPhrases: ['fetch id'],
      })
      expect('successMessage' in payload.tool).toBe(false)
    })

    it('returns the tool unchanged when payload is empty', async () => {
      const mockTool = {
        name: 'Stay',
        description: 'same',
        webhookUrl: 'https://existing.example.com',
        method: 'POST',
        headers: [{ key: 'X-Trace', value: '123' }],
        parameters: [{ name: 'traceId', type: 'string', required: false }],
        triggerPhrases: ['trace'],
        successMessage: 'ok',
        failureMessage: 'fail',
        runAfterCall: false,
        save: jest.fn().mockResolvedValue(undefined),
      }
      asMock(AgentTool.findById).mockResolvedValue(mockTool as any)

      const request = buildJsonRequest('http://localhost/api/agent-tools/tool-1', 'PUT', {})
      const response = await PUT(request, { params })
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(mockTool).toMatchObject({
        name: 'Stay',
        description: 'same',
        webhookUrl: 'https://existing.example.com',
        method: 'POST',
        successMessage: 'ok',
        failureMessage: 'fail',
        runAfterCall: false,
      })
      expect(mockTool.save).toHaveBeenCalled()
      expect(payload.tool).toMatchObject({ name: 'Stay', runAfterCall: false })
    })

    it('clears optional fields when empty payload values are provided', async () => {
      const mockTool = {
        name: 'Original',
        description: 'keep',
        webhookUrl: 'https://existing.example.com',
        method: 'POST',
        headers: [{ key: 'Auth', value: 'token' }],
        parameters: [{ name: 'id', description: 'ID', type: 'number', required: true }],
        triggerPhrases: ['fetch id'],
        successMessage: 'ok',
        failureMessage: 'fail',
        runAfterCall: true,
        save: jest.fn().mockResolvedValue(undefined),
      }
      asMock(AgentTool.findById).mockResolvedValue(mockTool as any)

      const request = buildJsonRequest('http://localhost/api/agent-tools/tool-1', 'PUT', {
        description: '',
        parameters: [{ name: 'id' }],
        successMessage: '',
        failureMessage: '',
        runAfterCall: false,
      })

      const response = await PUT(request, { params })
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(mockTool.description).toBeUndefined()
      expect(mockTool.parameters).toEqual([
        { name: 'id', description: undefined, type: 'string', required: false },
      ])
      expect(mockTool.successMessage).toBeUndefined()
      expect(mockTool.failureMessage).toBeUndefined()
      expect(mockTool.runAfterCall).toBe(false)
      expect(mockTool.save).toHaveBeenCalled()
      expect(payload.tool).toMatchObject({ runAfterCall: false })
    })
  })

  describe('DELETE /api/agent-tools/[toolId]', () => {
    const params = Promise.resolve({ toolId: 'tool-9' })

    it('deletes an existing tool', async () => {
      const mockTool = {
        deleteOne: jest.fn().mockResolvedValue(undefined),
      }
      asMock(AgentTool.findById).mockResolvedValue(mockTool as any)

      const request = buildRequest('http://localhost/api/agent-tools/tool-9', { method: 'DELETE' })
      const response = await DELETE(request, { params })
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(mockTool.deleteOne).toHaveBeenCalled()
      expect(payload.success).toBe(true)
    })

    it('returns 404 if tool does not exist', async () => {
      asMock(AgentTool.findById).mockResolvedValue(null)

      const request = buildRequest('http://localhost/api/agent-tools/tool-9', { method: 'DELETE' })
      const response = await DELETE(request, { params })
      const payload = await response.json()

      expect(response.status).toBe(404)
      expect(payload.error).toBe('Tool not found')
    })

    it('returns 500 when deletion fails', async () => {
      const mockTool = {
        deleteOne: jest.fn().mockRejectedValue(new Error('nope')),
      }
      asMock(AgentTool.findById).mockResolvedValue(mockTool as any)

      const request = buildRequest('http://localhost/api/agent-tools/tool-9', { method: 'DELETE' })
      const response = await DELETE(request, { params })
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(payload.error).toBe('Failed to delete agent tool')
    })
  })
})
