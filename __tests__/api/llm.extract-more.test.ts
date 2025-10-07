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

describe('API: /api/llm extractText remaining shapes', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'key' }
    jest.clearAllMocks()
  })
  afterEach(() => { process.env = originalEnv })

  it('extracts from output[0].content string', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({ output: [{ content: 'plain-content' }] }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'hi' }) })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.llmText).toContain('plain-content')
  })

  it('extracts from candidates[0].content string', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({ candidates: [{ content: 'candidate-content' }] }),
      }),
    }))

    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'hello' }) })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.llmText).toContain('candidate-content')
  })
})
