/**
 * @jest-environment node
 */
import { POST } from '@/app/api/tts/route'
import { NextRequest } from 'next/server'

global.fetch = jest.fn()

describe('API: /api/tts extra branches', () => {
  const originalEnv = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, SARVAM_API_KEY: 'key' }
    ;(global.fetch as jest.Mock).mockClear()
  })
  afterEach(() => { process.env = originalEnv })

  it('propagates Sarvam response to base64 correctly', async () => {
    const mockSarvamResponse = {
      audios: ['YWJj'] // base64 for 'abc'
    }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSarvamResponse,
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
