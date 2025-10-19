import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock child components with lightweight stubs
jest.mock('@/components/TopModelBoxes', () => (props: any) => (
  <div data-testid="TopModelBoxes" data-config={JSON.stringify(props.config)} />
))
jest.mock('@/components/InitialPromptEditor', () => (props: any) => (
  <div data-testid="InitialPromptEditor" data-value={props.value}>
    {props.value}
  </div>
))
jest.mock('@/components/AudioLevelIndicator', () => (props: any) => (
  <div data-testid="AudioLevelIndicator">{String(props.level)}</div>
))
jest.mock('@/components/ChatHistory', () => (props: any) => (
  props.isOpen ? <div data-testid="ChatHistoryModal" /> : null
))
jest.mock('@/components/ConfirmDialog', () => (props: any) => (
  props.isOpen ? (
    <div data-testid="ConfirmDialog">
      <button onClick={props.onConfirm} data-testid="confirm-end" />
      <button onClick={props.onCancel} data-testid="cancel-end" />
    </div>
  ) : null
))
jest.mock('@/components/ChatBox', () => (props: any) => (
  <div
    data-testid="ChatBox"
    data-messages={JSON.stringify(props.messages)}
    data-processing={String(props.isProcessing)}
  />
))

type SpeechOptions = {
  onFinal?: (text: string) => Promise<void> | void
  onInterim?: (text: string) => void
}

let callActive = false
const mockStartCall = jest.fn(async () => {
  callActive = true
})
const mockEndCall = jest.fn(() => {
  callActive = false
})
const mockSttStart = jest.fn()
const mockSttStop = jest.fn()
const mockSttPause = jest.fn()
const mockSttResume = jest.fn()
let capturedOnFinal: SpeechOptions['onFinal']
let capturedOnInterim: SpeechOptions['onInterim']

jest.mock('@/hooks/useContinuousCall', () => ({
  useContinuousCall: () => ({
    callState: callActive ? 'active' : 'idle',
    audioLevel: 0,
    startCall: mockStartCall,
    endCall: mockEndCall,
    isCallActive: callActive,
  }),
}))

jest.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: (options: SpeechOptions = {}) => {
    capturedOnFinal = options.onFinal
    capturedOnInterim = options.onInterim
    return {
      supported: true,
      isListening: false,
      interimTranscript: '',
      startListening: mockSttStart,
      stopListening: mockSttStop,
      pause: mockSttPause,
      resume: mockSttResume,
    }
  },
}))

const originalAudio = (global as any).Audio
const originalCreateObjectURL = global.URL?.createObjectURL
const originalRevokeObjectURL = global.URL?.revokeObjectURL
const audioInstances: Array<{ __handlers: Record<string, () => void> }> = []

class MockAudio {
  public currentTime = 0
  public __handlers: Record<string, () => void> = {}
  public constructor() {
    audioInstances.push(this)
  }
  play = jest.fn().mockResolvedValue(undefined)
  pause = jest.fn()
  addEventListener = jest.fn((event: string, handler: () => void) => {
    this.__handlers[event] = handler
  })
}

beforeAll(() => {
  ;(global as any).Audio = MockAudio as any
})

afterAll(() => {
  ;(global as any).Audio = originalAudio
  if (originalCreateObjectURL) {
    global.URL.createObjectURL = originalCreateObjectURL
  } else {
    delete (global.URL as any).createObjectURL
  }
  if (originalRevokeObjectURL) {
    global.URL.revokeObjectURL = originalRevokeObjectURL
  } else {
    delete (global.URL as any).revokeObjectURL
  }
})

const fetchMock = jest.spyOn(global, 'fetch')

beforeEach(() => {
  callActive = false
  capturedOnFinal = undefined
  capturedOnInterim = undefined
  audioInstances.length = 0
  mockStartCall.mockClear()
  mockEndCall.mockClear()
  mockSttStart.mockClear()
  mockSttStop.mockClear()
  mockSttPause.mockClear()
  mockSttResume.mockClear()
  fetchMock.mockReset()
  global.URL.createObjectURL = jest.fn(() => 'blob:mock')
  global.URL.revokeObjectURL = jest.fn()
})

afterAll(() => {
  fetchMock.mockRestore()
})

const defaultFetchImplementation = (input: RequestInfo | URL) => {
  const url = String(input)
  if (url.includes('/api/config-status')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
    } as any)
  }
  return Promise.resolve({ ok: true, json: async () => ({}) } as any)
}

const renderAgent = () => {
  const VoiceAIAgent = require('@/components/VoiceAIAgent').default
  return render(<VoiceAIAgent defaultPrompt="Hello" />)
}

