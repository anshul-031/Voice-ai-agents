/**
 * @jest-environment node
 */
import { POST } from '@/app/api/llm/route'
import { NextRequest } from 'next/server'

// Mock dependencies used inside the handler
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

// We'll override the GoogleGenerativeAI mock per test to return different shapes
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}))

describe('API: /api/llm extractText variants', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test_key' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('extracts from raw.candidates[0].output string', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          candidates: [{ output: 'Output from candidates[0].output' }],
        }),
      }),
    }))

    const request = new NextRequest('http://localhost:3000/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'Hello' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.llmText).toContain('Output from candidates')
  })

  it('extracts from raw.candidates[0].content string', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          candidates: [{ content: 'Output from candidates[0].content' }],
        }),
      }),
    }))

    const request = new NextRequest('http://localhost:3000/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'Hello' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.llmText).toContain('Output from candidates[0].content')
  })
})
