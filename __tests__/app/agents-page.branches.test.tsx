import '@testing-library/jest-dom'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Allow accessing router.push for assertions
let mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'agent-123' }),
}))

// Make heavy children light to focus on page logic
jest.mock('@/components/TopModelBoxes', () => () => <div data-testid="TopModelBoxes" />)
jest.mock('@/components/InitialPromptEditor', () => (props: any) => (
  <div data-testid="InitialPromptEditor">{String(!!props.value)}</div>
))
jest.mock('@/components/ChatBox', () => () => <div data-testid="ChatBox" />)
jest.mock('@/components/MicButton', () => (props: any) => (
  <button data-testid="MicButton" onClick={() => props.onToggle?.()} title="Mic">Mic</button>
))
// Use real ConfirmDialog to click confirm/cancel in some tests
jest.mock('@/components/ChatHistory', () => () => null)
jest.mock('@/components/AudioLevelIndicator', () => () => null)

// Configure speech and recorder hooks with controllable behavior per test
let sttSupported = false
const sttStart = jest.fn()
const sttStop = jest.fn()
const sttPause = jest.fn()
const sttResume = jest.fn()
let sttIsListening = false
let capturedOnFinal: ((text: string) => void) | null = null

jest.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: (opts: any) => {
    capturedOnFinal = opts?.onFinal ?? null
    return {
      supported: sttSupported,
      isListening: sttIsListening,
      interimTranscript: '',
      startListening: sttStart,
      stopListening: sttStop,
      pause: sttPause,
      resume: sttResume,
    }
  },
}))

let isListening = false
const startRecording = jest.fn()
const stopRecording = jest.fn()
let capturedOnSegmentReady: ((blob: Blob) => void) | null = null

jest.mock('@/hooks/useVoiceRecorder', () => ({
  useVoiceRecorder: (opts: any) => {
    capturedOnSegmentReady = opts?.onSegmentReady ?? null
    return {
      isListening,
      isProcessing: false,
      audioLevel: 0,
      startRecording,
      stopRecording,
    }
  },
}))

import AgentPage from '@/app/agents/[id]/page'

