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

describe('Home Page - generic service-not-configured mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    latestOptions = null
    triggerWithBlob = null
  })

  it('handles LLM errors with generic error message', async () => {
    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') {
        return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      }
      if (url === '/api/llm') {
        // Return error that triggers error handling
        return Promise.resolve({ ok: false, json: async () => ({ error: 'LLM service not configured' }) })
      }
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)

    const startButton = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startButton)
    
    // Trigger onFinal to simulate speech input
    const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition')
    await waitFor(() => {
      expect(useSpeechRecognition).toHaveBeenCalled()
    })
    
    if (latestOptions?.onFinal) {
      latestOptions.onFinal('test message')
    }

    // Should show generic error message when LLM fails during voice call
    await waitFor(() => {
      expect(screen.getByText(/error processing speech/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
