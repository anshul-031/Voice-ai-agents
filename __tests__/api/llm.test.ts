/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/llm/route'

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockResolvedValue('This is a test response from the LLM.'),
        },
      }),
    }),
  })),
}))

describe('API: /api/llm', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('POST Request', () => {
    it('should return error when no user text is provided', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'You are a helpful assistant',
          userText: '',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No user text provided')
    })

    it('should return error when API key is not configured', async () => {
      delete process.env.GEMINI_API_KEY

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'You are a helpful assistant',
          userText: 'Hello',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('LLM service not configured')
    })

    it('should handle successful LLM response', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'You are a helpful assistant',
          userText: 'Hello, how are you?',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.llmText).toBe('This is a test response from the LLM.')
    })

    it('should work without a system prompt', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          userText: 'Hello',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.llmText).toBeDefined()
    })

    it('should handle empty system prompt', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          prompt: '',
          userText: 'Hello',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.llmText).toBeDefined()
    })

    it('should handle whitespace-only user text', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'You are a helpful assistant',
          userText: '   ',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No user text provided')
    })

    it('should handle long user text', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const longText = 'A'.repeat(5000)
      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'You are a helpful assistant',
          userText: longText,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.llmText).toBeDefined()
    })

    it('should handle special characters in user text', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'You are a helpful assistant',
          userText: 'Hello! @#$%^&*() こんにちは 你好',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.llmText).toBeDefined()
    })

    it('should handle multiline user text', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'You are a helpful assistant',
          userText: 'Line 1\nLine 2\nLine 3',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.llmText).toBeDefined()
    })

    it('should handle malformed JSON', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle missing request body', async () => {
      process.env.GEMINI_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No user text provided')
    })
  })
})
