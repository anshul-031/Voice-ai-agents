import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { act, renderHook } from '@testing-library/react'

describe('useVoiceRecorder additional branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('manages silence timers across silence and voice transitions', async () => {
    jest.useFakeTimers()

    let emitLoudAudio = false

    const analyserMock = {
      fftSize: 2048,
      frequencyBinCount: 8,
      getByteFrequencyData: jest.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i += 1) {
          array[i] = emitLoudAudio ? 255 : 0
        }
      }),
      getByteTimeDomainData: jest.fn(),
      connect: jest.fn(),
    }

    const sourceMock = { connect: jest.fn() }
    const audioContextMock = {
      createMediaStreamSource: jest.fn(() => sourceMock),
      createAnalyser: jest.fn(() => analyserMock),
      close: jest.fn(),
      state: 'running',
    }

    const mediaRecorderMock = MediaRecorder as unknown as jest.Mock

    // Ensure predictable Math.random branch
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)

    // Next constructed AudioContext should use our mock
    ;(AudioContext as unknown as jest.Mock).mockImplementationOnce(() => audioContextMock)

    const onSegmentReady = jest.fn()
    const { result } = renderHook(() =>
      useVoiceRecorder({ onSegmentReady, silenceThreshold: 0.001, silenceTimeout: 20 })
    )

    await act(async () => {
      await result.current.startRecording()
    })

    const recorderInstance: any =
      mediaRecorderMock.mock.results.at(-1)?.value ?? mediaRecorderMock.mock.instances.at(-1)

    // Let initial silence sampling schedule the timer
    await act(async () => {
      await jest.advanceTimersByTimeAsync(16)
    })

    // Switch to loud audio so that the existing silence timer is cleared
    emitLoudAudio = true
    await act(async () => {
      await jest.advanceTimersByTimeAsync(16)
    })

    // Drop back to silence to arm a new timer
    emitLoudAudio = false
    await act(async () => {
      await jest.advanceTimersByTimeAsync(16)
    })

    // Force MediaRecorder into an inactive state before silence timeout fires
    recorderInstance.state = 'inactive'

    // Allow timers to flush: requestAnimationFrame (16ms) then silence timeout (20ms)
    await act(async () => {
      await jest.advanceTimersByTimeAsync(25)
    })

    // stopSegment should have skipped the stop() call because recorder inactive
    expect(recorderInstance.stop).not.toHaveBeenCalled()

    randomSpy.mockRestore()
  })

  it('does not restart recording when onstop fires after stopRecording', async () => {
    const onSegmentReady = jest.fn()

    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady }))

    await act(async () => {
      await result.current.startRecording()
    })

    const recorderInstance: any =
      (MediaRecorder as unknown as jest.Mock).mock.results.at(-1)?.value ??
      (MediaRecorder as unknown as jest.Mock).mock.instances.at(-1)

    await act(async () => {
      result.current.stopRecording()
    })

    act(() => {
      recorderInstance.onstop?.()
    })

    expect(onSegmentReady).not.toHaveBeenCalled()
  expect(recorderInstance.start).toHaveBeenCalledTimes(1)
  })

  it('gracefully handles stopRecording before any media starts', () => {
    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady: jest.fn() }))

    act(() => {
      result.current.stopRecording()
    })

    expect(result.current.isListening).toBe(false)
  })

  it('falls back to audio/wav MIME type when earlier options unsupported', async () => {
    const typeSupportSpy = jest
      .spyOn(MediaRecorder, 'isTypeSupported' as any)
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => true)

    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady: jest.fn() }))

    await act(async () => {
      await result.current.startRecording()
    })

    const mediaRecorderMock = MediaRecorder as unknown as jest.Mock
    const [, recorderOptions] = mediaRecorderMock.mock.calls.at(-1) ?? []

    expect(recorderOptions?.mimeType).toBe('audio/wav')
    typeSupportSpy.mockRestore()
  })

  it('uses browser default MIME when no supported types are available', async () => {
    const typeSupportSpy = jest
      .spyOn(MediaRecorder, 'isTypeSupported' as any)
      .mockReturnValue(false)

    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady: jest.fn() }))

    await act(async () => {
      await result.current.startRecording()
    })

    const mediaRecorderMock = MediaRecorder as unknown as jest.Mock
    const [, recorderOptions] = mediaRecorderMock.mock.calls.at(-1) ?? []

    expect(recorderOptions?.mimeType).toBeUndefined()
    typeSupportSpy.mockRestore()
  })
})
