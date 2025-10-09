/**
 * @jest-environment node
 */
import { POST } from '@/app/api/upload-audio/route'
import { createMockAudioBlob } from '../test-utils'

describe('API: /api/upload-audio timeout branch', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, ASSEMBLYAI_API_KEY: 'test_key' }
    ;(global.fetch as jest.Mock) = jest.fn()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    process.env = originalEnv
  })

  it('returns 408 after max attempts with queued status', async () => {
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

    const mockPollQueued = {
      ok: true,
      json: async () => ({ status: 'queued' }),
      text: async () => '{"status":"queued"}',
    }

    // First two calls: upload, transcript; then 60 polls returning queued
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockUploadResponse)
      .mockResolvedValueOnce(mockTranscriptResponse)
    for (let i = 0; i < 60; i++) {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockPollQueued)
    }

    const formData = new FormData()
    const audioBlob = createMockAudioBlob()
    formData.append('audio', audioBlob, 'test.webm')

    const request: any = { formData: async () => formData }

    // Run POST in parallel, then flush timers loop-by-loop until it resolves
    const promise = POST(request)
    // The route awaits between polls using setTimeout; advance until attempts reach 60
    for (let i = 0; i < 60; i++) {
      await Promise.resolve()
      await jest.advanceTimersByTimeAsync(1000 * Math.pow(1.5, Math.min(i, 10)))
    }

    const res = await promise
    const data = await res.json()

    expect(res.status).toBe(408)
    expect(data.error).toBe('Transcription timeout')
  })
})
