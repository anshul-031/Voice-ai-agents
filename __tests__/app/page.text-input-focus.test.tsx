import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

describe('Home page - text input focus on toggle', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      return Promise.reject(new Error('unhandled url: ' + s))
    })
  })

  afterEach(() => {
  })

  it('focuses text input shortly after toggling on', async () => {
    render(<Home />)

    const toggle = await screen.findByTitle('Toggle text chat')
    await userEvent.click(toggle)

    // wait for the 100ms timer inside toggleTextInput to fire and focus
    await new Promise(res => setTimeout(res, 150))

    const input = screen.getByPlaceholderText('Type your message here...') as HTMLInputElement
    await waitFor(() => {
      expect(input).toHaveFocus()
    })
  })
})
