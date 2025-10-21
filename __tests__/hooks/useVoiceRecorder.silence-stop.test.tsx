import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { act, renderHook } from '@testing-library/react'

describe('useVoiceRecorder - silence timeout handling', () => {
  let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame
  let originalCancelAnimationFrame: typeof globalThis.cancelAnimationFrame
  let rafCallback: FrameRequestCallback | null

  beforeEach(() => {
    jest.useFakeTimers()
    originalRequestAnimationFrame = global.requestAnimationFrame
    originalCancelAnimationFrame = global.cancelAnimationFrame
    rafCallback = null

    global.requestAnimationFrame = (((cb: FrameRequestCallback) => {
      rafCallback = cb
      return 1 as unknown as number
    }) as typeof global.requestAnimationFrame)

    global.cancelAnimationFrame = (jest.fn(() => undefined) as unknown as typeof global.cancelAnimationFrame)
  })

  afterEach(() => {
    jest.useRealTimers()
    global.requestAnimationFrame = originalRequestAnimationFrame
    global.cancelAnimationFrame = originalCancelAnimationFrame
    jest.restoreAllMocks()
  })

  it('stops the segment after silence timeout when still listening', async () => {
    const analyserMock = {
      fftSize: 2048,
      frequencyBinCount: 8,
      getByteFrequencyData: jest.fn((arr: Uint8Array) => {
        arr.fill(0)
      }),
      getByteTimeDomainData: jest.fn(),
      connect: jest.fn(),
    }

    const audioContextMock = {
      createMediaStreamSource: jest.fn(() => ({ connect: jest.fn() })),
      createAnalyser: jest.fn(() => analyserMock),
      close: jest.fn(),
      state: 'running',
    }

    ;(global.AudioContext as unknown as jest.Mock).mockImplementationOnce(() => audioContextMock)

    const onSegmentReady = jest.fn()
    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady, silenceTimeout: 50 }))

    await act(async () => {
      await result.current.startRecording()
    })

    const MR = MediaRecorder as unknown as jest.Mock
    const instance: any = MR.mock.results.at(-1)?.value ?? MR.mock.instances.at(-1)
    expect(instance).toBeTruthy()

    expect(result.current.isListening).toBe(true)
    instance.state = 'recording'

    // Run one VAD cycle with silence detected
    await act(async () => {
      rafCallback?.(0)
    })

    // Trigger the silence timeout
    act(() => {
      jest.advanceTimersByTime(60)
    })

    expect(instance.stop).toHaveBeenCalledTimes(1)

    // stopRecording should clean up and cancel future animation frames
    await act(async () => {
      result.current.stopRecording()
    })

    expect(audioContextMock.close).toHaveBeenCalled()
    expect((global.cancelAnimationFrame as unknown as jest.Mock)).toHaveBeenCalled()
  })
})
