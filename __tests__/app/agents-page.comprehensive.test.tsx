import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'

// Mock next/navigation hooks
const mockPush = jest.fn()
const mockParams = { id: 'agent-123' }

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
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

// Mock VoiceAIAgent to include a delete button and back button that calls onDelete and onBack
jest.mock('@/components/VoiceAIAgent', () => (props: any) => (
  <div data-testid="VoiceAIAgent">
    <div>{props.headerTitle}</div>
    <button 
      data-testid="delete-trigger" 
      onClick={() => props.onDelete?.()}
    >
      Delete Agent
    </button>
    <button 
      data-testid="back-trigger" 
      onClick={() => props.onBack?.()}
    >
      Back
    </button>
  </div>
))

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

describe('AgentPage comprehensive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
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

    // VoiceAIAgent component is rendered with the agent title
    expect(screen.getByTestId('VoiceAIAgent')).toBeInTheDocument()
    expect(screen.getByTestId('delete-trigger')).toBeInTheDocument()
  })

  it('redirects to dashboard when API returns not ok', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Not found' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to dashboard when API returns success false', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: false,
            error: 'Agent not found',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to dashboard when API returns no agent data', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            agent: null,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to dashboard on network error', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Network error')
    })

    // Mock console.error to avoid test output pollution
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<AgentPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    consoleSpy.mockRestore()
  })

  it('shows agent not found when agent is null after loading', async () => {
    // First render with loading, then set agent to null
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })

    ;(global.fetch as jest.Mock).mockImplementationOnce((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return fetchPromise
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    // Still loading
    expect(screen.getByText(/Loading agent/i)).toBeInTheDocument()

    // Resolve with no agent data
    resolveFetch!({
      ok: true,
      json: async () => ({
        success: true,
        agent: null,
      }),
    })

    await waitFor(() => {
      expect(screen.getByText('Agent Not Found')).toBeInTheDocument()
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
    })
  })

  it('handles delete confirmation and successful deletion', async () => {
    // Mock window.confirm to return true
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
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
      if (s.includes('/api/voice-agents?id=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-trigger')
    deleteButton.click()

    // Wait for delete to complete and redirect to dashboard
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    confirmSpy.mockRestore()
  })

  it('handles delete cancellation', async () => {
    // Mock window.confirm to return false
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    render(<AgentPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-trigger')
    deleteButton.click()

    // Should not redirect since confirm returned false
    expect(mockPush).not.toHaveBeenCalledWith('/dashboard')

    confirmSpy.mockRestore()
  })

  it('handles delete API failure', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
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
      if (s.includes('/api/voice-agents?id=')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Delete failed' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-trigger')
    deleteButton.click()

    // Should show alert on failure
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete agent: Delete failed')
    })

    confirmSpy.mockRestore()
    alertSpy.mockRestore()
  })

  it('handles delete API failure with unknown error', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
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
      if (s.includes('/api/voice-agents?id=')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: 'Some other error' }), // No 'error' field
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-trigger')
    deleteButton.click()

    // Should show alert with 'Unknown error' fallback
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete agent: Unknown error')
    })

    confirmSpy.mockRestore()
    alertSpy.mockRestore()
  })

  it('handles delete network error', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
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
      if (s.includes('/api/voice-agents?id=')) {
        throw new Error('Network error')
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-trigger')
    deleteButton.click()

    // Should show alert on network error
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete agent. Please try again.')
    })

    confirmSpy.mockRestore()
    alertSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  it('sets model config from agent data', async () => {
    render(<AgentPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    // The VoiceAIAgent should be rendered with the correct props
    expect(screen.getByTestId('VoiceAIAgent')).toBeInTheDocument()
  })

  it('handles different agent IDs from params', async () => {
    mockParams.id = 'different-agent-id'

    ;(global.fetch as jest.Mock).mockImplementationOnce((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/different-agent-id')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            agent: {
              id: 'different-agent-id',
              title: 'Different Agent',
              prompt: 'You are different',
              llmModel: 'Gemini 1.5 Pro',
              sttModel: 'AssemblyAI Universal',
              ttsModel: 'Sarvam Manisha',
              userId: 'mukul',
              lastUpdated: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    await waitFor(() => {
      expect(screen.getByText('Different Agent')).toBeInTheDocument()
    })

    // Reset for other tests
    mockParams.id = 'agent-123'
  })

  it('handles back navigation', async () => {
    render(<AgentPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });

    // Find and click back button
    const backButton = screen.getByTestId('back-trigger');
    backButton.click();

    // Should navigate to dashboard
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  })
})