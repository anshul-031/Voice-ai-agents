/**
 * @jest-environment node
 */
import { POST } from '@/app/api/llm/route'
import { NextRequest } from 'next/server'

jest.mock('@/models/Chat', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}))

// Default mock
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}))

describe('API: /api/llm extractText and error mappings', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'key' }
    jest.clearAllMocks()
  })
  afterEach(() => { process.env = originalEnv })

  it('extracts text from candidates array', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          candidates: [{ output: 'from-candidates' }],
        }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'hi' }) })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.llmText).toContain('from-candidates')
  })

  it('extracts text from output array content structure', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          output: [{ content: [{ text: 'nested-text' }] }],
        }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'hi' }) })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.llmText).toContain('nested-text')
  })

  it('maps 403 auth-related error to 403', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockRejectedValue({ status: 403, response: { data: 'Forbidden' } }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'hi' }) })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns generic 500 when error has no status', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('boom')),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'hi' }) })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
