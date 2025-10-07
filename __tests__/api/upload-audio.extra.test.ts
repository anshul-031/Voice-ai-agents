/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload-audio/route'
import { createMockAudioBlob } from '../test-utils'

global.fetch = jest.fn()

describe('API: /api/upload-audio extra branches', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, ASSEMBLYAI_API_KEY: 'key' }
    ;(global.fetch as jest.Mock).mockClear()
  })
  afterEach(() => { process.env = originalEnv })

  it('handles polling error status', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ upload_url: 'u' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'id1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'error', error: 'bad' }), text: async () => '' })

    const fd = new FormData();
    fd.append('audio', createMockAudioBlob(), 'a.webm')

    const req = new NextRequest('http://localhost/api/upload-audio', { method: 'POST', body: fd })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBe('Transcription failed')
  })

  // Increase timeout for this test since we advance many virtual timers
  it('handles polling timeout', async () => {
    jest.useFakeTimers()
    const pollOk = { ok: true, json: async () => ({ status: 'processing' }), text: async () => '' }
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ upload_url: 'u' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'id1' }) })
      // 60 times processing
      .mockResolvedValue(pollOk)

    const fd = new FormData();
    fd.append('audio', createMockAudioBlob(), 'a.webm')

    const req = new NextRequest('http://localhost/api/upload-audio', { method: 'POST', body: fd })
    const resPromise = POST(req)
    // Advance time: initial delays grow to 5000ms cap; simulate enough time for 60 attempts
    // Worst-case roughly 5s * 60 = 300s; advance beyond that; use async variant to flush timers
    await jest.advanceTimersByTimeAsync(310000)
    // Ensure any chained timers are also flushed
    await jest.runOnlyPendingTimersAsync()
    const res = await resPromise
    const data = await res.json()
    expect([408,500]).toContain(res.status)
    expect(typeof data.error).toBe('string')
    jest.useRealTimers()
  }, 15000)
})
