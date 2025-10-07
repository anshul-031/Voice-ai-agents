import { renderHook, act } from '@testing-library/react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'

describe('useVoiceRecorder - MIME fallback and onstart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('falls back to browser default MIME when no type supported', async () => {
    // Force isTypeSupported to return false along the chain
    const spy = jest.spyOn(MediaRecorder, 'isTypeSupported' as any).mockReturnValue(false)

    const { result } = renderHook(() => useVoiceRecorder({ onSegmentReady: jest.fn() }))
    await act(async () => {
      await result.current.startRecording()
    })

    // At this point, our jest.setup MediaRecorder mock has start called and onstart may be set
    const MR = MediaRecorder as unknown as jest.Mock
    const instance: any = MR.mock.results[0]?.value || MR.mock.instances[0]
    // Trigger onstart
    instance.onstart?.()
    expect(instance.start).toHaveBeenCalled()

    spy.mockRestore()
  })
})
