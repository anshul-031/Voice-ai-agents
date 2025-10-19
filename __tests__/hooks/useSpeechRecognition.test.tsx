import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { act, renderHook, waitFor } from '@testing-library/react'

// Build a factory that captures handlers via accessors for reliability
const makeSRConstructor = (handlersStore: any) =>
  jest.fn().mockImplementation(() => {
    const obj: any = {
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      started: false,
      start: jest.fn(function (this: any) { this.started = true }),
      stop: jest.fn(function (this: any) { this.started = false }),
    }
    handlersStore.instance = obj
    Object.defineProperty(obj, 'onresult', {
      get() { return handlersStore.onresult },
      set(v) { handlersStore.onresult = v },
      configurable: true,
    })
    Object.defineProperty(obj, 'onend', {
      get() { return handlersStore.onend },
      set(v) { handlersStore.onend = v },
      configurable: true,
    })
    Object.defineProperty(obj, 'onerror', {
      get() { return handlersStore.onerror },
      set(v) { handlersStore.onerror = v },
      configurable: true,
    })
    return obj
  })

describe('useSpeechRecognition', () => {
  const originalSR = (global as any).window?.SpeechRecognition
  const originalWebkitSR = (global as any).window?.webkitSpeechRecognition
  beforeEach(() => {
    jest.clearAllMocks()
    const handlersStore: any = {}
    ;(window as any).__srHandlers = handlersStore
    const ctor = makeSRConstructor(handlersStore)
    Object.defineProperty(window as any, 'SpeechRecognition', { configurable: true, value: ctor })
    Object.defineProperty(window as any, 'webkitSpeechRecognition', { configurable: true, value: ctor })
  })
  afterEach(() => {
    if (originalSR === undefined) delete (window as any).SpeechRecognition
    else Object.defineProperty(window as any, 'SpeechRecognition', { configurable: true, value: originalSR })
    if (originalWebkitSR === undefined) delete (window as any).webkitSpeechRecognition
    else Object.defineProperty(window as any, 'webkitSpeechRecognition', { configurable: true, value: originalWebkitSR })
    delete (window as any).__srHandlers
  })

  it('detects support and can start/stop listening', async () => {
    const { result } = renderHook(() => useSpeechRecognition({}))

    await waitFor(() => expect(result.current.supported).toBe(true))
    expect(result.current.isListening).toBe(false)

    act(() => {
      result.current.startListening()
    })
    expect(result.current.isListening).toBe(true)

    act(() => {
      result.current.stopListening()
    })
    expect(result.current.isListening).toBe(false)
    expect(result.current.interimTranscript).toBe('')
  })

  it('handles interim and final results, clearing interim on final', async () => {
    const onInterim = jest.fn()
    const onFinal = jest.fn()
    const { result } = renderHook(() => useSpeechRecognition({ onInterim, onFinal }))

    await waitFor(() => expect(result.current.supported).toBe(true))
    act(() => { result.current.startListening() })

    await waitFor(() => expect(typeof (window as any).__srHandlers.onresult).toBe('function'))

    const event = {
      resultIndex: 0,
      results: [
        { isFinal: false, 0: { transcript: 'hello ' } },
        { isFinal: true,  0: { transcript: 'world' } },
      ],
    }
    act(() => { (window as any).__srHandlers.onresult(event) })

    await waitFor(() => expect(onInterim).toHaveBeenCalledWith('hello '))
    await waitFor(() => expect(onFinal).toHaveBeenCalledWith('world'))
    expect(result.current.interimTranscript).toBe('')
  })

  it('auto-restarts on end when not paused, and pause/resume toggles this', async () => {
    const { result } = renderHook(() => useSpeechRecognition({}))
    await waitFor(() => expect(result.current.supported).toBe(true))
    await waitFor(() => expect((window as any).__srHandlers.instance).toBeDefined())

    // start listening, then simulate onend; since shouldRestart=true, it should set isListening true again
    act(() => { result.current.startListening() })
    expect(result.current.isListening).toBe(true)

    act(() => { (window as any).__srHandlers.onend() })
    expect(result.current.isListening).toBe(true)

    // pause disables auto-restart
    act(() => { result.current.pause() })
    expect(result.current.isListening).toBe(false)

    act(() => { (window as any).__srHandlers.onend() })
    expect(result.current.isListening).toBe(false)

    // resume should start again
    act(() => { result.current.resume() })
    expect(result.current.isListening).toBe(true)
  })

  it('handles not-allowed error by stopping and preventing restart', async () => {
    const { result } = renderHook(() => useSpeechRecognition({}))
    await waitFor(() => expect(result.current.supported).toBe(true))
    await waitFor(() => expect((window as any).__srHandlers.instance).toBeDefined())
    await waitFor(() => expect(typeof (window as any).__srHandlers.onerror).toBe('function'))

    act(() => { result.current.startListening() })
    expect(result.current.isListening).toBe(true)

    act(() => { (window as any).__srHandlers.onerror({ error: 'not-allowed' }) })
    await waitFor(() => expect(result.current.isListening).toBe(false))

    act(() => { (window as any).__srHandlers.onend() })
    // should not restart due to pausedRef = true
    await waitFor(() => expect(result.current.isListening).toBe(false))
  })

  it('reports unsupported when browser SpeechRecognition APIs are missing', async () => {
    delete (window as any).SpeechRecognition
    delete (window as any).webkitSpeechRecognition
    delete (window as any).__srHandlers

    const { result } = renderHook(() => useSpeechRecognition({}))

    await waitFor(() => expect(result.current.supported).toBe(false))
    expect(result.current.isListening).toBe(false)

    act(() => { result.current.startListening() })
    expect(result.current.isListening).toBe(false)

    act(() => { result.current.resume() })
    expect(result.current.isListening).toBe(false)
  })

  it('swallows start errors without flipping listening state', async () => {
    const { result } = renderHook(() => useSpeechRecognition({}))
    await waitFor(() => expect(result.current.supported).toBe(true))
    await waitFor(() => expect((window as any).__srHandlers.instance).toBeDefined())
    const instance = (window as any).__srHandlers.instance
    instance.start.mockImplementationOnce(() => { throw new Error('boom') })

    act(() => { result.current.startListening() })

    expect(instance.start).toHaveBeenCalled()
    expect(result.current.isListening).toBe(false)
  })

  it('handles stop errors gracefully while resetting state', async () => {
    const { result } = renderHook(() => useSpeechRecognition({}))
    await waitFor(() => expect(result.current.supported).toBe(true))
    await waitFor(() => expect((window as any).__srHandlers.instance).toBeDefined())
    const instance = (window as any).__srHandlers.instance

    act(() => { result.current.startListening() })
    expect(result.current.isListening).toBe(true)

    instance.stop.mockImplementationOnce(() => { throw new Error('stop fail') })

    act(() => { result.current.stopListening() })

    expect(instance.stop).toHaveBeenCalled()
    expect(result.current.isListening).toBe(false)
    expect(result.current.interimTranscript).toBe('')
  })

  it('continues despite restart errors after onend', async () => {
    const { result } = renderHook(() => useSpeechRecognition({}))
    await waitFor(() => expect(result.current.supported).toBe(true))
    await waitFor(() => expect((window as any).__srHandlers.instance).toBeDefined())
    const instance = (window as any).__srHandlers.instance

    act(() => { result.current.startListening() })
    expect(result.current.isListening).toBe(true)

    instance.start.mockImplementationOnce(() => { throw new Error('restart fail') })

    act(() => { (window as any).__srHandlers.onend() })

    expect(instance.start).toHaveBeenCalledTimes(2)
    expect(result.current.isListening).toBe(false)
  })
})
