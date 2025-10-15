import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Capture the onFinal handler passed to the hook
let capturedOnFinal: ((t: string) => void) | null = null
let capturedPause: jest.Mock | null = null
let capturedResume: jest.Mock | null = null

jest.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: jest.fn((opts: any) => {
    // Use a global stable store so re-renders don't replace the pause/resume function instances
    if (!(globalThis as any).__test_sr) {
      (globalThis as any).__test_sr = {
        pause: jest.fn(),
        resume: jest.fn(),
      }
    }
    const store = (globalThis as any).__test_sr
    capturedOnFinal = opts?.onFinal || null
    capturedPause = store.pause
    capturedResume = store.resume
    return {
      supported: true,
      isListening: false,
      interimTranscript: '',
      startListening: jest.fn(),
      stopListening: jest.fn(),
      pause: capturedPause,
      resume: capturedResume,
    }
  }),
}))

// continuous call hook
jest.mock('@/hooks/useContinuousCall', () => ({
  useContinuousCall: jest.fn(() => ({
    callState: 'idle',
    audioLevel: 0,
    startCall: jest.fn(),
    endCall: jest.fn(),
    isCallActive: false,
  })),
}))

const Home = require('@/app/page').default as typeof import('@/app/page').default

describe('Home page - real-time STT onFinal flow', () => {
  beforeEach(() => {
    capturedOnFinal = null
    capturedPause = null
    capturedResume = null
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'Bot answer' }) })
      }
      if (s.includes('/api/tts')) {
        const base64 = Buffer.from(Uint8Array.from([1,2,3])).toString('base64')
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ audioData: base64, mimeType: 'audio/wav' }) })
      }
      return Promise.reject(new Error('unhandled: ' + s))
    })
  })

  it('adds user and assistant messages and plays audio on onFinal', async () => {
    render(<Home />)

    // open chat to ensure ChatBox renders
    const startBtn = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startBtn)

    // ensure hook captured onFinal
    const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition')
    await waitFor(() => {
      expect(useSpeechRecognition).toHaveBeenCalled()
      expect(typeof capturedOnFinal).toBe('function')
    })

    // fire onFinal to drive the flow
    capturedOnFinal && capturedOnFinal('hello there')

    await waitFor(() => {
      expect(screen.getByText('Bot answer')).toBeInTheDocument()
    })

    // ensure an Audio instance was created and play called
    const AudioMock = global.Audio as unknown as jest.Mock
    const lastInstance = AudioMock.mock.results[AudioMock.mock.results.length - 1]?.value
    expect(lastInstance).toBeDefined()
    expect(lastInstance.play).toHaveBeenCalled()
  })

  it('handles LLM non-ok by showing error message', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'LLM bad' }) })
      }
      return Promise.reject(new Error('unhandled: ' + s))
    })

    render(<Home />)
    const startBtn = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startBtn)

    await waitFor(() => { expect(typeof capturedOnFinal).toBe('function') })
    capturedOnFinal && capturedOnFinal('question')

    await waitFor(() => {
      expect(screen.getByText(/Error processing speech/i)).toBeInTheDocument()
    })
  })

  it('resumes STT when TTS returns ok but without audioData', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'No audio case' }) })
      }
      if (s.includes('/api/tts')) {
        // ok but no audioData
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
      }
      return Promise.reject(new Error('unhandled: ' + s))
    })

    render(<Home />)
    const startBtn = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startBtn)

    await waitFor(() => expect(typeof capturedOnFinal).toBe('function'))
    capturedOnFinal && capturedOnFinal('test input')

    await waitFor(() => {
      expect(screen.getByText('No audio case')).toBeInTheDocument()
    })
    expect(capturedResume).toBeTruthy()
    expect(capturedResume).toHaveBeenCalled()
  })

  it('resumes STT when TTS response is not ok', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'Bad TTS case' }) })
      }
      if (s.includes('/api/tts')) {
        // not ok
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'tts fail' }) })
      }
      return Promise.reject(new Error('unhandled: ' + s))
    })

    render(<Home />)
    const startBtn = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startBtn)

    await waitFor(() => expect(typeof capturedOnFinal).toBe('function'))
    capturedOnFinal && capturedOnFinal('test input 2')

    await waitFor(() => {
      expect(screen.getByText('Bad TTS case')).toBeInTheDocument()
    })
    expect(capturedResume).toBeTruthy()
    expect(capturedResume).toHaveBeenCalled()
  })

  it('resumes and revokes URL when audio playback ends (STT path)', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'Audio path' }) })
      }
      if (s.includes('/api/tts')) {
        const base64 = Buffer.from(Uint8Array.from([1,2,3])).toString('base64')
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ audioData: base64, mimeType: 'audio/wav' }) })
      }
      return Promise.reject(new Error('unhandled: ' + s))
    })

    ;(global.URL.revokeObjectURL as jest.Mock).mockClear()
    render(<Home />)
    const startBtn = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startBtn)

    await waitFor(() => expect(typeof capturedOnFinal).toBe('function'))
    capturedOnFinal && capturedOnFinal('hi')

    await waitFor(() => {
      expect(screen.getByText('Audio path')).toBeInTheDocument()
    })

    const AudioMock = global.Audio as unknown as jest.Mock
    const instance = AudioMock.mock.results[AudioMock.mock.results.length - 1]?.value
    const call = instance.addEventListener.mock.calls.find((c: any[]) => c[0] === 'ended')
    const endedCb = call?.[1]
    expect(endedCb).toBeDefined()
    endedCb && endedCb()

    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    expect(capturedResume).toHaveBeenCalled()
  })
})
