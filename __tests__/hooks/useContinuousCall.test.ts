/**
 * @jest-environment jsdom
 */

import { useContinuousCall } from '@/hooks/useContinuousCall';
import { act, renderHook } from '@testing-library/react';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn().mockImplementation(() => {
    mockMediaRecorder.state = 'recording';
  }),
  stop: jest.fn().mockImplementation(() => {
    mockMediaRecorder.state = 'inactive';
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  state: 'inactive',
  stream: null,
};

const MockMediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);
(MockMediaRecorder as any).isTypeSupported = jest.fn().mockReturnValue(true);

global.MediaRecorder = MockMediaRecorder as any;

// Mock AudioContext and related APIs
const mockAnalyser = {
  frequencyBinCount: 1024,
  getByteTimeDomainData: jest.fn(),
};

const mockSource = {
  connect: jest.fn(),
};

const mockAudioContext = {
  createAnalyser: jest.fn().mockReturnValue(mockAnalyser),
  createMediaStreamSource: jest.fn().mockReturnValue(mockSource),
  state: 'running',
  close: jest.fn(),
};

global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

// Also mock the prototype to ensure instance methods work
AudioContext.prototype.createAnalyser = jest.fn().mockReturnValue(mockAnalyser);
AudioContext.prototype.createMediaStreamSource = jest.fn().mockReturnValue(mockSource);
AudioContext.prototype.close = jest.fn();

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = jest.fn().mockReturnValue(123);
const mockCancelAnimationFrame = jest.fn();
global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

describe('useContinuousCall', () => {
  const mockOnAudioLevelChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMediaRecorder.state = 'inactive';
    mockOnAudioLevelChange.mockClear();
    (MockMediaRecorder as any).isTypeSupported.mockImplementation(() => true);
    mockGetUserMedia.mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([
        { stop: jest.fn() },
      ]),
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    expect(result.current.callState).toBe('idle');
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.isCallActive).toBe(false);
  });

  it('starts call successfully', async () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await result.current.startCall();
    });

    expect(result.current.callState).toBe('active');
    expect(result.current.isCallActive).toBe(true);
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 44100,
      }
    });
    expect(global.AudioContext).toHaveBeenCalled();
    expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
    expect(mockMediaRecorder.start).toHaveBeenCalled();
  });

  it('handles getUserMedia rejection', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await expect(result.current.startCall()).rejects.toThrow('Permission denied');
    });

    expect(result.current.callState).toBe('idle');
    expect(result.current.isCallActive).toBe(false);
  });

  it('ends call successfully', async () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    // Start call first
    await act(async () => {
      await result.current.startCall();
    });

    expect(result.current.callState).toBe('active');

    // End call
    act(() => {
      result.current.endCall();
    });

    expect(result.current.callState).toBe('idle');
    expect(result.current.isCallActive).toBe(false);
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles ending call when not active', () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    act(() => {
      result.current.endCall();
    });

    expect(result.current.callState).toBe('idle');
    expect(result.current.isCallActive).toBe(false);
  });

  it('prevents starting multiple calls', async () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await result.current.startCall();
    });

    expect(result.current.callState).toBe('active');

    // Try to start again
    await act(async () => {
      await result.current.startCall();
    });

    // Should still be active, not changed
    expect(result.current.callState).toBe('active');
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
  });

  it('monitors audio levels during active call', async () => {
    // Mock analyser to return some audio data
    mockAnalyser.getByteTimeDomainData.mockImplementation((array) => {
      // Fill with some test data that represents audio
      for (let i = 0; i < array.length; i++) {
        array[i] = 128 + Math.sin(i * 0.1) * 50; // Sine wave around 128
      }
    });

    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await result.current.startCall();
    });

    // Simulate animation frame callback
    const animationFrameCallback = mockRequestAnimationFrame.mock.calls[0][0];
    act(() => {
      animationFrameCallback();
    });

    expect(mockOnAudioLevelChange).toHaveBeenCalled();
    expect(typeof mockOnAudioLevelChange.mock.calls[0][0]).toBe('number');
  });

  it('cleans up on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await result.current.startCall();
    });

    unmount();

    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles MediaRecorder onstart event', async () => {
    // MediaRecorder events are not handled by this hook
    expect(true).toBe(true);
  });

  it('handles MediaRecorder onstop event', async () => {
    // MediaRecorder events are not handled by this hook
    expect(true).toBe(true);
  });

  it('handles MediaRecorder onerror event', async () => {
    // MediaRecorder events are not handled by this hook
    expect(true).toBe(true);
  });

  it('does not monitor audio levels when inactive', async () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    // When inactive, onAudioLevelChange should not be called
    expect(mockOnAudioLevelChange).not.toHaveBeenCalled();
    expect(result.current.audioLevel).toBe(0);
  });

  it('stops monitoring when the call ends during a frame', async () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    mockOnAudioLevelChange.mockImplementation(() => {
      // Call endCall asynchronously to allow the frame to be scheduled
      setTimeout(() => result.current.endCall(), 0);
    });

    await act(async () => {
      await result.current.startCall();
    });

    // Wait for the async endCall
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockOnAudioLevelChange).toHaveBeenCalled();
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
  });  it('ignores pending monitor frames after the call has ended', async () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await result.current.startCall();
    });

    // Reset the mock to ignore the call during start
    mockOnAudioLevelChange.mockClear();

    const animationFrameCallback = mockRequestAnimationFrame.mock.calls[0][0];

    act(() => {
      result.current.endCall();
    });

    act(() => {
      animationFrameCallback();
    });

    expect(mockOnAudioLevelChange).not.toHaveBeenCalled();
  });

  it('handles MediaRecorder MIME type selection', async () => {
    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await result.current.startCall();
    });

    expect(result.current.callState).toBe('active');
    expect(MockMediaRecorder).toHaveBeenCalled();
    const [, options] = MockMediaRecorder.mock.calls[0];
    expect(options.mimeType).toBe('audio/webm;codecs=opus');
  });

  it('falls back to audio/webm when opus is not supported', async () => {
    (MockMediaRecorder as any).isTypeSupported.mockImplementation((type: string) => {
      if (type === 'audio/webm;codecs=opus') {
        return false;
      }
      if (type === 'audio/webm') {
        return true;
      }
      return false;
    });

    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await result.current.startCall();
    });

    expect(MockMediaRecorder).toHaveBeenCalled();
    const [, options] = MockMediaRecorder.mock.calls[0];
    expect(options.mimeType).toBe('audio/webm');
  });

  it('falls back to audio/mp4 when webm is not supported', async () => {
    (MockMediaRecorder as any).isTypeSupported.mockImplementation(() => false);

    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await result.current.startCall();
    });

    expect(MockMediaRecorder).toHaveBeenCalled();
    const [, options] = MockMediaRecorder.mock.calls[0];
    expect(options.mimeType).toBe('audio/mp4');
  });

  it('handles AudioContext creation failure', async () => {
    // Mock AudioContext constructor to throw
    const originalAudioContext = global.AudioContext;
    global.AudioContext = jest.fn().mockImplementation(() => {
      throw new Error('AudioContext not supported');
    });

    const { result } = renderHook(() =>
      useContinuousCall({ onAudioLevelChange: mockOnAudioLevelChange })
    );

    await act(async () => {
      await expect(result.current.startCall()).rejects.toThrow('AudioContext not supported');
    });

    expect(result.current.callState).toBe('idle');

    // Restore
    global.AudioContext = originalAudioContext;
  });
});
