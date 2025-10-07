/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload-audio/route'
import { createMockAudioBlob } from '../test-utils'

describe('API: /api/upload-audio poll error branch', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, ASSEMBLYAI_API_KEY: 'test_key' }
    ;(global.fetch as jest.Mock) = jest.fn()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns error when poll status becomes error', async () => {
    const mockUploadResponse = {
      ok: true,
      json: async () => ({ upload_url: 'https://example.com/audio.webm' }),
      text: async () => '{}',
    }

    const mockTranscriptResponse = {
      ok: true,
      json: async () => ({ id: 'transcript_123' }),
      text: async () => '{}',
    }

    const mockPollErrorResponse = {
      ok: true,
      json: async () => ({ status: 'error', error: 'bad audio' }),
      text: async () => '{"status":"error"}',
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockUploadResponse)
      .mockResolvedValueOnce(mockTranscriptResponse)
      .mockResolvedValueOnce(mockPollErrorResponse)

    const formData = new FormData()
    const audioBlob = createMockAudioBlob()
    formData.append('audio', audioBlob, 'test.webm')

    const request = new NextRequest('http://localhost:3000/api/upload-audio', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(request)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Transcription failed')
  })
})
