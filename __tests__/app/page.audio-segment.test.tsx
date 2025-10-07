import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'
import '@testing-library/jest-dom'
import { createMockAudioBlob } from '../test-utils'

// Capture the options passed to the hook so we can trigger onSegmentReady
let latestOptions: any = null
let triggerWithBlob: Blob | null = null

jest.mock('@/hooks/useVoiceRecorder', () => ({
  useVoiceRecorder: jest.fn((options: any) => {
    latestOptions = options
    return {
      isListening: false,
      isProcessing: false,
      audioLevel: 0,
      startRecording: jest.fn(async () => {
        // Simulate a captured audio segment
        if (latestOptions?.onSegmentReady && triggerWithBlob) {
          // Microtask to simulate async callback from MediaRecorder
          await Promise.resolve()
          latestOptions.onSegmentReady(triggerWithBlob)
        }
      }),
      stopRecording: jest.fn(),
    }
  }),
}))

describe('Home Page - audio segment flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    latestOptions = null
    triggerWithBlob = null
  })

  it('processes audio segment end-to-end (STT -> LLM -> TTS)', async () => {
    // Prepare a mock audio blob that will be provided to onSegmentReady
    triggerWithBlob = createMockAudioBlob()

    // Route fetch mocks per URL
    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') {
        return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      }
      if (url === '/api/upload-audio') {
        return Promise.resolve({ ok: true, json: async () => ({ text: 'Hello from audio' }) })
      }
      if (url === '/api/llm') {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'AI reply' }) })
      }
      if (url === '/api/tts') {
        // 3 bytes base64
        const base64 = Buffer.from(Uint8Array.from([1, 2, 3])).toString('base64')
        return Promise.resolve({ ok: true, json: async () => ({ audioData: base64, mimeType: 'audio/wav' }) })
      }
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)

    // Click mic to start recording, which will trigger onSegmentReady
    const micButton = await screen.findByLabelText(/start recording/i)
    await userEvent.click(micButton)

    // Expect both user and assistant messages to appear
    await waitFor(() => {
      expect(screen.getByText('Hello from audio')).toBeInTheDocument()
      expect(screen.getByText('AI reply')).toBeInTheDocument()
    })

    // Audio playback should have been attempted
    expect((global.Audio as unknown as jest.Mock).mock.calls.length).toBeGreaterThan(0)
  })

  it('skips when STT returns empty text', async () => {
    triggerWithBlob = createMockAudioBlob()

    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      if (url === '/api/upload-audio') return Promise.resolve({ ok: true, json: async () => ({ text: '   ' }) })
      if (url === '/api/llm') return Promise.resolve({ ok: true, json: async () => ({ llmText: 'should-not-be-called' }) })
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)

    const micButton = await screen.findByLabelText(/start recording/i)
    await userEvent.click(micButton)

    // LLM should not be invoked when no speech
    await waitFor(() => {
      const llmCalls = (global.fetch as jest.Mock).mock.calls.filter((c: any[]) => c[0] === '/api/llm')
      expect(llmCalls.length).toBe(0)
    })
  })

  it('shows friendly error when STT not configured', async () => {
    triggerWithBlob = createMockAudioBlob()

    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      if (url === '/api/upload-audio') return Promise.resolve({ ok: false, json: async () => ({ error: 'Speech-to-text service not configured' }) })
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)
    const micButton = await screen.findByLabelText(/start recording/i)
    await userEvent.click(micButton)

    await waitFor(() => {
      expect(screen.getByText(/configure your AssemblyAI API key/i)).toBeInTheDocument()
    })
  })

  it('shows friendly error when LLM not configured', async () => {
    triggerWithBlob = createMockAudioBlob()

    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      if (url === '/api/upload-audio') return Promise.resolve({ ok: true, json: async () => ({ text: 'hello' }) })
      if (url === '/api/llm') return Promise.resolve({ ok: false, json: async () => ({ error: 'LLM service not configured' }) })
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)
    const micButton = await screen.findByLabelText(/start recording/i)
    await userEvent.click(micButton)

    await waitFor(() => {
      expect(screen.getByText(/configure your Gemini API key/i)).toBeInTheDocument()
    })
  })

  it('shows friendly error when TTS not configured', async () => {
    triggerWithBlob = createMockAudioBlob()

    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      if (url === '/api/upload-audio') return Promise.resolve({ ok: true, json: async () => ({ text: 'hello' }) })
      if (url === '/api/llm') return Promise.resolve({ ok: true, json: async () => ({ llmText: 'ok' }) })
      if (url === '/api/tts') return Promise.resolve({ ok: false, json: async () => ({ error: 'TTS service not configured' }) })
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)
    const micButton = await screen.findByLabelText(/start recording/i)
    await userEvent.click(micButton)

    await waitFor(() => {
      expect(screen.getByText(/configure your Deepgram API key/i)).toBeInTheDocument()
    })
  })
})
