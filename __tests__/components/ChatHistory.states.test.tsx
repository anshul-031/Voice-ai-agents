import ChatHistory from '@/components/ChatHistory'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('ChatHistory additional scenarios', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    if (originalFetch) {
      global.fetch = originalFetch
    } else {
      delete (global as any).fetch
    }
  })

  it('returns null when the modal is closed', () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as any

    const { container } = render(<ChatHistory isOpen={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows empty state when no sessions are available', async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ chats: [] }) })
    }) as any

    render(<ChatHistory isOpen={true} onClose={() => {}} />)

    expect(await screen.findByText(/No chat history yet/i)).toBeInTheDocument()
    expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument()
  })

  it('handles session fetch errors and allows retry', async () => {
    const fetchMock = jest.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: false, json: async () => ({}) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ chats: [] }) })
    })
    global.fetch = fetchMock as any

    render(<ChatHistory isOpen={true} onClose={() => {}} />)

    expect(await screen.findByText(/Error loading chat history/i)).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /retry/i })
    await userEvent.click(retryButton)

    const sessionCalls = fetchMock.mock.calls.filter(([req]) => String(req).includes('/api/chat/sessions'))
    expect(sessionCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('renders details when initialSessionId is provided and supports navigation back to list', async () => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60000)
    const oneHourAgo = new Date(Date.now() - 60 * 60000)

    const sessionsResponse = {
      sessions: [
        {
          sessionId: 'session-initial',
          userId: 'mukul',
          messageCount: 3,
          firstMessage: 'Hello there',
          lastMessage: 'See you soon',
          lastTimestamp: fifteenMinutesAgo.toISOString(),
          firstTimestamp: oneHourAgo.toISOString(),
        },
      ],
    }

    const historyResponse = {
      chats: [
        { id: 'a', role: 'assistant', content: 'Greetings!', timestamp: new Date(Date.now() - 14 * 60000).toISOString() },
        { id: 'b', role: 'user', content: 'Hello!', timestamp: new Date(Date.now() - 13 * 60000).toISOString() },
      ],
    }

    const fetchMock = jest.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => sessionsResponse })
      }
      if (url.includes('/api/chat/history')) {
        return Promise.resolve({ ok: true, json: async () => historyResponse })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchMock as any

    render(<ChatHistory isOpen={true} initialSessionId="session-initial" onClose={() => {}} />)

    expect(await screen.findByText(/Session Details/i)).toBeInTheDocument()
    expect(await screen.findByText(/Greetings!/i)).toBeInTheDocument()
    expect(await screen.findByText(/Hello!/i)).toBeInTheDocument()

    const backButton = await screen.findByTitle(/Back to sessions/i)
    await userEvent.click(backButton)

    expect(await screen.findByText(/Chat History/i)).toBeInTheDocument()
    expect(screen.getByText(/Select a session/i)).toBeInTheDocument()
  })

  it('formats session timestamps across relative ranges', async () => {
    const now = new Date()
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600000)
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)
    const older = new Date(now)
    older.setFullYear(now.getFullYear() - 1)

    const olderLabel = older.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: older.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })

    const sessionsResponse = {
      sessions: [
        {
          sessionId: 'just-now',
          userId: 'mukul',
          messageCount: 1,
          firstMessage: 'Immediate',
          lastMessage: 'Immediate',
          lastTimestamp: now.toISOString(),
          firstTimestamp: now.toISOString(),
        },
        {
          sessionId: 'minutes-ago',
          userId: 'mukul',
          messageCount: 2,
          firstMessage: 'Few minutes ago',
          lastMessage: 'Few minutes ago',
          lastTimestamp: tenMinutesAgo.toISOString(),
          firstTimestamp: now.toISOString(),
        },
        {
          sessionId: 'hours-ago',
          userId: 'mukul',
          messageCount: 2,
          firstMessage: 'Hours ago',
          lastMessage: 'Hours ago',
          lastTimestamp: twoHoursAgo.toISOString(),
          firstTimestamp: now.toISOString(),
        },
        {
          sessionId: 'days-ago',
          userId: 'mukul',
          messageCount: 2,
          firstMessage: 'Days ago',
          lastMessage: 'Days ago',
          lastTimestamp: threeDaysAgo.toISOString(),
          firstTimestamp: now.toISOString(),
        },
        {
          sessionId: 'older',
          userId: 'mukul',
          messageCount: 2,
          firstMessage: 'Older',
          lastMessage: 'Older',
          lastTimestamp: older.toISOString(),
          firstTimestamp: older.toISOString(),
        },
      ],
    }

    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => sessionsResponse })
      }
      return Promise.resolve({ ok: true, json: async () => ({ chats: [] }) })
    }) as any

    render(<ChatHistory isOpen={true} onClose={() => {}} />)

    expect(await screen.findByText(/Just now/i)).toBeInTheDocument()
    expect(screen.getByText(/10 min ago/i)).toBeInTheDocument()
    expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument()
    expect(screen.getByText(/3 days ago/i)).toBeInTheDocument()
    expect(screen.getByText(olderLabel)).toBeInTheDocument()
  })

  it('surfaces errors from session message fetches', async () => {
    const sessionsResponse = {
      sessions: [
        {
          sessionId: 's-err',
          userId: 'mukul',
          messageCount: 1,
          firstMessage: 'Hi',
          lastMessage: 'Bye',
          lastTimestamp: new Date().toISOString(),
          firstTimestamp: new Date().toISOString(),
        },
      ],
    }

    const fetchMock = jest.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => sessionsResponse })
      }
      if (url.includes('/api/chat/history')) {
        return Promise.resolve({ ok: false, json: async () => ({}) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchMock as any

    render(<ChatHistory isOpen={true} onClose={() => {}} />)

    const sessionCard = await screen.findByText(/Session s-err/i)
    await userEvent.click(sessionCard)

    expect(await screen.findByText(/Error loading chat history/i)).toBeInTheDocument()
    expect(screen.getByText(/Failed to fetch session messages/i)).toBeInTheDocument()
  })
})
