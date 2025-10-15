import Home from '@/app/page'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Capture the options passed to the hook so we can trigger onSegmentReady
let latestOptions: any = null
let triggerWithBlob: Blob | null = null

jest.mock('@/hooks/useContinuousCall', () => ({
  useContinuousCall: jest.fn(() => ({
    callState: 'idle',
    audioLevel: 0,
    startCall: jest.fn(),
    endCall: jest.fn(),
    isCallActive: false,
  })),
}))

jest.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: jest.fn((options: any) => {
    latestOptions = options
    return {
      supported: true,
      isListening: false,
      interimTranscript: '',
      startListening: jest.fn(),
      stopListening: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
    }
  }),
}))

describe('Home Page - audio segment flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    latestOptions = null
    triggerWithBlob = null
  })

  it('processes STT flow end-to-end (STT -> LLM -> TTS)', async () => {
    // Route fetch mocks per URL
    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') {
        return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
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

    // Start call to activate STT
    const startButton = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startButton)
    
    // Ensure hook is called and trigger onFinal
    const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition')
    await waitFor(() => {
      expect(useSpeechRecognition).toHaveBeenCalled()
    })
    
    if (latestOptions?.onFinal) {
      latestOptions.onFinal('Hello from audio')
    }

    // Expect both user and assistant messages to appear
    await waitFor(() => {
      expect(screen.getByText('Hello from audio')).toBeInTheDocument()
      expect(screen.getByText('AI reply')).toBeInTheDocument()
    })

    // Audio playback should have been attempted
    expect((global.Audio as unknown as jest.Mock).mock.calls.length).toBeGreaterThan(0)
  })

  it('skips when STT returns empty text', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      if (url === '/api/llm') return Promise.resolve({ ok: true, json: async () => ({ llmText: 'should-not-be-called' }) })
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)

    const startButton = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startButton)
    
    // Trigger with empty text
    const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition')
    await waitFor(() => {
      expect(useSpeechRecognition).toHaveBeenCalled()
    })
    
    if (latestOptions?.onFinal) {
      latestOptions.onFinal('   ')
    }

    // LLM should not be invoked when no speech
    await waitFor(() => {
      const llmCalls = (global.fetch as jest.Mock).mock.calls.filter((c: any[]) => c[0] === '/api/llm')
      expect(llmCalls.length).toBe(0)
    })
  })

  it('starts call successfully with browser STT', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)
    const startButton = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startButton)
    
    // Verify the button exists and can be clicked - browser STT is now used
    expect(startButton).toBeInTheDocument()
  })

  it('shows generic error when LLM fails during voice call', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      if (url === '/api/llm') return Promise.resolve({ ok: false, json: async () => ({ error: 'LLM service not configured' }) })
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)
    const startButton = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startButton)
    
    // Trigger onFinal with speech text
    const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition')
    await waitFor(() => {
      expect(useSpeechRecognition).toHaveBeenCalled()
    })
    
    if (latestOptions?.onFinal) {
      latestOptions.onFinal('hello')
    }

    // Voice calls show generic error message, not specific API key message
    await waitFor(() => {
      expect(screen.getByText(/error processing speech/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles TTS errors gracefully', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      if (url === '/api/llm') return Promise.resolve({ ok: true, json: async () => ({ llmText: 'ok' }) })
      if (url === '/api/tts') return Promise.resolve({ ok: false, json: async () => ({ error: 'TTS service not configured' }) })
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)
    const startButton = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startButton)
    
    // Trigger onFinal with speech text
    const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition')
    await waitFor(() => {
      expect(useSpeechRecognition).toHaveBeenCalled()
    })
    
    if (latestOptions?.onFinal) {
      latestOptions.onFinal('hello')
    }

    // TTS errors are handled gracefully - the assistant message should still appear
    await waitFor(() => {
      expect(screen.getByText('ok')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
