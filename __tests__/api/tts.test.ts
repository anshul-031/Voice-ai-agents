/**
 * @jest-environment node
 */
import { POST } from '@/app/api/tts/route'
import { NextRequest } from 'next/server'

// Mock fetch globally for this test file
global.fetch = jest.fn()

describe('API: /api/tts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('POST Request', () => {
    it('should return error when no text is provided', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No text provided')
    })

    it('should return error when API key is not configured', async () => {
      delete process.env.SARVAM_API_KEY

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello world' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('TTS service not configured')
    })

    it('should handle successful TTS generation', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const mockSarvamResponse = {
        audios: ['SGVsbG8gd29ybGQ='] // Base64 encoded audio
      }
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockSarvamResponse,
        headers: new Headers(),
        text: async () => JSON.stringify(mockSarvamResponse),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello world' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.audioData).toBeDefined()
      expect(data.mimeType).toBe('audio/wav')
    })

    it('should handle Sarvam API failure', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'TTS generation failed',
        headers: new Headers(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello world' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('TTS generation failed')
    })

    it('should handle whitespace-only text', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '   ' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No text provided')
    })

    it('should handle long text', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      ;(global.fetch as jest.Mock).mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ audios: ['SGVsbG8gd29ybGQ='] }),
        headers: new Headers(),
      }))

      const longText = 'A'.repeat(5000)
      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: longText }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.audioData).toBeDefined()
    })

    it('should handle special characters in text', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const mockSarvamResponse = {
        audios: ['SGVsbG8gd29ybGQ=']
      }
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockSarvamResponse,
        headers: new Headers(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello! @#$%^&*() नमस्ते' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.audioData).toBeDefined()
    })

    it('should handle multiline text', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const mockSarvamResponse = {
        audios: ['SGVsbG8gd29ybGQ=']
      }
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockSarvamResponse,
        headers: new Headers(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Line 1\nLine 2\nLine 3' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.audioData).toBeDefined()
    })

    it('should call Sarvam API with correct parameters', async () => {
      process.env.SARVAM_API_KEY = 'test_sarvam_key'

      const mockSarvamResponse = {
        audios: ['SGVsbG8gd29ybGQ=']
      }
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockSarvamResponse,
        headers: new Headers(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text' }),
      })

      await POST(request)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.sarvam.ai/text-to-speech',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-subscription-key': 'test_sarvam_key',
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should handle network errors', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello world' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('TTS service error')
    })

    it('should handle 401 unauthorized errors', async () => {
      process.env.SARVAM_API_KEY = 'invalid_key'

      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
        headers: new Headers(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello world' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('TTS generation failed')
    })

    it('should handle 429 rate limit errors', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const mockResponse = {
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
        headers: new Headers(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello world' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('TTS generation failed')
    })
  })

  describe('Error Scenarios', () => {
    it('should handle malformed JSON', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle missing request body', async () => {
      process.env.SARVAM_API_KEY = 'test_key'

      const request = new NextRequest('http://localhost:3000/api/tts', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })
})
