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
        if (latestOptions?.onSegmentReady && triggerWithBlob) {
          await Promise.resolve()
          latestOptions.onSegmentReady(triggerWithBlob)
        }
      }),
      stopRecording: jest.fn(),
    }
  }),
}))

describe('Home Page - generic service-not-configured mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    latestOptions = null
    triggerWithBlob = null
  })

  it('shows generic configure-keys message when error contains "service not configured"', async () => {
    triggerWithBlob = createMockAudioBlob()

    ;(global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/config-status') {
        return Promise.resolve({ ok: true, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) })
      }
      if (url === '/api/upload-audio') {
        // Return a generic error message that triggers the generic mapping branch
        return Promise.resolve({ ok: false, json: async () => ({ error: 'service not configured' }) })
      }
      return Promise.reject(new Error('Unexpected URL ' + url))
    })

    render(<Home />)

    const micButton = await screen.findByLabelText(/start recording/i)
    await userEvent.click(micButton)

    await waitFor(() => {
      expect(screen.getByText(/configure your API keys in \.env\.local/i)).toBeInTheDocument()
    })
  })
})
