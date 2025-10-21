/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/agent-tools/route'
import { DELETE, PUT } from '@/app/api/agent-tools/[toolId]/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/mongodb')
jest.mock('@/models/AgentTool')

import dbConnect from '@/lib/mongodb'
import AgentTool from '@/models/AgentTool'

describe('API: /api/agent-tools', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET - fetch tools', () => {
    it('returns tools for the requested agent and user', async () => {
      const mockTools = [
        { _id: 'tool-1', name: 'CRM Sync', createdAt: new Date('2025-10-20') },
        { _id: 'tool-2', name: 'Order Lookup', createdAt: new Date('2025-10-18') }
      ]

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const mockLean = jest.fn().mockResolvedValue(mockTools)
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      ;(AgentTool.find as jest.Mock).mockReturnValue({ sort: mockSort })

      const request = new NextRequest('http://localhost:3000/api/agent-tools?userId=anshul&agentId=agent-42')
      const response = await GET(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(AgentTool.find).toHaveBeenCalledWith({ userId: 'anshul', agentId: 'agent-42' })
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(response.status).toBe(200)
  expect(data.tools).toHaveLength(2)
  expect(data.tools[0]).toMatchObject({ _id: 'tool-1', name: 'CRM Sync' })
  expect(data.tools[1]).toMatchObject({ _id: 'tool-2', name: 'Order Lookup' })
    })

    it('uses default user when no userId provided', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      const mockLean = jest.fn().mockResolvedValue([])
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      ;(AgentTool.find as jest.Mock).mockReturnValue({ sort: mockSort })

      const request = new NextRequest('http://localhost:3000/api/agent-tools')
      await GET(request)

      expect(AgentTool.find).toHaveBeenCalledWith({ userId: 'mukul' })
    })

    it('handles database errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      const mockLean = jest.fn().mockRejectedValue(new Error('query failed'))
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      ;(AgentTool.find as jest.Mock).mockReturnValue({ sort: mockSort })

      const request = new NextRequest('http://localhost:3000/api/agent-tools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch agent tools')
    })
  })

  describe('POST - create tool', () => {
    it('normalises payload and persists the tool', async () => {
      const payload = {
        agentId: 'agent-42',
        name: '  CRM Sync  ',
        description: '  syncs leads  ',
        webhookUrl: ' https://example.com/hook ',
        method: 'POST',
        headers: [
          { key: 'Authorization', value: 'Bearer token' },
          { key: '', value: '' }
        ],
        parameters: [
          { name: 'orderId', description: ' ID ', type: 'string', required: true },
          { name: '', description: 'ignored' }
        ],
        triggerPhrases: [' run sync ', ''],
        successMessage: '  done  ',
        failureMessage: '  fail  ',
        runAfterCall: true,
        userId: 'anshul'
      }

      const createdTool = {
        _id: 'tool-1',
        ...payload,
        name: 'CRM Sync',
        description: 'syncs leads',
        webhookUrl: 'https://example.com/hook',
        headers: [{ key: 'Authorization', value: 'Bearer token' }],
        parameters: [{ name: 'orderId', description: 'ID', type: 'string', required: true }],
        triggerPhrases: ['run sync'],
        successMessage: 'done',
        failureMessage: 'fail',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(AgentTool.create as jest.Mock).mockResolvedValue(createdTool)

      const request = new NextRequest('http://localhost:3000/api/agent-tools', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(AgentTool.create).toHaveBeenCalledWith({
        userId: 'anshul',
        agentId: 'agent-42',
        name: 'CRM Sync',
        description: 'syncs leads',
        webhookUrl: 'https://example.com/hook',
        method: 'POST',
        headers: [{ key: 'Authorization', value: 'Bearer token' }],
        parameters: [{ name: 'orderId', description: 'ID', type: 'string', required: true }],
        triggerPhrases: ['run sync'],
        successMessage: 'done',
        failureMessage: 'fail',
        runAfterCall: true
      })
      expect(response.status).toBe(200)
      expect(data.tool).toMatchObject({
        _id: 'tool-1',
        userId: 'anshul',
        name: 'CRM Sync',
        description: 'syncs leads',
        webhookUrl: 'https://example.com/hook',
        headers: [{ key: 'Authorization', value: 'Bearer token' }],
        triggerPhrases: ['run sync'],
        runAfterCall: true
      })
    })

    it('returns 400 when required fields are missing', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/agent-tools', {
        method: 'POST',
        body: JSON.stringify({ description: 'missing essentials' }),
        headers: { 'content-type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name and webhook URL are required')
      expect(AgentTool.create).not.toHaveBeenCalled()
    })

    it('returns 500 when persistence fails', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(AgentTool.create as jest.Mock).mockRejectedValue(new Error('boom'))

      const request = new NextRequest('http://localhost:3000/api/agent-tools', {
        method: 'POST',
        body: JSON.stringify({ name: 'Tool', webhookUrl: 'https://hook.dev' }),
        headers: { 'content-type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create agent tool')
    })
  })

  describe('PUT - update tool', () => {
    it('updates editable fields and saves the document', async () => {
      const mockTool = {
        _id: 'tool-1',
        name: 'Old Name',
        description: 'Old description',
        webhookUrl: 'https://old.example.com',
        method: 'POST',
        headers: [],
        parameters: [],
        triggerPhrases: [],
        successMessage: 'ok',
        failureMessage: 'fail',
        runAfterCall: false,
        save: jest.fn().mockResolvedValue(true)
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(AgentTool.findById as jest.Mock).mockResolvedValue(mockTool)

      const payload = {
        name: '  New Name  ',
        description: '  New description  ',
        webhookUrl: ' https://new.example.com ',
        method: 'GET',
        headers: [{ key: 'X-Test', value: '1' }, { key: '', value: '' }],
        parameters: [{ name: 'foo', required: true }, { name: '' }],
        triggerPhrases: [' trigger '],
        successMessage: '  success  ',
        failureMessage: '  failed  ',
        runAfterCall: true
      }

      const request = new NextRequest('http://localhost:3000/api/agent-tools/tool-1', {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json' }
      })

      const response = await PUT(request, { params: { toolId: 'tool-1' } } as any)
      const data = await response.json()

      expect(AgentTool.findById).toHaveBeenCalledWith('tool-1')
      expect(mockTool.name).toBe('New Name')
      expect(mockTool.description).toBe('New description')
      expect(mockTool.webhookUrl).toBe('https://new.example.com')
      expect(mockTool.method).toBe('GET')
      expect(mockTool.headers).toEqual([{ key: 'X-Test', value: '1' }])
      expect(mockTool.parameters).toEqual([{ name: 'foo', description: undefined, type: 'string', required: true }])
      expect(mockTool.triggerPhrases).toEqual(['trigger'])
      expect(mockTool.successMessage).toBe('success')
      expect(mockTool.failureMessage).toBe('failed')
      expect(mockTool.runAfterCall).toBe(true)
      expect(mockTool.save).toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(data.tool).toMatchObject({
        name: 'New Name',
        description: 'New description',
        webhookUrl: 'https://new.example.com',
        method: 'GET',
        headers: [{ key: 'X-Test', value: '1' }],
        triggerPhrases: ['trigger'],
        runAfterCall: true,
        successMessage: 'success',
        failureMessage: 'failed'
      })
    })

    it('returns 404 when the tool does not exist', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(AgentTool.findById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/agent-tools/missing', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Missing' }),
        headers: { 'content-type': 'application/json' }
      })

      const response = await PUT(request, { params: { toolId: 'missing' } } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Tool not found')
    })

    it('returns 500 when update fails', async () => {
      const mockTool = {
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(AgentTool.findById as jest.Mock).mockResolvedValue(mockTool)

      const request = new NextRequest('http://localhost:3000/api/agent-tools/tool-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New' }),
        headers: { 'content-type': 'application/json' }
      })

      const response = await PUT(request, { params: { toolId: 'tool-1' } } as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update agent tool')
    })
  })

  describe('DELETE - remove tool', () => {
    it('deletes an existing tool', async () => {
      const mockTool = {
        deleteOne: jest.fn().mockResolvedValue(true)
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(AgentTool.findById as jest.Mock).mockResolvedValue(mockTool)

      const request = new NextRequest('http://localhost:3000/api/agent-tools/tool-1', { method: 'DELETE' })

      const response = await DELETE(request, { params: { toolId: 'tool-1' } } as any)
      const data = await response.json()

      expect(AgentTool.findById).toHaveBeenCalledWith('tool-1')
      expect(mockTool.deleteOne).toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('returns 404 when tool is not found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(AgentTool.findById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/agent-tools/missing', { method: 'DELETE' })

      const response = await DELETE(request, { params: { toolId: 'missing' } } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Tool not found')
    })

    it('returns 500 when deletion fails', async () => {
      const mockTool = {
        deleteOne: jest.fn().mockRejectedValue(new Error('delete failed'))
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(AgentTool.findById as jest.Mock).mockResolvedValue(mockTool)

      const request = new NextRequest('http://localhost:3000/api/agent-tools/tool-1', { method: 'DELETE' })

      const response = await DELETE(request, { params: { toolId: 'tool-1' } } as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete agent tool')
    })
  })
})
