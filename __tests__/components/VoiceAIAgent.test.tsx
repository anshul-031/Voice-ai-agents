import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock child components and hooks before importing the component
jest.mock('@/components/TopModelBoxes', () => (props: any) => <div data-testid="TopModelBoxes" data-config={JSON.stringify(props.config)} />)
jest.mock('@/components/InitialPromptEditor', () => (props: any) => <div data-testid="InitialPromptEditor">{props.value}</div>)
jest.mock('@/components/AudioLevelIndicator', () => (props: any) => <div data-testid="AudioLevelIndicator">{String(props.level)}</div>)
jest.mock('@/components/ChatHistory', () => (props: any) => <div data-testid="ChatHistory" />)
jest.mock('@/components/ConfirmDialog', () => (props: any) => props.isOpen ? <div data-testid="ConfirmDialog" /> : null)

// ChatBox will render messages prop so we can inspect it
jest.mock('@/components/ChatBox', () => (props: any) => (
  <div data-testid="ChatBox" data-messages={JSON.stringify(props.messages)} />
))

// Mock hooks
const mockStartCall = jest.fn().mockResolvedValue(undefined)
const mockEndCall = jest.fn()
jest.mock('@/hooks/useContinuousCall', () => ({
  useContinuousCall: () => ({
    callState: 'idle',
    audioLevel: 0,
    startCall: mockStartCall,
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

// Mocks for browser APIs used in the component
global.URL.createObjectURL = jest.fn(() => 'blob:fake')
class MockAudio {
  play = jest.fn().mockResolvedValue(undefined)
  addEventListener = jest.fn()
  pause = jest.fn()
  currentTime = 0
  onended: any = null
}
// @ts-ignore
global.Audio = MockAudio

// Utility to mock fetch behavior by URL
const fetchMock = jest.spyOn(global, 'fetch')

import VoiceAIAgent from '@/components/VoiceAIAgent'

describe('VoiceAIAgent component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: any) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) } as any)
      }

      if (url.includes('/api/llm')) {
        // Default llm response
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'AI says hi' }) } as any)
      }

      if (url.includes('/api/generate-pdf')) {
        return Promise.resolve({ ok: true, json: async () => ({ fileName: 'doc.pdf', pdfData: 'BASE64' }) } as any)
      }

      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }

      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })
  })

  it('renders header and calls onBack/onDelete when provided', async () => {
    const onBack = jest.fn()
    const onDelete = jest.fn()

    render(<VoiceAIAgent agentId="agent-1" agentTitle="Test Agent" defaultPrompt="hi" onBack={onBack} onDelete={onDelete} />)

    // Header items should render
    expect(await screen.findByText('Test Agent')).toBeInTheDocument()

    // Back button exists and works
    const backBtn = screen.getByTitle('Go back')
    backBtn.click()
    expect(onBack).toHaveBeenCalled()

    // Delete button exists and works
    const deleteBtn = screen.getByTitle('Delete this agent')
    deleteBtn.click()
    expect(onDelete).toHaveBeenCalled()
  })

  it('opens text input and sends a message, receiving LLM and TTS responses', async () => {
    render(<VoiceAIAgent defaultPrompt="Hello" />)

    // Open text input by clicking text chat button (MessageSquare)
    const textButton = screen.getAllByTitle('Text chat mode')[0]
    await userEvent.click(textButton)

    // Input should appear
    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Hello there')

    // Click send
    const sendBtn = screen.getByTitle('Send message')
    await userEvent.click(sendBtn)

    // Wait for ChatBox to update
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/llm', expect.any(Object))
      expect(fetchMock).toHaveBeenCalledWith('/api/tts', expect.any(Object))
    })

    // ChatBox should render messages including assistant reply
    const chat = screen.getByTestId('ChatBox')
    const messages = JSON.parse(chat.getAttribute('data-messages') || '[]')
    expect(messages.length).toBeGreaterThanOrEqual(1)
    const assistant = messages.find((m: any) => m.source === 'assistant')
    expect(assistant).toBeDefined()
    expect(assistant.text).toContain('AI')
  })

  it('handles LLM returning pdfCommand and generate-pdf path', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: any) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) } as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Here is the report', pdfCommand: { title: 'Report', data: {} } }) } as any)
      }
      if (url.includes('/api/generate-pdf')) {
        return Promise.resolve({ ok: true, json: async () => ({ fileName: 'report.pdf', pdfData: 'PDFBASE64' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    render(<VoiceAIAgent defaultPrompt="Hello" />)

    const textButton = screen.getAllByTitle('Text chat mode')[0]
    await userEvent.click(textButton)

    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Please create pdf')

    const sendBtn = screen.getByTitle('Send message')
    await userEvent.click(sendBtn)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/generate-pdf', expect.any(Object)))

    const chat = screen.getByTestId('ChatBox')
    const messages = JSON.parse(chat.getAttribute('data-messages') || '[]')
    const assistant = messages.find((m: any) => m.source === 'assistant')
    expect(assistant.pdfAttachment).toBeDefined()
    expect(assistant.pdfAttachment.fileName).toBe('report.pdf')
  })

  it('handles LLM failure and shows assistant error message', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: any) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }) } as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: false, json: async () => ({ error: 'LLM down' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    render(<VoiceAIAgent defaultPrompt="Hello" />)

    const textButton = screen.getAllByTitle('Text chat mode')[0]
    await userEvent.click(textButton)

    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Cause error')

    const sendBtn = screen.getByTitle('Send message')
    await userEvent.click(sendBtn)

    // Wait for error message to be added
    await waitFor(() => {
      const chat = screen.getByTestId('ChatBox')
      const messages = JSON.parse(chat.getAttribute('data-messages') || '[]')
      const assistant = messages.find((m: any) => m.source === 'assistant')
      expect(assistant).toBeDefined()
      expect(assistant.text).toContain('Sorry')
    })
  })
})
