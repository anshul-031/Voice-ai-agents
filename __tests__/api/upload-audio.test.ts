/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload-audio/route'
import { createMockAudioBlob } from '../test-utils'

// Mock fetch globally for this test file
global.fetch = jest.fn()

describe('API: /api/upload-audio', () => {
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
    it('should return error when no audio file is provided', async () => {
      const formData = new FormData()
      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No audio file provided')
    })

    it('should return error when API key is not configured', async () => {
      delete process.env.ASSEMBLYAI_API_KEY

      const formData = new FormData()
      const audioBlob = createMockAudioBlob()
      formData.append('audio', audioBlob, 'test.webm')

      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Speech-to-text service not configured')
    })

    it('should return error when empty audio file is provided', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test_key'

      const formData = new FormData()
      const emptyBlob = new Blob([], { type: 'audio/webm' })
      formData.append('audio', emptyBlob, 'test.webm')

      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Empty audio file received')
    })

    it('should handle successful transcription', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test_key'

      const mockUploadResponse = {
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/audio.webm' }),
        text: async () => '{"upload_url": "https://example.com/audio.webm"}',
      }

      const mockTranscriptResponse = {
        ok: true,
        json: async () => ({ id: 'transcript_123', status: 'queued' }),
        text: async () => '{"id": "transcript_123"}',
      }

      const mockPollResponse = {
        ok: true,
        json: async () => ({
          id: 'transcript_123',
          status: 'completed',
          text: 'Hello world',
        }),
        text: async () => '{"status": "completed", "text": "Hello world"}',
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockUploadResponse)
        .mockResolvedValueOnce(mockTranscriptResponse)
        .mockResolvedValueOnce(mockPollResponse)

      const formData = new FormData()
      const audioBlob = createMockAudioBlob()
      formData.append('audio', audioBlob, 'test.webm')

      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.text).toBe('Hello world')
    })

    it('should handle upload failure', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test_key'

      const mockUploadResponse = {
        ok: false,
        status: 500,
        text: async () => 'Upload failed',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockUploadResponse)

      const formData = new FormData()
      const audioBlob = createMockAudioBlob()
      formData.append('audio', audioBlob, 'test.webm')

      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload audio')
    })

    it('should handle transcription job creation failure', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test_key'

      const mockUploadResponse = {
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/audio.webm' }),
      }

      const mockTranscriptResponse = {
        ok: false,
        status: 500,
        text: async () => 'Transcription failed',
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockUploadResponse)
        .mockResolvedValueOnce(mockTranscriptResponse)

      const formData = new FormData()
      const audioBlob = createMockAudioBlob()
      formData.append('audio', audioBlob, 'test.webm')

      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create transcription job')
    })
  })
})
