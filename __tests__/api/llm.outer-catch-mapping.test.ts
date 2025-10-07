/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/llm/route'

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}))

describe('API: /api/llm outer catch error mappings', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'key' }
    jest.clearAllMocks()
  })
  afterEach(() => { process.env = originalEnv })

  it('returns 401 for message containing API key', async () => {
    // Trigger outer catch by making request.json throw
    const fakeReq: any = { json: async () => { throw new Error('Invalid API_KEY provided') } }
    const res = await POST(fakeReq)
    expect(res.status).toBe(401)
  })

  it('returns 400 for SAFETY filtered', async () => {
    const fakeReq: any = { json: async () => { throw new Error('Blocked by SAFETY policy') } }
    const res = await POST(fakeReq)
    expect(res.status).toBe(400)
  })

  it('returns 429 for quota exceeded', async () => {
    const fakeReq: any = { json: async () => { throw new Error('quota exceeded') } }
    const res = await POST(fakeReq)
    expect(res.status).toBe(429)
  })

  it('returns 401 for message containing 404/Not Found', async () => {
    const fakeReq: any = { json: async () => { throw new Error('404 Not Found') } }
    const res = await POST(fakeReq)
    expect(res.status).toBe(401)
  })
})