describe('VoiceAIAgent speech flows', () => {
  it('processes onFinal speech results end-to-end and resumes listening after audio playback', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
        } as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            llmText: 'Assistant reply',
            pdfCommand: { title: 'Summary', data: { a: 1 } },
          }),
        } as any)
      }
      if (url.includes('/api/generate-pdf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ fileName: 'report.pdf', pdfData: 'PDFDATA' }),
        } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ audioData: 'AAAA' }),
        } as any)
      }
  return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const callButton = await screen.findByTitle('Start Call')
    await userEvent.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalledTimes(1))
    expect(typeof capturedOnFinal).toBe('function')

    await act(async () => {
      await capturedOnFinal?.('Customer said hello')
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/llm', expect.any(Object))
      expect(fetchMock).toHaveBeenCalledWith('/api/tts', expect.any(Object))
      expect(fetchMock).toHaveBeenCalledWith('/api/generate-pdf', expect.any(Object))
    })

    const chat = await screen.findByTestId('ChatBox')
    const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
    expect(messages.some((m: any) => m.source === 'assistant' && m.pdfAttachment)).toBe(true)

    audioInstances.forEach(instance => instance.__handlers['ended']?.())
    await waitFor(() => expect(mockSttResume).toHaveBeenCalled())
  })

  it('handles TTS failure during speech processing without throwing', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
  } as any)
      }
      if (url.includes('/api/llm')) {
  return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Speech reply' }) } as any)
      }
      if (url.includes('/api/tts')) {
  return Promise.resolve({ ok: false, json: async () => ({ error: 'tts down' }) } as any)
      }
  return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()
    const callButton = await screen.findByTitle('Start Call')
    await userEvent.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    await act(async () => {
      await capturedOnFinal?.('Need a fallback audio')
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/llm', expect.any(Object)))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/tts', expect.any(Object)))
    expect(mockSttResume).toHaveBeenCalled()
  })

  it('adds assistant error message when LLM call fails for speech input', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
  } as any)
      }
      if (url.includes('/api/llm')) {
  return Promise.resolve({ ok: false, json: async () => ({ error: 'LLM unavailable' }) } as any)
      }
  return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()
    const callButton = await screen.findByTitle('Start Call')
    await userEvent.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    await act(async () => {
      await capturedOnFinal?.('Trigger failure path')
    })

  const chat = await screen.findByTestId('ChatBox')
  const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
  const assistantMessages = messages.filter((m: any) => m.source === 'assistant')
  const lastAssistant = assistantMessages[assistantMessages.length - 1]
  expect(lastAssistant?.text).toMatch(/error processing speech/i)
  })

  it('ignores speech callbacks when call is not active', async () => {
    fetchMock.mockImplementation(defaultFetchImplementation)
    renderAgent()
    await waitFor(() => expect(typeof capturedOnFinal).toBe('function'))

    await act(async () => {
      await capturedOnFinal?.('This should be ignored')
    })

    expect(fetchMock).not.toHaveBeenCalledWith('/api/llm', expect.any(Object))
  })

  it('clears chat messages when Clear button is pressed in text mode', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
  } as any)
      }
      if (url.includes('/api/llm')) {
  return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Assistant text reply' }) } as any)
      }
      if (url.includes('/api/tts')) {
  return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
  return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await userEvent.click(textToggle)
    const input = await screen.findByPlaceholderText('Type your message...')
  await userEvent.type(input, 'Hello via text')
  await userEvent.click(screen.getByTitle('Send message'))

    await waitFor(() => {
      const chat = screen.getByTestId('ChatBox')
      const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
      expect(messages.length).toBeGreaterThan(0)
    })

    const clearButton = await screen.findByTitle('Clear chat messages')
    await userEvent.click(clearButton)

    await waitFor(() => {
      const chat = screen.getByTestId('ChatBox')
      const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
      expect(messages).toHaveLength(0)
    })
  })

  it('terminates active chat session when call button is pressed while chat open', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
  } as any)
      }
      if (url.includes('/api/llm')) {
  return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Assistant response' }) } as any)
      }
      if (url.includes('/api/tts')) {
  return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
  return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await userEvent.click(textToggle)
    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Turn chat on')
    await userEvent.click(screen.getByTitle('Send message'))

    await waitFor(() => {
      const chat = screen.getByTestId('ChatBox')
      const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
      expect(messages.length).toBeGreaterThan(0)
    })

    const callButton = await screen.findByTitle('Start Call')
    await userEvent.click(callButton)

    await waitFor(() => expect(mockEndCall).toHaveBeenCalled())
    expect(mockSttStop).toHaveBeenCalled()

    const chat = screen.getByTestId('ChatBox')
    const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
    expect(messages).toHaveLength(0)
  })

  it('toggles text input visibility when text mode button is pressed twice', async () => {
    fetchMock.mockImplementation(defaultFetchImplementation)
    renderAgent()

    const toggle = await screen.findByTitle('Text chat mode')
    await userEvent.click(toggle)
    await screen.findByPlaceholderText('Type your message...')

    await userEvent.click(toggle)
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Type your message...')).not.toBeInTheDocument()
    })
  })

  it('opens chat history modal when History button is clicked', async () => {
    fetchMock.mockImplementation(defaultFetchImplementation)
    renderAgent()

    const historyButton = await screen.findByTitle('View chat history')
    await userEvent.click(historyButton)

    expect(await screen.findByTestId('ChatHistoryModal')).toBeInTheDocument()
  })
})
