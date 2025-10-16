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

// Reset table-mocks per test
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockResolvedValue('ok'),
        },
      }),
    }),
  })),
}))

describe('API: /api/llm extra branches', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, GEMINI_API_KEY: 'key' }
  })
  afterEach(() => {
    process.env = originalEnv
  })

  it('falls back to generate() when generateContent not present', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        // no generateContent
        generate: jest.fn().mockResolvedValue({
          text: async () => 'from-generate',
        }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'hello' }),
    })

    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(String(data.llmText)).toContain('from-generate')
  })

  it('retries generate() with direct string param on error', async () => {
    const generateMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('bad shape'))
      .mockResolvedValueOnce({ text: async () => 'retry-ok' })

    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generate: generateMock,
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'hello' }),
    })

    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(String(data.llmText)).toContain('retry-ok')
    expect(generateMock).toHaveBeenCalledTimes(2)
  })

  it('handles initialization fallback path when flash model fails', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest
        .fn()
        .mockImplementationOnce(() => { throw new Error('no flash') })
        .mockReturnValueOnce({
          generateContent: jest.fn().mockResolvedValue({
            response: { text: jest.fn().mockResolvedValue('fallback-ok') },
          }),
        }),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'hello' }),
    })

    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(String(data.llmText)).toContain('fallback-ok')
  })

  it('returns 500 when neither flash nor fallback model initialize', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const bad = () => { throw new Error('no model') }
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockImplementationOnce(bad).mockImplementationOnce(bad),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'hello' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 500 when extracted text is empty despite various shapes', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({ text: async () => '' }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'hello' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
