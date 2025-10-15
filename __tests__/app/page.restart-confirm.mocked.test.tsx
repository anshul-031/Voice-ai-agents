import Home from '@/app/page'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock ConfirmDialog to auto-confirm on open to deterministically cover the confirm path
jest.mock('@/components/ConfirmDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) => {
    if (isOpen) {
      // Immediately invoke confirm to simulate user confirmation without flaky DOM timing
      onConfirm()
    }
    return null
  },
}))

// Mock useVoiceRecorder to a neutral state
jest.mock('@/hooks/useVoiceRecorder', () => ({
  useVoiceRecorder: jest.fn(() => ({
    isListening: false,
    isProcessing: false,
    audioLevel: 0,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
  })),
}))

// Mock fetch globally
beforeEach(() => {
  ;(global.fetch as jest.Mock) = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({
        services: { stt: true, llm: true, tts: true },
        allConfigured: true,
        message: 'All services configured',
      }),
    } as Response)
  ) as any
})

describe('Home Page - Restart Confirm happy path (mocked dialog)', () => {
  it('clears messages when restart confirmed via mocked dialog', async () => {
    render(<Home />)

    // Open text chat and send a message to create at least one message
    await userEvent.click(screen.getByTitle('Text chat mode'))
    const input = await screen.findByPlaceholderText('Type your message...')

    // Mock LLM and TTS to succeed
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ llmText: 'AI says hi' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ audioData: 'base64' }) })

    await userEvent.type(input, 'hello')
    await userEvent.click(screen.getByTitle('Send message'))

    await waitFor(() => {
      expect(screen.getByTitle('Clear chat messages')).toBeInTheDocument()
    })

    // Click restart; mocked dialog will call onConfirm immediately
    await userEvent.click(screen.getByTitle('Clear chat messages'))

    // Messages should be cleared, so the Restart button disappears
    await waitFor(() => {
      expect(screen.queryByText('Restart')).not.toBeInTheDocument()
    })
  })
})
