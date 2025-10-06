import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render function that includes common providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options })
}

export * from '@testing-library/react'
export { customRender as render }

// Helper to create mock messages
export const createMockMessage = (overrides = {}) => ({
  id: '1',
  text: 'Test message',
  source: 'user' as const,
  timestamp: new Date('2024-01-01T12:00:00Z'),
  ...overrides,
})

// Helper to create mock model config
export const createMockModelConfig = (overrides = {}) => ({
  llmModel: 'Gemini 1.5 Flash',
  sttModel: 'AssemblyAI Universal',
  ttsModel: 'Deepgram Aura Luna',
  ...overrides,
})

// Mock fetch response helper
export const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    arrayBuffer: async () => new ArrayBuffer(0),
  } as Response)
}

// Mock fetch with error
export const mockFetchError = (message: string) => {
  return Promise.reject(new Error(message))
}

// Wait for async updates
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Create mock audio blob
export const createMockAudioBlob = () => {
  return new Blob(['mock audio data'], { type: 'audio/webm' })
}

// Mock FormData
export const createMockFormData = (data: Record<string, any> = {}) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}
