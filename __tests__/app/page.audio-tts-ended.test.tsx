import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

let capturedOnFinal: ((t: string) => void) | null = null

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
  useSpeechRecognition: jest.fn((opts: { onFinal?: (t: string) => void }) => {
    capturedOnFinal = opts.onFinal || null
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

// Import Home after the mock so it picks up the mocked hook
const Home = require('@/app/demo/page').default as typeof import('@/app/demo/page').default

describe('Home page - audio path TTS success and ended cleanup', () => {

  beforeEach(() => {
    capturedOnFinal = null
    ;(global.URL.revokeObjectURL as jest.Mock).mockClear()
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/upload-audio')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ text: 'Hi from audio' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'Hello from audio LLM' }) })
      }
      if (s.includes('/api/tts')) {
        const base64 = Buffer.from(Uint8Array.from([1, 2, 3, 4])).toString('base64')
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ audioData: base64, mimeType: 'audio/wav' }) })
      }
      return Promise.reject(new Error('unhandled url: ' + s))
    })
  })

  it('revokes object URL after audio ended (STT flow path)', async () => {
    render(<Home />)

    // Open chat by starting call (ensures ChatBox renders messages)
    const startBtn = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startBtn)

    // Simulate speech recognition final result
    // Ensure the hook has been called and callback captured
    const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition')
    await waitFor(() => {
      expect(useSpeechRecognition).toHaveBeenCalled()
      expect(capturedOnFinal).toBeTruthy()
    })
    capturedOnFinal && capturedOnFinal('Hi from audio')

    // Wait for assistant message to confirm flow progressed through LLM and messages are visible
    await waitFor(() => {
      expect(screen.getByText('Hello from audio LLM')).toBeInTheDocument()
    })

    // Trigger the 'ended' callback registered on the latest Audio instance
    const AudioMock = global.Audio as unknown as jest.Mock
    const instance = AudioMock.mock.results[AudioMock.mock.results.length - 1]?.value
    expect(instance).toBeDefined()
    const call = instance.addEventListener.mock.calls.find((c: any[]) => c[0] === 'ended')
    expect(call).toBeDefined()
    const endedCb = call[1]
    endedCb()

    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
  })
})
