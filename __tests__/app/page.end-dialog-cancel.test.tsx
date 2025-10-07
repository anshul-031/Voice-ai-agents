import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

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

  it('opens end dialog and cancels it', async () => {
    render(<Home />)

    // Add a message first so the End button appears
    const toggle = await screen.findByTitle('Toggle text chat')
    await userEvent.click(toggle)
    const input = await screen.findByPlaceholderText('Type your message here...')
    await userEvent.type(input, 'Hi')
    await userEvent.click(screen.getByTitle('Send message'))

    // Open end dialog
    await userEvent.click(await screen.findByText('End'))

    // Cancel it
    const cancelBtn = await screen.findByText('Cancel')
    await userEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText('End Conversation')).not.toBeInTheDocument()
    })
  })
})
