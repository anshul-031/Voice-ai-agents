// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Ensure minimal web API polyfills exist even when not running in jsdom (e.g.,
// during coverage or when a test opts into the node environment). next/server
// may reference Request/Response/Headers/URL at module init time.
if (typeof global.Request === 'undefined') {
  // Very small stub sufficient for next/server import time; tests mock NextResponse.
  global.Request = class Request {
    constructor(input, init) { this.input = input; this.init = init }
  }
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) { this.body = body; this.init = init }
    static json(data, init) { return { json: async () => data, status: (init && init.status) || 200 } }
  }
}
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers { constructor(init) { this.init = init } }
}
if (typeof global.URL === 'undefined') {
  // Basic URL shim; many tests pass simple absolute URLs only
  global.URL = require('url').URL
}

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

// Global mocks to isolate DB in unit tests (Next server APIs are mocked via moduleNameMapper)

// Provide DB mocks under common import patterns so accidental real imports don't load mongoose
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  clearMongoConnection: jest.fn().mockResolvedValue(undefined),
}))

// Globally mock next/server to avoid Node Request/Response issues when routes import it during coverage
jest.mock('next/server', () => {
  const NextResponse = {
    json: (body, init) => ({ status: (init && init.status) || 200, json: async () => body }),
  }
  class NextRequest {
    constructor(url, init = {}) {
      this.url = url
      this._body = init.body
      this.method = init.method || 'GET'
    }
    async json() {
      if (this._body == null) return {}
      if (typeof this._body === 'object') return this._body
      try { return JSON.parse(this._body) } catch { return {} }
    }
    async formData() { return this._body }
  }
  return { NextResponse, NextRequest }
})
jest.mock('next/server.js', () => {
  const NextResponse = {
    json: (body, init) => ({ status: (init && init.status) || 200, json: async () => body }),
  }
  class NextRequest {
    constructor(url, init = {}) {
      this.url = url
      this._body = init.body
      this.method = init.method || 'GET'
    }
    async json() {
      if (this._body == null) return {}
      if (typeof this._body === 'object') return this._body
      try { return JSON.parse(this._body) } catch { return {} }
    }
    async formData() { return this._body }
  }
  return { NextResponse, NextRequest }
})
jest.mock('lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  clearMongoConnection: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('lib/mongodb.ts', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  clearMongoConnection: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('./lib/mongodb.ts', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  clearMongoConnection: jest.fn().mockResolvedValue(undefined),
}))

// Polyfill Request/Response/Headers in jsdom environment if missing (needed by next/server)
if (typeof window !== 'undefined') {
  if (typeof global.Request === 'undefined' && typeof window.Request !== 'undefined') {
    global.Request = window.Request
  }
  if (typeof global.Response === 'undefined' && typeof window.Response !== 'undefined') {
    global.Response = window.Response
  }
  if (typeof global.Headers === 'undefined' && typeof window.Headers !== 'undefined') {
    global.Headers = window.Headers
  }
  if (typeof global.URL === 'undefined' && typeof window.URL !== 'undefined') {
    // @ts-ignore
    global.URL = window.URL
  }
}

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
