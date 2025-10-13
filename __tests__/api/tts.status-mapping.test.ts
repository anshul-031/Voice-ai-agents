/**
 * @jest-environment node
 */
import { POST } from '@/app/api/tts/route'
import { NextRequest } from 'next/server'

global.fetch = jest.fn()

describe('API: /api/tts status mappings', () => {
  const originalEnv = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, SARVAM_API_KEY: 'key' } as any
    ;(global.fetch as jest.Mock).mockClear()
  })
  afterEach(() => { process.env = originalEnv })

  it('maps 401-like error to 401', async () => {
    process.env.SARVAM_API_KEY = 'k'
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('401 Unauthorized API_KEY'))
    const req = new NextRequest('http://localhost/api/tts', { method: 'POST', body: JSON.stringify({ text: 'hi' }) })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('maps 402-like error to 402', async () => {
    process.env.SARVAM_API_KEY = 'k'
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('402 credits exceeded'))
    const req = new NextRequest('http://localhost/api/tts', { method: 'POST', body: JSON.stringify({ text: 'hi' }) })
    const res = await POST(req)
    expect(res.status).toBe(402)
  })

  it('maps 429-like error to 429', async () => {
    process.env.SARVAM_API_KEY = 'k'
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('429'))
    const req = new NextRequest('http://localhost/api/tts', { method: 'POST', body: JSON.stringify({ text: 'hi' }) })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('maps API_KEY mention (without 401) to 401', async () => {
    process.env.SARVAM_API_KEY = 'k'
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API_KEY invalid'))
    const req = new NextRequest('http://localhost/api/tts', { method: 'POST', body: JSON.stringify({ text: 'hi' }) })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('maps credits mention (without 402) to 402', async () => {
    process.env.SARVAM_API_KEY = 'k'
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('insufficient credits'))
    const req = new NextRequest('http://localhost/api/tts', { method: 'POST', body: JSON.stringify({ text: 'hi' }) })
    const res = await POST(req)
    expect(res.status).toBe(402)
  })
})
