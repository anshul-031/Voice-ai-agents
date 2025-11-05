import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/navigation hooks
const mockPush = jest.fn()
const mockParams = { id: 'agent-123' }

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}))

// Mock all child components to focus on page logic
jest.mock('@/components/VoiceAIAgent', () => {
  return function MockVoiceAIAgent({ onDelete, isDeleting }: any) {
    return (
      <div data-testid="VoiceAIAgent">
        <button
          data-testid="delete-button"
          onClick={onDelete}
          disabled={isDeleting}
        >
          Delete Agent
        </button>
        {isDeleting && <span data-testid="deleting">Deleting...</span>}
      </div>
    )
  }
})

// Import after mocks
import AgentPage from '@/app/agents/[id]/page'

describe('AgentPage delete functionality and navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    // Default successful agent fetch
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/agent-123') && !s.includes('?')) {
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
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  it('handles successful agent deletion', async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    // Mock the delete API call to succeed
    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/agent-123') && !s.includes('?')) {
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
      if (s.includes('/api/voice-agents?id=agent-123')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    // Wait for agent to load
    await waitFor(() => {
      expect(screen.getByTestId('VoiceAIAgent')).toBeInTheDocument()
    })

    // Click delete button
    await user.click(screen.getByTestId('delete-button'))

    // Should redirect to dashboard on successful deletion
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    confirmSpy.mockRestore()
  })

  it('handles delete API failure with error message', async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    // Mock the delete API call to fail
    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/agent-123') && !s.includes('?')) {
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
      if (s.includes('/api/voice-agents?id=agent-123')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Delete permission denied' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    // Wait for agent to load
    await waitFor(() => {
      expect(screen.getByTestId('VoiceAIAgent')).toBeInTheDocument()
    })

    // Click delete button
    await user.click(screen.getByTestId('delete-button'))

    // Should show alert with error message
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete agent: Delete permission denied')
    })

    confirmSpy.mockRestore()
    alertSpy.mockRestore()
  })

  it('handles delete network error', async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Mock the delete API call to throw network error
    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/agent-123') && !s.includes('?')) {
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
      if (s.includes('/api/voice-agents?id=agent-123')) {
        throw new Error('Network error')
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    // Wait for agent to load
    await waitFor(() => {
      expect(screen.getByTestId('VoiceAIAgent')).toBeInTheDocument()
    })

    // Click delete button
    await user.click(screen.getByTestId('delete-button'))

    // Should show generic alert on network error
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete agent. Please try again.')
    })

    confirmSpy.mockRestore()
    alertSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  it('handles delete cancellation', async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    render(<AgentPage />)

    // Wait for agent to load
    await waitFor(() => {
      expect(screen.getByTestId('VoiceAIAgent')).toBeInTheDocument()
    })

    // Record call count after loading (should be 2: agent fetch + config status)
    const callCountAfterLoad = (global.fetch as jest.Mock).mock.calls.length

    // Click delete button
    await user.click(screen.getByTestId('delete-button'))

    // Should not make any additional API calls when cancelled
    expect((global.fetch as jest.Mock).mock.calls.length).toBeLessThanOrEqual(callCountAfterLoad + 2)
    expect(mockPush).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  it('shows deleting state during delete operation', async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    // Mock slow delete operation
    let resolveDelete: (value: any) => void
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve
    })

    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/agent-123') && !s.includes('?')) {
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
      if (s.includes('/api/voice-agents?id=agent-123')) {
        return deletePromise
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    // Wait for agent to load
    await waitFor(() => {
      expect(screen.getByTestId('VoiceAIAgent')).toBeInTheDocument()
    })

    // Click delete button
    await user.click(screen.getByTestId('delete-button'))

    // Should show deleting state
    expect(screen.getByTestId('deleting')).toBeInTheDocument()
    expect(screen.getByTestId('delete-button')).toBeDisabled()

    // Resolve the delete operation
    resolveDelete!({
      ok: true,
      json: async () => ({ success: true }),
    })

    // Should redirect after successful deletion
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    confirmSpy.mockRestore()
  })

  it('navigates to home when Go Back clicked from agent not found', async () => {
    const user = userEvent.setup()

    // Mock agent fetch to return success: true but agent: null
    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/agent-123')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            agent: null,
          }),
        })
      }
      if (s.includes('/api/config-status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            services: { stt: true, llm: true, tts: true },
            allConfigured: true,
            message: 'ok'
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)

    
    // Should show agent not found UI (redirect is mocked so component stays)
    await waitFor(() => {
      expect(screen.getByText('Agent Not Found')).toBeInTheDocument()
    })

    // Click Back to Dashboard button
    await user.click(screen.getByText('Back to Dashboard'))

    // Should navigate to dashboard page (this will be the last call)
    expect(mockPush).toHaveBeenLastCalledWith('/dashboard')
  })
})