describe('AgentPage deeper branches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush = jest.fn()
    sttSupported = false
    sttIsListening = false
    isListening = false
    capturedOnFinal = null
    capturedOnSegmentReady = null
    // Default happy-path fetch mocks
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
      if (s.includes('/api/upload-audio')) {
        return Promise.resolve({ ok: true, json: async () => ({ text: 'hi' }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  it.skip('mic toggle uses STT start/stop when supported', async () => {
    sttSupported = true

    render(<AgentPage />)
    await screen.findByText('Test Agent')

    // Open -> should call startListening
    await userEvent.click(screen.getByTestId('MicButton'))
    expect(sttStart).toHaveBeenCalled()

    // Close -> should call stopListening
    await userEvent.click(screen.getByTestId('MicButton'))
    expect(sttStop).toHaveBeenCalled()
  })

  it.skip('mic toggle uses segment recorder when STT unsupported and stops when listening', async () => {
    sttSupported = false
    isListening = true // so closing will stop recorder

    render(<AgentPage />)
    await screen.findByText('Test Agent')

    // Open -> should call startRecording
    await userEvent.click(screen.getByTestId('MicButton'))
    expect(startRecording).toHaveBeenCalled()

    // Close -> should call stopRecording when isListening true
    await userEvent.click(screen.getByTestId('MicButton'))
    expect(stopRecording).toHaveBeenCalled()
  })

  it.skip('alerts when starting recording fails', async () => {
    sttSupported = false
    startRecording.mockRejectedValueOnce(new Error('denied'))
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<AgentPage />)
    await screen.findByText('Test Agent')

    await userEvent.click(screen.getByTestId('MicButton'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled()
    })

    alertSpy.mockRestore()
  })

  it.skip('restart and end conversation confirm flows', async () => {
    // Send a text message first so action buttons appear
    render(<AgentPage />)
    await screen.findByText('Test Agent')

    await userEvent.click(screen.getByTitle('Text chat mode'))
    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Hello')
    await userEvent.click(screen.getByTitle('Send message'))

    // Wait until assistant response is processed
    await waitFor(() => expect((global.fetch as jest.Mock)).toHaveBeenCalledWith('/api/tts', expect.any(Object)))

  // Restart using the toolbar button (has a distinctive title)
  await userEvent.click(screen.getByTitle('Clear chat messages'))
  // Confirm in dialog: scope to the dialog that has the heading
  const restartDialogHeading = await screen.findByText('Restart Conversation')
  const dialog = restartDialogHeading.closest('div')!.parentElement!.parentElement!
  const confirmRestart = within(dialog).getByRole('button', { name: 'Restart' })
  await userEvent.click(confirmRestart)
    // Dialog should close (heading gone)
    await waitFor(() => {
      expect(screen.queryByText('Restart Conversation')).not.toBeInTheDocument()
    })

  // After restart, create a message via audio segment to make action buttons reappear
  expect(capturedOnSegmentReady).toBeTruthy()
  const blob2 = new Blob([new Uint8Array([4,5,6])], { type: 'audio/webm' })
  await capturedOnSegmentReady?.(blob2)
  await waitFor(() => expect((global.fetch as jest.Mock)).toHaveBeenCalledWith('/api/tts', expect.any(Object)))

  // End conversation using toolbar button
  await userEvent.click(screen.getByTitle('End conversation (stop and clear)'))
  // Confirm inside the dialog that has the heading
  const endDialogHeading = await screen.findByRole('heading', { name: 'End Conversation' })
  const endDialog = endDialogHeading.closest('div')!.parentElement!.parentElement!
  const confirmEnd = within(endDialog).getByRole('button', { name: 'End Conversation' })
  await userEvent.click(confirmEnd)
    await waitFor(() => {
      // Dialog closed (heading gone) and no navigation occurred
      expect(screen.queryByText('End Conversation')).not.toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalledWith('/')
    })
  })

  it('handles agent not found and navigates back', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: false }) })
      }
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)
    // Loading message first
    expect(screen.getByText(/Loading agent/i)).toBeInTheDocument()
    // Then not found UI
    await screen.findByText('Agent Not Found')

    // Click Back to Dashboard
    await userEvent.click(screen.getByText('Back to Dashboard'))
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it.skip('STT onFinal flow pauses and resumes around TTS failure', async () => {
    sttSupported = true
    // Make TTS fail so resume happens in else branch
    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, agent: { id: 'agent-123', title: 'Test Agent', prompt: 'System', llmModel: 'x', sttModel: 'y', ttsModel: 'z', userId: 'u', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() } }) })
      }
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'AI says hi' }) })
      }
      if (s.includes('/api/tts')) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'tts fail' }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)
    await screen.findByText('Test Agent')

    // Trigger final STT transcript
    expect(capturedOnFinal).toBeTruthy()
    await capturedOnFinal?.('Hello there')

    // It should pause then resume when TTS fails
    expect(sttPause).toHaveBeenCalled()
    await waitFor(() => expect(sttResume).toHaveBeenCalled())
  })

  it.skip('audio segment handler early-returns on no speech', async () => {
    // Upload returns empty/whitespace transcription
    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const s = String(url)
      if (s.includes('/api/voice-agents/')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, agent: { id: 'agent-123', title: 'Test Agent', prompt: 'System', llmModel: 'x', sttModel: 'y', ttsModel: 'z', userId: 'u', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() } }) })
      }
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      }
      if (s.includes('/api/upload-audio')) {
        return Promise.resolve({ ok: true, json: async () => ({ text: '   ' }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<AgentPage />)
    await screen.findByText('Test Agent')

    // Simulate onSegmentReady with a small blob
    expect(capturedOnSegmentReady).toBeTruthy()
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' })
    await capturedOnSegmentReady?.(blob)

    // Since transcription was whitespace, no LLM call should have been made
    expect((global.fetch as jest.Mock)).not.toHaveBeenCalledWith('/api/llm', expect.anything())
  })
})
