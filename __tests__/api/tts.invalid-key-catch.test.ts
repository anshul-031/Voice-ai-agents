/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/tts/route'

describe('API: /api/tts catch error branch', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, SARVAM_API_KEY: 'any' }
    ;(global.fetch as jest.Mock) = jest.fn()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('handles fetch rejection with 401-like error to hit invalid key branch', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('401 Unauthorized: Invalid API key'))

    const request = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello' }),
    })

    const res = await POST(request)
    const data = await res.json()

    // Route maps 401-like errors to 401 Invalid API key
    expect(res.status).toBe(401)
    expect(data.error).toBe('Invalid API key')
  })
})
