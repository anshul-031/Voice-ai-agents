import ChatHistory from '@/components/ChatHistory'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('ChatHistory', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [{ sessionId: 's1', userId: 'u', messageCount: 1, firstMessage: 'hi', lastMessage: 'bye', lastTimestamp: new Date().toISOString(), firstTimestamp: new Date().toISOString() }] }) })
      }
      if (s.includes('/api/chat/history')) {
        return Promise.resolve({ ok: true, json: async () => ({ chats: [{ id: 'm1', role: 'assistant', content: 'Hello', timestamp: new Date().toISOString() }] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  it('renders list and opens a session', async () => {
    render(<ChatHistory isOpen={true} onClose={() => {}} />)

    // Wait sessions render
    const item = await screen.findByText(/Session s1/i)
    expect(item).toBeInTheDocument()

    // open details
    await userEvent.click(item)

    await waitFor(() => {
      expect(screen.getByText(/Session Details/i)).toBeInTheDocument()
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })

  it('closes when close button clicked', async () => {
    const onClose = jest.fn()
    render(<ChatHistory isOpen={true} onClose={onClose} />)

    // click header close button
    const closeBtn = await screen.findByTitle('Close')
    await userEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
