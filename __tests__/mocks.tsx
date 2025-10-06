// Mock implementations for testing

export const mockMediaStream = () => ({
  getTracks: jest.fn(() => [
    {
      stop: jest.fn(),
      label: 'Mock Audio Track',
      enabled: true,
      muted: false,
      getSettings: jest.fn(() => ({
        channelCount: 1,
        sampleRate: 44100,
      })),
    },
  ]),
  getAudioTracks: jest.fn(() => [
    {
      stop: jest.fn(),
      label: 'Mock Audio Track',
      enabled: true,
      muted: false,
      getSettings: jest.fn(() => ({
        channelCount: 1,
        sampleRate: 44100,
      })),
    },
  ]),
})

export const mockMediaRecorder = () => {
  const recorder = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    state: 'inactive',
    ondataavailable: null as ((event: any) => void) | null,
    onstop: null as (() => void) | null,
    onerror: null as ((event: any) => void) | null,
    onstart: null as (() => void) | null,
    requestData: jest.fn(),
  }
  return recorder
}

export const mockAudioContext = () => ({
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
  createAnalyser: jest.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    connect: jest.fn(),
  })),
  close: jest.fn(),
  state: 'running',
})

export const mockAnalyserNode = (audioLevel = 0.5) => ({
  fftSize: 2048,
  frequencyBinCount: 1024,
  getByteFrequencyData: jest.fn((dataArray: Uint8Array) => {
    // Simulate audio levels
    for (let i = 0; i < dataArray.length; i++) {
      dataArray[i] = Math.floor(audioLevel * 255)
    }
  }),
  connect: jest.fn(),
})

// Mock framer-motion
export const mockFramerMotion = {
  motion: {
    div: 'div',
    button: 'button',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}

// Mock lucide-react icons
export const mockLucideIcons = {
  Mic: () => <div data-testid="mic-icon">Mic</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Bot: () => <div data-testid="bot-icon">Bot</div>,
  AlertTriangle: () => <div data-testid="alert-icon">AlertTriangle</div>,
  RotateCcw: () => <div data-testid="rotate-icon">RotateCcw</div>,
  X: () => <div data-testid="x-icon">X</div>,
}
