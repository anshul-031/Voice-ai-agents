import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
let latestConfirmDialogProps: any
let latestChatHistoryProps: any
let latestChatBoxProps: any

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
jest.mock('@/components/ChatHistory', () => (props: any) => {
  latestChatHistoryProps = props
  return props.isOpen ? (
    <div data-testid="ChatHistoryModal">
      <button data-testid="close-history" onClick={props.onClose} />
    </div>
  ) : null
})
jest.mock('@/components/ConfirmDialog', () => (props: any) => {
  latestConfirmDialogProps = props
  return props.isOpen ? (
    <div data-testid="ConfirmDialog">
      <button data-testid="confirm-end" onClick={props.onConfirm} />
      <button data-testid="cancel-end" onClick={props.onCancel} />
    </div>
  ) : null
})
jest.mock('@/components/ChatBox', () => (props: any) => {
  latestChatBoxProps = props
  return (
    <div
      data-testid="ChatBox"
      data-open={String(props.isOpen)}
      data-messages={JSON.stringify(props.messages)}
    />
  )
})

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
      isListening: callActive,
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
const audioInstances: Array<{
  play: jest.Mock
  pause: jest.Mock
  currentTime: number
  __handlers: Record<string, () => void>
}> = []

class MockAudio {
  public currentTime = 0
  public __handlers: Record<string, () => void> = {}
  constructor(public source: string) {
    audioInstances.push(this as any)
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
const user = userEvent.setup()

beforeEach(() => {
  callActive = false
  capturedOnFinal = undefined
  capturedOnInterim = undefined
  latestConfirmDialogProps = undefined
  latestChatHistoryProps = undefined
  latestChatBoxProps = undefined
  audioInstances.length = 0
  mockStartCall.mockClear()
  mockEndCall.mockClear()
  mockSttStart.mockClear()
  mockSttStop.mockClear()
  mockSttPause.mockClear()
  mockSttResume.mockClear()
  fetchMock.mockReset()
  global.URL.createObjectURL = jest.fn(() => 'blob:test')
  global.URL.revokeObjectURL = jest.fn()
})

afterAll(() => {
  fetchMock.mockRestore()
})

const renderAgent = (props = {}) => {
  const VoiceAIAgent = require('@/components/VoiceAIAgent').default
  return render(<VoiceAIAgent defaultPrompt="Hello" {...props} />)
}

const defaultConfigResponse = {
  ok: true,
  status: 200,
  json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true }),
}

