import Home from '@/app/page'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const endCall = jest.fn()
const startCall = jest.fn().mockResolvedValue(undefined)

jest.mock('@/hooks/useContinuousCall', () => ({
  useContinuousCall: jest.fn(() => ({
    callState: 'idle',
    audioLevel: 0,
    startCall,
    endCall,
    isCallActive: false,
  })),
}))

jest.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: jest.fn(() => ({
    supported: true,
    isListening: false,
    interimTranscript: '',
    startListening: jest.fn(),
    stopListening: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  })),
}))

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

describe('Home call toggle branch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    endCall.mockClear()
    startCall.mockClear()
  })

  it('ends call and stops processing when call toggled off', async () => {
    const { useContinuousCall } = require('@/hooks/useContinuousCall')
    
    // Mock as inactive initially
    useContinuousCall.mockReturnValue({
      callState: 'idle',
      audioLevel: 0,
      startCall,
      endCall,
      isCallActive: false,
    })

    render(<Home />)

    // First click: start call
    const startBtn = await screen.findByRole('button', { name: /start call/i })
    await userEvent.click(startBtn)

    // Second click: end call, should call endCall
    const endBtn = await screen.findByRole('button', { name: /end call/i })
    await userEvent.click(endBtn)

    await waitFor(() => {
      expect(endCall).toHaveBeenCalled()
    })
  })
})
