import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { act, renderHook } from '@testing-library/react'

describe('useVoiceRecorder - error and restart handling', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('propagates getUserMedia errors and leaves the hook idle', async () => {
    const rejection = new Error('denied')
    const getUserMediaSpy = jest
      .spyOn(navigator.mediaDevices, 'getUserMedia')
      .mockRejectedValueOnce(rejection)

    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady: jest.fn() }))

    await expect(
      act(async () => {
        await result.current.startRecording()
      })
    ).rejects.toThrow('denied')

    expect(result.current.isListening).toBe(false)
    expect(getUserMediaSpy).toHaveBeenCalled()
  })

  it('restarts the media recorder when segments end while still listening', async () => {
    jest.useFakeTimers()

    const analyserMock = {
      fftSize: 2048,
      frequencyBinCount: 8,
      getByteFrequencyData: jest.fn((arr: Uint8Array) => {
        arr.fill(255)
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
    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady }))

    await act(async () => {
      await result.current.startRecording()
    })

    const MR = MediaRecorder as unknown as jest.Mock
    const instance: any = MR.mock.results.at(-1)?.value ?? MR.mock.instances.at(-1)
    expect(instance).toBeTruthy()

    const dataBlob = new Blob(['test'], { type: 'audio/webm;codecs=opus' })

    act(() => {
      instance.ondataavailable?.({ data: dataBlob })
      instance.onstop?.()
    })

    expect(onSegmentReady).toHaveBeenCalledTimes(1)
    expect(onSegmentReady.mock.calls[0][0]).toBeInstanceOf(Blob)

    jest.runOnlyPendingTimers()

    expect(instance.start).toHaveBeenCalledTimes(2)

    // Ensure AudioContext mock close is not called yet (still listening)
    expect(audioContextMock.close).not.toHaveBeenCalled()

    // Force cleanup by calling stopRecording and flushing timers
    instance.state = 'recording'
    await act(async () => {
      result.current.stopRecording()
    })
    jest.runOnlyPendingTimers()

    expect(audioContextMock.close).toHaveBeenCalled()
  })
})