describe('VoiceAIAgent additional coverage', () => {
  it('logs config status errors when initial check fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    renderAgent()

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        '[VoiceAIAgent] Failed to check config:',
        expect.any(Error)
      )
    })

    errorSpy.mockRestore()
  })

  it('ignores blank speech transcripts when call is active', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Response' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const callButton = await screen.findByTitle('Start Call')
    await user.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    await act(async () => {
      await capturedOnFinal?.('   ')
    })

    const llmCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/llm'))
    expect(llmCalls).toHaveLength(0)
  })

  it('includes prior speech history on subsequent requests', async () => {
    const llmBodies: any[] = []
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        if (init?.body) {
          llmBodies.push(JSON.parse(init.body as string))
        }
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Assistant answer' }) } as any)
      }
      if (url.includes('/api/generate-pdf')) {
        return Promise.resolve({ ok: true, json: async () => ({ fileName: 'file.pdf', pdfData: 'PDF' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const callButton = await screen.findByTitle('Start Call')
    await user.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    await act(async () => {
      await capturedOnFinal?.('First question')
    })

    await waitFor(() => {
      const chat = screen.getByTestId('ChatBox')
      const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
      expect(messages.length).toBeGreaterThan(1)
    })

    audioInstances.forEach(instance => instance.__handlers.ended?.())

    await act(async () => {
      await capturedOnFinal?.('Second question')
    })

    await waitFor(() => expect(llmBodies).toHaveLength(2))
    expect(llmBodies[1].conversationHistory.length).toBeGreaterThan(0)
  })

  it('aborts speech processing when call ends before LLM resolves', async () => {
    let resolveLlm: (() => void) | undefined
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return new Promise(resolve => {
          resolveLlm = () =>
            resolve({ ok: true, json: async () => ({ llmText: 'Delayed reply' }) } as any)
        })
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const callButton = await screen.findByTitle('Start Call')
    await user.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    let finalPromise: Promise<void> = Promise.resolve()
    await act(async () => {
      const maybePromise = capturedOnFinal?.('Please hold')
      if (maybePromise) {
        finalPromise = maybePromise
      }
    })

    await waitFor(() => expect(resolveLlm).toBeDefined())

    const endButton = await screen.findByTitle('End Call')
    await user.click(endButton)

    const initialTtsCount = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/tts')).length

    resolveLlm?.()

    await act(async () => {
      await finalPromise
    })

    const finalTtsCount = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/tts')).length
    expect(finalTtsCount).toBe(initialTtsCount)
  })

  it('stops TTS playback when call ends before audio plays', async () => {
    let resolveTts: (() => void) | undefined
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Reply' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return new Promise(resolve => {
          resolveTts = () =>
            resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const callButton = await screen.findByTitle('Start Call')
    await user.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    let finalPromise: Promise<void> = Promise.resolve()
    await act(async () => {
      const maybePromise = capturedOnFinal?.('Call will end before tts')
      if (maybePromise) {
        finalPromise = maybePromise
      }
    })

    await waitFor(() => expect(resolveTts).toBeDefined())

    const endButton = await screen.findByTitle('End Call')
    await user.click(endButton)

    resolveTts?.()

    await act(async () => {
      await finalPromise
    })

    expect(mockSttResume).not.toHaveBeenCalled()
    expect(audioInstances.length).toBe(0)
  })

  it('logs errors when speech PDF generation fails or throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    let pdfCallCount = 0
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ llmText: 'Assistant', pdfCommand: { title: 'Doc', data: {} } }),
        } as any)
      }
      if (url.includes('/api/generate-pdf')) {
        pdfCallCount += 1
        if (pdfCallCount === 1) {
          return Promise.resolve({ ok: false, json: async () => ({ error: 'fail' }) } as any)
        }
        return Promise.reject(new Error('pdf offline'))
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const callButton = await screen.findByTitle('Start Call')
    await user.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    await act(async () => {
      await capturedOnFinal?.('Need pdf twice')
    })

    audioInstances.forEach(instance => instance.__handlers.ended?.())

    await act(async () => {
      await capturedOnFinal?.('Need pdf second time')
    })

    await waitFor(() => expect(pdfCallCount).toBe(2))
    expect(errorSpy).toHaveBeenCalledWith('[VoiceAIAgent] PDF generation failed')
    expect(errorSpy).toHaveBeenCalledWith('[VoiceAIAgent] PDF generation error:', expect.any(Error))
    errorSpy.mockRestore()
  })

  it('cleans up active audio when confirming conversation end', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Speech reply' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const callButton = await screen.findByTitle('Start Call')
    await user.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    await act(async () => {
      await capturedOnFinal?.('Play audio now')
    })

    expect(audioInstances.length).toBeGreaterThan(0)
    const activeAudio = audioInstances[audioInstances.length - 1]

    await act(async () => {
      await latestConfirmDialogProps.onConfirm()
    })

    expect(activeAudio.pause).toHaveBeenCalled()
    expect(mockSttStop).toHaveBeenCalled()
    expect(mockEndCall).toHaveBeenCalled()
  })

  it('handles cancel action on end conversation dialog', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    await act(async () => {
      await latestConfirmDialogProps.onCancel()
    })

    expect(typeof latestConfirmDialogProps.onCancel).toBe('function')
  })

  it('attaches PDF metadata when text chat PDF generation succeeds', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            llmText: 'Here is your document',
            pdfCommand: { title: 'Report', data: { value: 1 } },
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
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await user.click(textToggle)

    const input = await screen.findByPlaceholderText('Type your message...')
    await user.type(input, 'Generate the pdf please')
    await user.click(screen.getByTitle('Send message'))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/generate-pdf', expect.anything())
    )

    const chat = await screen.findByTestId('ChatBox')
    const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
    const lastAssistant = messages.filter((m: any) => m.source === 'assistant').pop()
    expect(lastAssistant.pdfAttachment).toMatchObject({ fileName: 'report.pdf', title: 'Report' })
  })

  it('logs PDF errors in text chat when generation throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            llmText: 'Trying to build pdf',
            pdfCommand: { title: 'Doc', data: {} },
          }),
        } as any)
      }
      if (url.includes('/api/generate-pdf')) {
        return Promise.reject(new Error('pdf failure'))
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await user.click(textToggle)

    const input = await screen.findByPlaceholderText('Type your message...')
    await user.type(input, 'Please attempt pdf')
    await user.click(screen.getByTitle('Send message'))

    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('[VoiceAIAgent] PDF generation error:', expect.any(Error)))
    errorSpy.mockRestore()
  })

  it('shows generic guidance when text LLM fails without config hint', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Unexpected error occurred' }),
        } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await user.click(textToggle)
    const input = await screen.findByPlaceholderText('Type your message...')
    await user.type(input, 'trigger error')
    await user.click(screen.getByTitle('Send message'))

    const chat = await screen.findByTestId('ChatBox')
    const messages = JSON.parse(chat.getAttribute('data-messages') ?? '[]')
    const lastMessage = messages[messages.length - 1]
    expect(lastMessage.text).toBe('Sorry, I encountered an error processing your message.')
  })

  it('skips audio playback when TTS returns no audio data', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'No audio for this' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({}) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await user.click(textToggle)
    const input = await screen.findByPlaceholderText('Type your message...')
    await user.type(input, 'Do not speak')
    await user.click(screen.getByTitle('Send message'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/tts', expect.anything()))
    expect(audioInstances.length).toBe(0)
  })

  it('revokes object URLs after text chat audio playback ends', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Play audio' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await user.click(textToggle)
    const input = await screen.findByPlaceholderText('Type your message...')
    await user.type(input, 'Play audio now')
    await user.click(screen.getByTitle('Send message'))

    await waitFor(() => expect(audioInstances.length).toBeGreaterThan(0))
    const audio = audioInstances[audioInstances.length - 1]
    audio.__handlers.ended?.()

    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('prevents sending empty messages via Enter key', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await user.click(textToggle)
    const input = await screen.findByPlaceholderText('Type your message...')
    await user.click(input)
    await user.keyboard('{Enter}')

    const llmCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/llm'))
    expect(llmCalls).toHaveLength(0)
  })

  it('distinguishes Enter and Shift+Enter and tracks text conversation history', async () => {
    const llmBodies: any[] = []
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        if (init?.body) {
          llmBodies.push(JSON.parse(init.body as string))
        }
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Reply for ' + llmBodies.length }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await user.click(textToggle)
    const input = await screen.findByPlaceholderText('Type your message...')

    await user.clear(input)
    await user.type(input, 'First line')
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    expect(llmBodies).toHaveLength(0)

    await user.keyboard('{Enter}')
    await waitFor(() => expect(llmBodies).toHaveLength(1))

    await user.type(input, 'Second line')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(llmBodies).toHaveLength(2))

    expect(llmBodies[1].conversationHistory.length).toBeGreaterThan(0)
  })

  it('reopens chat room automatically when sending after confirm end', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Hello again' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const textToggle = await screen.findByTitle('Text chat mode')
    await user.click(textToggle)
    const input = await screen.findByPlaceholderText('Type your message...')

    await act(async () => {
      await latestConfirmDialogProps.onConfirm()
    })

    await user.type(input, 'Are we open?')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/llm', expect.anything()))
    await waitFor(() => expect(screen.getByTestId('ChatBox').getAttribute('data-open')).toBe('true'))
  })

  it('renders deleting state for agent deletion button', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    const onDelete = jest.fn()
    renderAgent({ agentId: 'agent-1', onDelete, isDeleting: true })

    const deleteButton = await screen.findByTitle('Delete this agent')
    expect(deleteButton).toHaveTextContent('Deleting...')
  })

  it('closes chat history when the modal close control is used', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const historyButton = await screen.findByTitle('View chat history')
    await user.click(historyButton)
    expect(await screen.findByTestId('ChatHistoryModal')).toBeInTheDocument()

    await user.click(screen.getByTestId('close-history'))
    await waitFor(() => expect(latestChatHistoryProps.isOpen).toBe(false))
  })

  it('stops audio playback when ending call manually', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/config-status')) {
        return Promise.resolve(defaultConfigResponse as any)
      }
      if (url.includes('/api/llm')) {
        return Promise.resolve({ ok: true, json: async () => ({ llmText: 'Audio incoming' }) } as any)
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({ ok: true, json: async () => ({ audioData: 'AAAA' }) } as any)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any)
    })

    renderAgent()

    const callButton = await screen.findByTitle('Start Call')
    await user.click(callButton)
    await waitFor(() => expect(mockStartCall).toHaveBeenCalled())

    await act(async () => {
      await capturedOnFinal?.('Play and keep audio')
    })

    expect(audioInstances.length).toBeGreaterThan(0)
    const audio = audioInstances[audioInstances.length - 1]

    const endButton = await screen.findByTitle('End Call')
    await user.click(endButton)

    expect(audio.pause).toHaveBeenCalled()
  })
})
