import Home from '@/app/page'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Home page - end conversation cancel path', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'Some reply' }) })
      }
      return Promise.reject(new Error('unhandled url: ' + s))
    })
  })

  it('clears messages when clear button clicked', async () => {
    // Mock TTS as well
    (global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'Some reply' }) })
      }
      if (s.includes('/api/tts')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ audioData: 'base64audio' }) })
      }
      return Promise.reject(new Error('unhandled url: ' + s))
    })

    render(<Home />)

    // Add a message first
    const toggle = await screen.findByTitle('Text chat mode')
    await userEvent.click(toggle)
    const input = await screen.findByPlaceholderText('Type your message...')
    await userEvent.type(input, 'Hi')
    await userEvent.click(screen.getByTitle('Send message'))

    // Wait for message to appear
    await waitFor(() => {
      expect(screen.getByText('Hi')).toBeInTheDocument()
    })

    // Click clear button (no dialog, directly clears)
    const clearBtn = await screen.findByTitle('Clear chat messages')
    await userEvent.click(clearBtn)

    // Message should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Hi')).not.toBeInTheDocument()
    })
  })
})
