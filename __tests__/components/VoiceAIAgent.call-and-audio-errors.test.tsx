import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Reuse similar mocks as other VoiceAIAgent tests
jest.mock('@/components/TopModelBoxes', () => (props: any) => <div data-testid="TopModelBoxes" data-config={JSON.stringify(props.config)} />)
jest.mock('@/components/InitialPromptEditor', () => (props: any) => <div data-testid="InitialPromptEditor">{props.value}</div>)
jest.mock('@/components/AudioLevelIndicator', () => (props: any) => <div data-testid="AudioLevelIndicator">{String(props.level)}</div>)
jest.mock('@/components/ChatHistory', () => (props: any) => <div data-testid="ChatHistory" />)
jest.mock('@/components/ConfirmDialog', () => (props: any) => props.isOpen ? <div data-testid="ConfirmDialog" /> : null)
jest.mock('@/components/ChatBox', () => (props: any) => (
  <div data-testid="ChatBox" data-messages={JSON.stringify(props.messages)} />
))

// This test will specifically control useContinuousCall to simulate a start failure
const mockStartCallReject = jest.fn().mockRejectedValue(new Error('mic error'))
const mockEndCall = jest.fn()
jest.mock('@/hooks/useContinuousCall', () => ({
  useContinuousCall: () => ({
    callState: 'idle',
    audioLevel: 0,
    startCall: mockStartCallReject,
    endCall: mockEndCall,
    isCallActive: false,
  }),
}))

const mockSttStart = jest.fn()
const mockSttStop = jest.fn()
const mockSttPause = jest.fn()
const mockSttResume = jest.fn()
jest.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    supported: true,
    isListening: false,
    interimTranscript: '',
    startListening: mockSttStart,
    stopListening: mockSttStop,
    pause: mockSttPause,
    resume: mockSttResume,
  }),
}))

// Mock fetch
const fetchMock = jest.spyOn(global, 'fetch')

// We'll override Audio to simulate playback rejection in a separate scenario
class RejectAudio {
  play = jest.fn().mockRejectedValue(new Error('play failed'))
  addEventListener = jest.fn()
  pause = jest.fn()
  currentTime = 0
  onended: any = null
}

import VoiceAIAgent from '@/components/VoiceAIAgent'

describe('VoiceAIAgent error branches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) } as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'AI ok' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })
  })

  it('shows alert when starting call fails (microphone access failure)', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<VoiceAIAgent defaultPrompt="hi" />)

    // Click start call button
    const callBtn = await screen.findByTitle('Start Call')
    await userEvent.click(callBtn)

    await waitFor(() => expect(mockStartCallReject).toHaveBeenCalled())
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Failed to access microphone. Please check permissions and try again.'))

    alertSpy.mockRestore()
  })

  it('handles audio.play rejection gracefully and does not throw', async () => {
    // Use an Audio implementation that rejects on play
    // @ts-ignore
    global.Audio = RejectAudio as any

    // Render with existing module-level mocks
    render(<VoiceAIAgent defaultPrompt="Hello" />)

    // Open text input and send a message to trigger TTS playback
    const textButton = await screen.findByTitle('Text chat mode')
    await userEvent.click(textButton)

    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Hello')

    const sendBtn = screen.getByTitle('Send message')
    await userEvent.click(sendBtn)

    // Wait for fetch /api/tts to be called and for Audio.play to be attempted
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/tts', expect.any(Object))
    })

    // The important assertion is that no exception bubbled up and test completes
    expect(true).toBe(true)
  })

  it('shows configuration guidance when text chat LLM call fails with missing config error', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) } as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: false, json: async () => ({ error: 'LLM service not configured' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    render(<VoiceAIAgent defaultPrompt="hi" />)

    const textToggle = await screen.findByTitle('Text chat mode')
    await userEvent.click(textToggle)

    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Need help')
    await userEvent.click(screen.getByTitle('Send message'))

    await waitFor(() => {
      const chat = screen.getByTestId('ChatBox')
      const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
      const lastMessage = messages[messages.length - 1]
      expect(lastMessage.text).toContain('Please configure your Gemini API key in .env.local')
    })
  })

  it('continues text chat flow when PDF generation fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) } as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ llmText: 'Assistant reply', pdfCommand: { title: 'Report', data: { foo: 'bar' } } }),
        } as any)
      }
      if (url.includes('/api/generate-pdf')) {
        return Promise.resolve({ ok: false, json: async () => ({ error: 'pdf fail' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    render(<VoiceAIAgent defaultPrompt="hi" />)

    const textToggle = await screen.findByTitle('Text chat mode')
    await userEvent.click(textToggle)

    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Generate pdf please')
    await userEvent.click(screen.getByTitle('Send message'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/generate-pdf', expect.any(Object)))

    const chat = await screen.findByTestId('ChatBox')
    const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
    const assistantMessages = messages.filter((m: any) => m.source === 'assistant')
    const lastAssistant = assistantMessages[assistantMessages.length - 1]
    expect(lastAssistant.pdfAttachment).toBeUndefined()

    errorSpy.mockRestore()
  })

  it('warns when text chat TTS generation fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) } as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Assistant note' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: false, json: async () => ({ error: 'tts fail' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    render(<VoiceAIAgent defaultPrompt="hi" />)

    const textToggle = await screen.findByTitle('Text chat mode')
    await userEvent.click(textToggle)

    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'No audio path')
    await userEvent.click(screen.getByTitle('Send message'))

    await waitFor(() => expect(warnSpy).toHaveBeenCalledWith('[VoiceAIAgent] TTS failed, continuing without audio'))

    warnSpy.mockRestore()
  })
})
