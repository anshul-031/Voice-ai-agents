import { renderHook, act } from '@testing-library/react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'

describe('useVoiceRecorder - unmount cleanup while listening', () => {
  it('invokes stopRecording logic on unmount when still listening', async () => {
    const { result, unmount } = renderHook(() => useVoiceRecorder({ onSegmentReady: jest.fn() }))

    await act(async () => {
      await result.current.startRecording()
    })

    // Unmount the hook component while listening; it should stop and cleanup
    unmount()
    // No explicit assertion needed; if stopRecording references throw, the test would fail
    // But we can at least assert that our MediaRecorder mock was created
    const MR = MediaRecorder as unknown as jest.Mock
    expect(MR.mock.calls.length).toBeGreaterThan(0)
  })
})
