/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// Mock mongodb connect and Chat model before importing the route
jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }))
const mockCreate = jest.fn()
jest.mock('@/models/Chat', () => ({ __esModule: true, default: { create: (...args: any[]) => mockCreate(...args) } }))

// Mock GoogleGenerativeAI with a factory that exposes a mutable mock function
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}))

// Import route after mocks
import { POST } from '@/app/api/llm/route'

describe('LLM API route', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // default: model exposes generateContent
    // default model that exposes generateContent
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementation(() => ({ getGenerativeModel: jest.fn().mockReturnValue({ generateContent: jest.fn(async () => 'response text') }) }))
    process.env.GEMINI_API_KEY = 'test-key'
  })

  test('returns 400 when userText is missing', async () => {
    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: '   ' }) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(data).toEqual({ error: 'No user text provided' })
    expect(res.status).toBe(400)
  })

  test('returns 500 when GEMINI_API_KEY missing', async () => {
    delete process.env.GEMINI_API_KEY
    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'Hello' }) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(data).toEqual({ error: 'LLM service not configured' })
    expect(res.status).toBe(500)
  })

  test('happy path: generateContent path returns response and saves assistant', async () => {
    // model returns string directly
  // set model to return generateContent
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  GoogleGenerativeAI.mockImplementationOnce(() => ({ getGenerativeModel: jest.fn().mockReturnValue({ generateContent: jest.fn(async () => 'Hello from LLM') }) }))
  const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'Hi', conversationHistory: [{ text: 'a', source: 'user' }, { text: 'b', source: 'assistant' }, { text: 'c', source: 'user' }], prompt: 'sys' }) })
  const res: any = await POST(req)
  const json = await res.json()
    expect(json.llmText).toContain('Hello from LLM')
    expect(json.sessionId).toBeDefined()
    // assistant and assistant saved twice (one for assistant save and one for call logs)
    expect(mockCreate).toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  test('model fallback to generate when generateContent not available', async () => {
    // model with generate method only
  // model with generate method only
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GoogleGenerativeAI: GoogleGen2 } = require('@google/generative-ai')
  GoogleGen2.mockImplementationOnce(() => ({ getGenerativeModel: jest.fn().mockReturnValue({ generate: jest.fn(async ({ prompt }: any) => ({ output: [{ content: 'gen-output' }] })) }) }))
    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'Hi', prompt: '' }) })
    const res: any = await POST(req)
    const json = await res.json()
    expect(json.llmText).toBeDefined()
    expect(res.status).toBe(200)
  })

  test('handles LLM generate error mapping 404', async () => {
  // make generateContent throw an error object with status 404
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GoogleGenerativeAI: GoogleGen3 } = require('@google/generative-ai')
  GoogleGen3.mockImplementationOnce(() => ({ getGenerativeModel: jest.fn().mockReturnValue({ generateContent: jest.fn(async () => { throw { status: 404, response: { data: 'not found' } } }) }) }))
    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'Hi' }) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(data.error).toContain('LLM model or endpoint not found')
    expect(res.status).toBe(404)
  })

  test('extracts PDF command when present', async () => {
  // generateContent returns a string containing a PDF command
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GoogleGenerativeAI: GoogleGen4 } = require('@google/generative-ai')
  GoogleGen4.mockImplementationOnce(() => ({ getGenerativeModel: jest.fn().mockReturnValue({ generateContent: jest.fn(async () => 'Result text <<<PDF>>>{"title":"My PDF"}<<<\/PDF>>> remainder') }) }))
    const req = new NextRequest('http://localhost/api/llm', { method: 'POST', body: JSON.stringify({ userText: 'Hello' }) })
    const res: any = await POST(req)
    const json = await res.json()
    expect(json.pdfCommand).toBeDefined()
    expect(json.pdfCommand.title).toBe('My PDF')
    expect(res.status).toBe(200)
  })
})
