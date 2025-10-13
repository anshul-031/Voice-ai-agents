import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'

// Mock next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: 'agent-123' }),
}))

// Mock heavy child components to keep this a lightweight smoke test
jest.mock('@/components/TopModelBoxes', () => () => <div data-testid="TopModelBoxes" />)
jest.mock('@/components/InitialPromptEditor', () => (props: any) => (
  <div data-testid="InitialPromptEditor">{String(!!props.value)}</div>
))
jest.mock('@/components/ChatBox', () => () => <div data-testid="ChatBox" />)
jest.mock('@/components/MicButton', () => (props: any) => (
  <button data-testid="MicButton" onClick={() => props.onToggle?.()}>Mic</button>
))
jest.mock('@/components/ConfirmDialog', () => () => null)
jest.mock('@/components/ChatHistory', () => () => null)
jest.mock('@/components/AudioLevelIndicator', () => () => null)

// Mock hooks used inside the page
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

// Import after mocks so the page picks them up
import AgentPage from '@/app/agents/[id]/page'

describe('AgentPage smoke', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default fetch mocks for agent and config-status
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            agent: {
              id: 'agent-123',
              title: 'Test Agent',
              prompt: 'You are helpful',
              llmModel: 'Gemini 1.5 Flash',
              sttModel: 'AssemblyAI Universal',
              ttsModel: 'Sarvam Manisha',
              userId: 'mukul',
              lastUpdated: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          }),
        })
      }
      if (s.includes('/api/config-status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
        })
      }
      // Generic fallbacks used by flows we don't exercise in this smoke
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Hello' }) })
      }
      if (s.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'ZGF0YQ==' }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  it('loads agent data and renders title', async () => {
    render(<AgentPage />)

    // Should show loading first, then the agent title once data resolves
    expect(screen.getByText(/Loading agent/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // Child components are present (mocks)
    expect(screen.getByTestId('TopModelBoxes')).toBeInTheDocument()
    expect(screen.getByTestId('InitialPromptEditor')).toBeInTheDocument()
    expect(screen.getByTestId('ChatBox')).toBeInTheDocument()
  })
})

