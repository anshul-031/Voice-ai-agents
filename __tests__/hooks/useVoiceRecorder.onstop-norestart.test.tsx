import { act, renderHook } from '@testing-library/react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'

describe('useVoiceRecorder onstop no-restart path', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not restart MediaRecorder when isListening is false on stop', async () => {
    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady: jest.fn() }))

    // Start then stop listening so the isListening ref becomes false
    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      result.current.stopRecording()
    })

    // Grab the returned MediaRecorder mock instance to invoke onstop
    const MR = (global.MediaRecorder as unknown as jest.Mock)
    const instance = MR.mock.results[0].value
    expect(instance).toBeDefined()

    // Simulate onstop; since isListeningRef is false, it should not call .start() again
    const startSpy = instance.start as jest.Mock
    // Clear the initial call from startRecording()
    startSpy.mockClear()
    act(() => {
      instance.onstop && instance.onstop(new Event('stop') as any)
    })

    expect(startSpy).not.toHaveBeenCalled()
  })
})
