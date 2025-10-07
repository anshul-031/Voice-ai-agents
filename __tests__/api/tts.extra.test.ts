/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/tts/route'

global.fetch = jest.fn()

describe('API: /api/tts extra branches', () => {
  const originalEnv = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, DEEPGRAM_API_KEY: 'key' }
    ;(global.fetch as jest.Mock).mockClear()
  })
  afterEach(() => { process.env = originalEnv })

  it('propagates arrayBuffer to base64 correctly', async () => {
    const buf = new TextEncoder().encode('abc').buffer
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => buf,
      headers: new Headers(),
    })

    const req = new NextRequest('http://localhost/api/tts', { method: 'POST', body: JSON.stringify({ text: 'x' }) })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(typeof data.audioData).toBe('string')
    expect(data.mimeType).toBe('audio/wav')
  })
})
