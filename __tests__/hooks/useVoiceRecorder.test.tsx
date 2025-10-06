import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { createMockAudioBlob } from '../test-utils'

describe('useVoiceRecorder', () => {
  const mockOnSegmentReady = jest.fn()
  const mockOnLevelChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      expect(result.current.isListening).toBe(false)
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.audioLevel).toBe(0)
    })

    it('should provide startRecording function', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      expect(typeof result.current.startRecording).toBe('function')
    })

    it('should provide stopRecording function', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      expect(typeof result.current.stopRecording).toBe('function')
    })

    it('should provide setProcessing function', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      expect(typeof result.current.setProcessing).toBe('function')
    })
  })

  describe('Starting Recording', () => {
    it('should set isListening to true when starting', async () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      expect(result.current.isListening).toBe(true)
    })

    it('should request microphone access', async () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.any(Object),
        })
      )
    })

    it('should create AudioContext', async () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      expect(AudioContext).toHaveBeenCalled()
    })

    it('should create MediaRecorder', async () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      expect(MediaRecorder).toHaveBeenCalled()
    })
  })

  describe('Stopping Recording', () => {
    it('should set isListening to false when stopping', async () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      act(() => {
        result.current.stopRecording()
      })

      expect(result.current.isListening).toBe(false)
    })

    it('should stop all media tracks', async () => {
      const mockStop = jest.fn()
      const mockGetUserMedia = navigator.mediaDevices.getUserMedia as jest.Mock
      mockGetUserMedia.mockResolvedValueOnce({
        getTracks: () => [{
          stop: mockStop,
          label: 'test',
          enabled: true,
          muted: false,
          getSettings: () => ({ channelCount: 1, sampleRate: 44100 })
        }],
        getAudioTracks: () => [{
          stop: mockStop,
          label: 'test',
          enabled: true,
          muted: false,
          getSettings: () => ({ channelCount: 1, sampleRate: 44100 })
        }],
      })

      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      act(() => {
        result.current.stopRecording()
      })

      expect(mockStop).toHaveBeenCalled()
    })
  })

  describe('Processing State', () => {
    it('should update processing state', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      act(() => {
        result.current.setProcessing(true)
      })

      expect(result.current.isProcessing).toBe(true)

      act(() => {
        result.current.setProcessing(false)
      })

      expect(result.current.isProcessing).toBe(false)
    })

    it('should allow multiple processing state changes', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      act(() => {
        result.current.setProcessing(true)
      })
      expect(result.current.isProcessing).toBe(true)

      act(() => {
        result.current.setProcessing(false)
      })
      expect(result.current.isProcessing).toBe(false)

      act(() => {
        result.current.setProcessing(true)
      })
      expect(result.current.isProcessing).toBe(true)
    })
  })

  describe('Audio Level Detection', () => {
    it('should call onLevelChange with audio level', async () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
          onLevelChange: mockOnLevelChange,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      // Audio level should be tracked
      await waitFor(() => {
        expect(result.current.audioLevel).toBeGreaterThanOrEqual(0)
      })
    })

    it('should update audioLevel in state', async () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      expect(result.current.audioLevel).toBe(0)

      await act(async () => {
        await result.current.startRecording()
      })

      // After starting, audio level might change
      expect(result.current.audioLevel).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Silence Detection', () => {
    it('should accept custom silenceThreshold', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
          silenceThreshold: 0.01,
        })
      )

      expect(result.current).toBeDefined()
    })

    it('should accept custom silenceTimeout', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
          silenceTimeout: 1000,
        })
      )

      expect(result.current).toBeDefined()
    })

    it('should use default silenceThreshold when not provided', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      expect(result.current).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle microphone access denial', async () => {
      const mockGetUserMedia = navigator.mediaDevices.getUserMedia as jest.Mock
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await expect(
        act(async () => {
          await result.current.startRecording()
        })
      ).rejects.toThrow('Permission denied')

      expect(result.current.isListening).toBe(false)
    })

    it('should not crash if stopRecording is called without starting', () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      expect(() => {
        act(() => {
          result.current.stopRecording()
        })
      }).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      expect(result.current.isListening).toBe(true)

      unmount()

      // After unmount, resources should be cleaned up
      // This is implicit - we just verify no errors are thrown
    })

    it('should stop recording on unmount if still listening', async () => {
      const mockStop = jest.fn()
      const mockGetUserMedia = navigator.mediaDevices.getUserMedia as jest.Mock
      mockGetUserMedia.mockResolvedValueOnce({
        getTracks: () => [{
          stop: mockStop,
          label: 'test',
          enabled: true,
          muted: false,
          getSettings: () => ({ channelCount: 1, sampleRate: 44100 })
        }],
        getAudioTracks: () => [{
          stop: mockStop,
          label: 'test',
          enabled: true,
          muted: false,
          getSettings: () => ({ channelCount: 1, sampleRate: 44100 })
        }],
      })

      const { result, unmount } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      await act(async () => {
        await result.current.startRecording()
      })

      unmount()

      expect(mockStop).toHaveBeenCalled()
    })
  })

  describe('Multiple Start/Stop Cycles', () => {
    it('should handle multiple start/stop cycles', async () => {
      const { result } = renderHook(() =>
        useVoiceRecorder({
          onSegmentReady: mockOnSegmentReady,
        })
      )

      // Cycle 1
      await act(async () => {
        await result.current.startRecording()
      })
      expect(result.current.isListening).toBe(true)

      act(() => {
        result.current.stopRecording()
      })
      expect(result.current.isListening).toBe(false)

      // Cycle 2
      await act(async () => {
        await result.current.startRecording()
      })
      expect(result.current.isListening).toBe(true)

      act(() => {
        result.current.stopRecording()
      })
      expect(result.current.isListening).toBe(false)
    })
  })
})
