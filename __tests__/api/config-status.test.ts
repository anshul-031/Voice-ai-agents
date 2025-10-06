/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/config-status/route'

describe('API: /api/config-status', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('GET Request', () => {
    it('should return all services configured when all API keys are set', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test_assemblyai_key'
      process.env.GEMINI_API_KEY = 'test_gemini_key'
      process.env.DEEPGRAM_API_KEY = 'test_deepgram_key'

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.services.stt).toBe(true)
      expect(data.services.llm).toBe(true)
      expect(data.services.tts).toBe(true)
      expect(data.allConfigured).toBe(true)
      expect(data.message).toBe('All services configured successfully!')
    })

    it('should return false for missing AssemblyAI key', async () => {
      process.env.GEMINI_API_KEY = 'test_gemini_key'
      process.env.DEEPGRAM_API_KEY = 'test_deepgram_key'
      delete process.env.ASSEMBLYAI_API_KEY

      const response = await GET()
      const data = await response.json()

      expect(data.services.stt).toBe(false)
      expect(data.services.llm).toBe(true)
      expect(data.services.tts).toBe(true)
      expect(data.allConfigured).toBe(false)
    })

    it('should return false for missing Gemini key', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test_assemblyai_key'
      process.env.DEEPGRAM_API_KEY = 'test_deepgram_key'
      delete process.env.GEMINI_API_KEY

      const response = await GET()
      const data = await response.json()

      expect(data.services.stt).toBe(true)
      expect(data.services.llm).toBe(false)
      expect(data.services.tts).toBe(true)
      expect(data.allConfigured).toBe(false)
    })

    it('should return false for missing Deepgram key', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test_assemblyai_key'
      process.env.GEMINI_API_KEY = 'test_gemini_key'
      delete process.env.DEEPGRAM_API_KEY

      const response = await GET()
      const data = await response.json()

      expect(data.services.stt).toBe(true)
      expect(data.services.llm).toBe(true)
      expect(data.services.tts).toBe(false)
      expect(data.allConfigured).toBe(false)
    })

    it('should reject placeholder API keys', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'your_assemblyai_api_key_here'
      process.env.GEMINI_API_KEY = 'your_gemini_api_key_here'
      process.env.DEEPGRAM_API_KEY = 'your_deepgram_api_key_here'

      const response = await GET()
      const data = await response.json()

      expect(data.services.stt).toBe(false)
      expect(data.services.llm).toBe(false)
      expect(data.services.tts).toBe(false)
      expect(data.allConfigured).toBe(false)
      expect(data.message).toContain('missing or using placeholder values')
    })

    it('should return false when all keys are missing', async () => {
      delete process.env.ASSEMBLYAI_API_KEY
      delete process.env.GEMINI_API_KEY
      delete process.env.DEEPGRAM_API_KEY

      const response = await GET()
      const data = await response.json()

      expect(data.services.stt).toBe(false)
      expect(data.services.llm).toBe(false)
      expect(data.services.tts).toBe(false)
      expect(data.allConfigured).toBe(false)
    })

    it('should handle empty string API keys as not configured', async () => {
      process.env.ASSEMBLYAI_API_KEY = ''
      process.env.GEMINI_API_KEY = ''
      process.env.DEEPGRAM_API_KEY = ''

      const response = await GET()
      const data = await response.json()

      expect(data.services.stt).toBe(false)
      expect(data.services.llm).toBe(false)
      expect(data.services.tts).toBe(false)
      expect(data.allConfigured).toBe(false)
    })

    it('should return correct message when partially configured', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test_key'
      delete process.env.GEMINI_API_KEY
      delete process.env.DEEPGRAM_API_KEY

      const response = await GET()
      const data = await response.json()

      expect(data.allConfigured).toBe(false)
      expect(data.message).toContain('missing or using placeholder values')
    })
  })
})
