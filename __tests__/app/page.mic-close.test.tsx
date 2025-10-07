import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

// Mock fetch for config-status
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({
      services: { stt: true, llm: true, tts: true },
      allConfigured: true,
      message: 'All services configured',
    }),
  } as Response)
) as any

describe('Home mic toggle close branch', () => {
  it('closes chat and stops recording when mic toggled off', async () => {
    const stopRecording = jest.fn()
    const startRecording = jest.fn().mockResolvedValue(undefined)

    jest.doMock('@/hooks/useVoiceRecorder', () => ({
      useVoiceRecorder: jest.fn(() => ({
        isListening: true,
        isProcessing: false,
        audioLevel: 0.2,
        startRecording,
        stopRecording,
      })),
    }))

    const { default: Page } = await import('@/app/page')
    render(<Page />)

    // First click: open chat (start recording flow)
    const startBtn = await screen.findByLabelText(/start recording/i)
    await userEvent.click(startBtn)

    // Second click: close chat, should stop recording
    const stopBtn = await screen.findByLabelText(/stop recording/i)
    await userEvent.click(stopBtn)

    await waitFor(() => {
      expect(stopRecording).toHaveBeenCalled()
    })
  })
})
