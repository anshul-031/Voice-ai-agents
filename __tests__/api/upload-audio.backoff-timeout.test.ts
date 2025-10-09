/**
 * @jest-environment node
 */
import { POST } from '@/app/api/upload-audio/route'

describe('API: /api/upload-audio polling backoff and timeout', () => {
  const originalEnv = process.env
  const originalFetch = global.fetch
  beforeEach(() => {
    process.env = { ...originalEnv, ASSEMBLYAI_API_KEY: 'aai-key' }
    jest.useFakeTimers()
    ;(global.fetch as any) = jest.fn()
  })
  afterEach(() => {
    jest.useRealTimers()
    process.env = originalEnv
    global.fetch = originalFetch as any
  })

  it('backs off between polling attempts and times out', async () => {
    const audio = new File([new Uint8Array([1, 2, 3])], 'a.webm', { type: 'audio/webm' })
    const form = new FormData()
    form.append('audio', audio)

    // Sequence:
    // 1) upload OK -> returns upload_url
    // 2) transcript create OK -> returns id
    // 3+) status checks -> return { status: 'processing' } until maxAttempts
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/upload')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ upload_url: 'u' }), text: async () => '' })
      }
      if (url.endsWith('/transcript')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 'tx' }), text: async () => '' })
      }
      if (url.includes('/transcript/')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ status: 'processing' }), text: async () => '' })
      }
      return Promise.reject(new Error('unexpected url'))
    })

  const req: any = { formData: async () => form as FormData }
    const p = POST(req)
    // Advance timers sufficiently to exceed attempts, accounting for 60 attempts with backoff from 1000ms capped to 5000ms.
    // We will fast-forward a generous amount.
    await jest.advanceTimersByTimeAsync(60 * 5000)
    const res = await p
    expect(res.status).toBe(408)
  }, 15000)
})
