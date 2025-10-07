/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/llm/route'

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}))

describe('API: /api/llm extractText fallback JSON stringify', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'key' }
    jest.clearAllMocks()
  })
  afterEach(() => { process.env = originalEnv })

  it('falls back to JSON.stringify when no known fields present', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({ foo: 'bar', answer: 42 }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'Hi' }) })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    // Stringified result will include keys
    expect(data.llmText).toContain('foo')
    expect(data.llmText).toContain('42')
  })
})
