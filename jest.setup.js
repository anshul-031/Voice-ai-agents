// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Only mock browser APIs if window is available (jsdom environment)
if (typeof window !== 'undefined') {
  // Avoid jsdom unimplemented scrollTo warnings from animation libs
  // Always mock to a no-op to reduce noise
  // @ts-ignore
  window.scrollTo = jest.fn()
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      // Prefer reduced motion to reduce animation work in tests
      matches: query.includes('prefers-reduced-motion') ? true : false,
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

  // Mock HTMLCanvasElement.getContext for canvas-based components
  HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
    if (contextType === '2d') {
      return {
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        fillText: jest.fn(),
        strokeText: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
        getImageData: jest.fn(() => ({ data: [] })),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => ({ data: [] })),
        setTransform: jest.fn(),
        resetTransform: jest.fn(),
        transform: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        quadraticCurveTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        arc: jest.fn(),
        arcTo: jest.fn(),
        rect: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        clip: jest.fn(),
        isPointInPath: jest.fn(() => false),
        isPointInStroke: jest.fn(() => false),
        createLinearGradient: jest.fn(() => ({
          addColorStop: jest.fn(),
        })),
        createRadialGradient: jest.fn(() => ({
          addColorStop: jest.fn(),
        })),
        createPattern: jest.fn(() => ({})),
        getLineDash: jest.fn(() => []),
        setLineDash: jest.fn(),
        // Properties
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        miterLimit: 10,
        shadowBlur: 0,
        shadowColor: 'rgba(0, 0, 0, 0)',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
      };
    }
    return null;
  });

  // Mock canvas dimensions
  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    writable: true,
    value: 300,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    writable: true,
    value: 150,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
    writable: true,
    value: jest.fn(() => ({
      width: 300,
      height: 150,
      top: 0,
      left: 0,
      right: 300,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON: () => {},
    })),
  });

  // Mock AudioContext
  global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
  createAnalyser: jest.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn((arr) => {
      // Fill with midline values to simulate silence
      if (arr && arr.length) {
        for (let i = 0; i < arr.length; i++) arr[i] = 128
      }
    }),
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

  // Polyfill requestAnimationFrame/cancelAnimationFrame to avoid open handles
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16)
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id) => clearTimeout(id)
  }
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
        args[0].includes('not wrapped in act(') ||
        args[0].includes('In HTML, <html> cannot be a child of <div>.'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
