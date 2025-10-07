/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload-audio/route'

describe('API: /api/upload-audio unexpected error catch', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, ASSEMBLYAI_API_KEY: 'aai-key' }
  })
  afterEach(() => { process.env = originalEnv })

  it('returns 500 when formData throws', async () => {
    // Create a request whose formData throws
    const req = new NextRequest('http://localhost/api/upload-audio', { method: 'POST', body: new Blob() as any }) as any
    req.formData = jest.fn(() => { throw new Error('boom') })

    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})
