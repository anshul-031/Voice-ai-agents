import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: 'agent-123' }),
}))

// Mock heavy child components
jest.mock('@/components/TopModelBoxes', () => () => <div />)
jest.mock('@/components/InitialPromptEditor', () => (props: any) => (
  <div>{String(!!props.value)}</div>
))
jest.mock('@/components/ChatBox', () => () => <div />)
jest.mock('@/components/MicButton', () => (props: any) => (
  <button onClick={() => props.onToggle?.()} title="Mic">Mic</button>
))
jest.mock('@/components/ConfirmDialog', () => () => null)
jest.mock('@/components/ChatHistory', () => () => null)
jest.mock('@/components/AudioLevelIndicator', () => () => null)

jest.mock('@/hooks/useVoiceRecorder', () => ({
  useVoiceRecorder: () => ({
    isListening: false,
    isProcessing: false,
    audioLevel: 0,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
  }),
}))

jest.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    supported: false,
    isListening: false,
    interimTranscript: '',
    startListening: jest.fn(),
    stopListening: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  }),
}))

import AgentPage from '@/app/agents/[id]/page'

describe('AgentPage text chat flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL, init?: RequestInit) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, agent: { id: 'agent-123', title: 'Test Agent', prompt: 'System', llmModel: 'x', sttModel: 'y', ttsModel: 'z', userId: 'u', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() } }),
        })
      }
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'AI says hi' }) })
      }
      if (s.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'ZGF0YQ==' }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  it('sends a text message and calls LLM and TTS', async () => {
    render(<AgentPage />)

    await screen.findByText('Test Agent')

    // Toggle text input
    const toggle = screen.getByTitle('Text chat mode')
    await userEvent.click(toggle)

    // Type and send
  const input = await screen.findByPlaceholderText('Type your message...')
  await userEvent.type(input, 'Hello')
    const send = screen.getByTitle('Send message')
    await userEvent.click(send)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/llm', expect.any(Object))
      expect(global.fetch).toHaveBeenCalledWith('/api/tts', expect.any(Object))
    })
  })
})
