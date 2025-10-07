/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload-audio/route'
import { createMockAudioBlob } from '../test-utils'

global.fetch = jest.fn()

describe('API: /api/upload-audio status check error', () => {
  const originalEnv = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, ASSEMBLYAI_API_KEY: 'key' }
    ;(global.fetch as jest.Mock).mockClear()
  })
  afterEach(() => { process.env = originalEnv })

  it('returns 500 when status check is not ok', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ upload_url: 'u' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'id1' }) })
      .mockResolvedValueOnce({ ok: false, text: async () => 'bad status' })

    const fd = new FormData();
    fd.append('audio', createMockAudioBlob(), 'a.webm')
    const req = new NextRequest('http://localhost/api/upload-audio', { method: 'POST', body: fd })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
