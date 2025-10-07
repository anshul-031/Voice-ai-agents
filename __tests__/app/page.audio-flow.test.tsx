import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

describe('Home page audio/text flow branches', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      return Promise.reject(new Error('unhandled fetch: ' + s))
    })
  })

  afterEach(() => {
    ;(global.fetch as jest.Mock).mockReset()
  })

  it('adds error assistant message when LLM returns non-ok for text chat', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: 'Not found' }) })
      }
      return Promise.reject(new Error('unhandled fetch: ' + s))
    })

    render(<Home />)

    // Open text input
    const toggle = await screen.findByTitle('Toggle text chat')
    await userEvent.click(toggle)

    const input = screen.getByPlaceholderText('Type your message here...')
    await userEvent.type(input, 'Test')

    const send = screen.getByTitle('Send message')
    await userEvent.click(send)

    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error processing your message/i)).toBeInTheDocument()
    })
  })

  it('warns and continues when TTS fails after text LLM success', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    ;(global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'Hello' }) })
      }
      if (s.includes('/api/tts')) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'tts fail' }) })
      }
      return Promise.reject(new Error('unhandled fetch: ' + s))
    })

    render(<Home />)

    const toggle = await screen.findByTitle('Toggle text chat')
    await userEvent.click(toggle)

    const input = screen.getByPlaceholderText('Type your message here...')
    await userEvent.type(input, 'Test')

    const send = screen.getByTitle('Send message')
    await userEvent.click(send)

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalled()
    })

    consoleWarn.mockRestore()
  })
})
