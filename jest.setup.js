// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Only mock browser APIs if window is available (jsdom environment)
if (typeof window !== 'undefined') {
  // Avoid jsdom unimplemented scrollTo warnings from animation libs
  if (!window.scrollTo) {
  // @ts-ignore
  window.scrollTo = jest.fn()
  }
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
  }

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  }

  // Mock AudioContext
  global.AudioContext = jest.fn().mockImplementation(() => ({
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
  }))

  // Mock MediaRecorder
  global.MediaRecorder = jest.fn().mockImplementation((stream, options) => ({
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  state: 'inactive',
  stream,
  ondataavailable: null,
  onstop: null,
  onerror: null,
  onstart: null,
  requestData: jest.fn(),
  }))

  // Mock MediaRecorder.isTypeSupported
  MediaRecorder.isTypeSupported = jest.fn(() => true)

  // Mock navigator.mediaDevices
  const createMockTrack = () => ({
  stop: jest.fn(),
  label: 'Mock Audio Track',
  enabled: true,
  muted: false,
  getSettings: jest.fn(() => ({
    channelCount: 1,
    sampleRate: 44100,
  })),
  })

  Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn(() => [createMockTrack()]),
      getAudioTracks: jest.fn(() => [createMockTrack()]),
    }),
  },
  })

  // Mock Audio constructor
  global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  src: '',
  volume: 1,
  }))

  // Mock URL.createObjectURL and revokeObjectURL
  global.URL.createObjectURL = jest.fn(() => 'mock-object-url')
  global.URL.revokeObjectURL = jest.fn()
}

// Mock fetch globally (available in both node and jsdom)
global.fetch = jest.fn()

// Suppress console errors in tests unless needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('not wrapped in act('))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
