/**
 * @jest-environment node
 */
import { POST } from '@/app/api/llm/route'

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

    const request: any = { json: async () => ({ userText: 'Hello' }) }

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

    const request: any = { json: async () => ({ userText: 'Hello' }) }

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.llmText).toContain('Output from candidates[0].content')
  })
})
