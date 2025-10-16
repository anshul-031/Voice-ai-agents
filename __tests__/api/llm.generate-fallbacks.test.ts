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

// Default mock; individual tests will override as needed
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}))

describe('API: /api/llm generate fallbacks and extractText variants', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'key' }
    jest.clearAllMocks()
  })
  afterEach(() => {
    process.env = originalEnv
  })

  it('falls back from generate({prompt}) to generate(string) on retry', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    // getGenerativeModel exposes only generate, not generateContent
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generate: jest
          .fn()
          // First call rejects to trigger retry branch
          .mockRejectedValueOnce(new Error('bad shape'))
          // Second call resolves with string output
          .mockResolvedValue('retry-ok'),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'Hello' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.llmText).toContain('retry-ok')
  })

  it('handles result.response.text() extraction path', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: async () => 'from-response-text' },
        }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'Hi' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.llmText).toContain('from-response-text')
  })

  it('handles object with top-level text field extraction path', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({ text: 'direct-text-field' }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'Hi there' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.llmText).toContain('direct-text-field')
  })

  it('initializes fallback model when primary model init throws', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const getGenerativeModel = jest.fn(({ model }: { model: string }) => {
      if (model === 'gemini-2.0-flash') {
        throw new Error('init-fail')
      }
      return {
        generateContent: jest.fn().mockResolvedValue({ text: 'ok-after-fallback' }),
      }
    })
    GoogleGenerativeAI.mockImplementationOnce(() => ({ getGenerativeModel }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'Fallback please' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.llmText).toContain('ok-after-fallback')
  })

  it('returns 500 when model exposes neither generateContent nor generate', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({}),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'No methods' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
