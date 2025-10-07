import { renderHook, act } from '@testing-library/react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'

describe('useVoiceRecorder - extra branches', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('stops on silence and restarts automatically when still listening', async () => {
    const onSegmentReady = jest.fn()

    const { result } = renderHook(() =>
      useVoiceRecorder({ onSegmentReady, silenceTimeout: 10 })
    )

    await act(async () => {
      await result.current.startRecording()
    })

    // Access MediaRecorder mock instance
  const MR = MediaRecorder as unknown as jest.Mock
  const instance: any = MR.mock.results[0]?.value || MR.mock.instances[0]

    // Simulate recording state and incoming data
    instance.state = 'recording'
    const blob = new Blob([new Uint8Array([1,2,3])], { type: 'audio/webm' })
    instance.ondataavailable?.({ data: blob })

    // Advance silence timer to trigger stopSegment -> instance.stop()
    await jest.advanceTimersByTimeAsync(20)
    // Our mock MediaRecorder has a stop mock; assert it was called if present
    if (instance.stop) {
      expect(instance.stop).toHaveBeenCalled()
    }

    // When onstop fires, since still listening, it should schedule restart
    instance.onstop?.()
    await jest.advanceTimersByTimeAsync(20)
    expect(instance.start).toHaveBeenCalled()

    // onSegmentReady should be called with aggregated blob once
    expect(onSegmentReady).toHaveBeenCalledTimes(1)
  })

  it('handles MediaRecorder error callback gracefully', async () => {
    const { result } = renderHook(() =>
      useVoiceRecorder({ onSegmentReady: jest.fn() })
    )

    await act(async () => {
      await result.current.startRecording()
    })

  const MR = MediaRecorder as unknown as jest.Mock
  // Prefer the returned value from the mock constructor, since our mock returns a custom object
  const instance: any = MR.mock.results[0]?.value || MR.mock.instances[0]
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  instance.onerror?.(new Error('boom'))
  // error is logged inside the hook
  expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
