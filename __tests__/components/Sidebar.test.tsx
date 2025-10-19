import Sidebar from '@/components/Sidebar';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';

describe('Sidebar component', () => {

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  type SidebarProps = ComponentProps<typeof Sidebar>;

  const renderSidebar = (overrides: Partial<SidebarProps> = {}) => {
    const defaultProps: SidebarProps = {
      isOpen: true,
      onToggle: jest.fn(),
      onSelectAgent: jest.fn(),
      onViewSession: jest.fn(),
    };

    return render(<Sidebar {...defaultProps} {...overrides} />);
  };

  test('loads call sessions and forwards selection', async () => {
  const sessionNow = new Date().toISOString();
  const session30MinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const session3DaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sessions: [
              {
                sessionId: 's-1',
                userId: 'u-1',
                messageCount: 3,
                firstMessage: 'First session message',
                lastMessage: 'Last message',
                lastTimestamp: sessionNow,
                firstTimestamp: sessionNow,
              },
              {
                sessionId: 's-2',
                userId: 'u-1',
                messageCount: 6,
                firstMessage: 'Second session message',
                lastMessage: 'Last message 2',
                lastTimestamp: session30MinutesAgo,
                firstTimestamp: session30MinutesAgo,
              },
              {
                sessionId: 's-3',
                userId: 'u-1',
                messageCount: 2,
                firstMessage: 'Third session message',
                lastMessage: 'Last message 3',
                lastTimestamp: session3DaysAgo,
                firstTimestamp: session3DaysAgo,
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });

    const onViewSession = jest.fn();
    renderSidebar({ onViewSession });

    await waitFor(() => expect(screen.getByText(/First session message/)).toBeInTheDocument());
    expect(screen.getByText(/3 messages/)).toBeInTheDocument();
  expect(screen.getByText('30m ago')).toBeInTheDocument();
  expect(screen.getByText('3d ago')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/First session message/));

    expect(onViewSession).toHaveBeenCalledWith('s-1');
  });

  test('switches to voice agents tab and creates a new agent', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    const responses: Record<string, any> = {
      sessions: {
        ok: true,
        json: async () => ({ sessions: [] }),
      },
      agents: {
        ok: true,
        json: async () => ({ agents: [] }),
      },
      create: {
        ok: true,
        json: async () => ({}),
      },
    };

    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve(responses.sessions);
      }
      if (url.includes('/api/voice-agents') && (!options || options.method === 'GET')) {
        return Promise.resolve(responses.agents);
      }
      if (url.includes('/api/voice-agents') && options?.method === 'POST') {
        return Promise.resolve(responses.create);
      }
      if (url.includes('/api/voice-agents') && options?.method === 'GET') {
        return Promise.resolve(responses.agents);
      }
      return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });

    renderSidebar();

    await waitFor(() => expect(screen.getByText(/call log/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /agents/i }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) => typeof url === 'string' && url.includes('/api/voice-agents?userId='))
      ).toBe(true)
    );

    await waitFor(() => expect(screen.getByText(/new agent/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/new agent/i));

    // Attempt submission with empty fields triggers alert path
    fireEvent.click(screen.getByText(/create/i));
    expect(window.alert).toHaveBeenCalled();
    (window.alert as jest.Mock).mockClear();

    fireEvent.change(screen.getByPlaceholderText(/agent title/i), { target: { value: 'Agent A' } });
    fireEvent.change(screen.getByPlaceholderText(/system prompt/i), { target: { value: 'Prompt text' } });

    fireEvent.click(screen.getByText(/create/i));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/voice-agents'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    await waitFor(() => expect(screen.getByText(/new agent/i)).toBeInTheDocument());
  });

  test('edits and deletes an existing agent', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const agentsPayload = {
      ok: true,
      json: async () => ({
        agents: [
          {
            id: 'agent-1',
            userId: 'u-1',
            title: 'Sales Bot',
            prompt: 'Sell things',
            lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          },
          {
            id: 'agent-legacy',
            userId: 'u-1',
            title: 'Legacy Bot',
            prompt: 'Legacy prompt',
            lastUpdated: tenDaysAgo.toISOString(),
            createdAt: tenDaysAgo.toISOString(),
          },
        ],
      }),
    };

    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [] }) });
      }
      if (url.includes('/api/voice-agents') && (!options || options.method === 'GET')) {
        return Promise.resolve(agentsPayload);
      }
      if (url.includes('/api/voice-agents') && options?.method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (url.includes('/api/voice-agents') && options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });

    renderSidebar();

    await waitFor(() => expect(screen.getByText(/call log/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /agents/i }));

  await waitFor(() => expect(screen.getByText(/sales bot/i)).toBeInTheDocument());
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  expect(screen.getByText(tenDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))).toBeInTheDocument();

  const [firstEditButton] = screen.getAllByTitle(/edit/i);
  fireEvent.click(firstEditButton);
    await waitFor(() => expect(screen.getByDisplayValue('Sales Bot')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/agent title/i), { target: { value: 'Support Bot' } });
    fireEvent.change(screen.getByPlaceholderText(/system prompt/i), { target: { value: 'Assist users' } });
    fireEvent.click(screen.getByText(/update/i));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/voice-agents'),
      expect.objectContaining({ method: 'PUT' }),
    ));

  const [firstDeleteButton] = screen.getAllByTitle(/delete/i);
  fireEvent.click(firstDeleteButton);
    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/voice-agents?id=agent-1'),
      expect.objectContaining({ method: 'DELETE' }),
    ));
  });

  test('shows error state when session fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'failed' }),
    });

    renderSidebar();

    await waitFor(() => expect(screen.getByText(/failed to fetch sessions/i)).toBeInTheDocument());
  });

  test('cancels delete when confirmation is dismissed', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [] }) });
      }
      if (url.includes('/api/voice-agents') && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            agents: [
              {
                id: 'agent-1',
                userId: 'u-1',
                title: 'Sales Bot',
                prompt: 'Sell things',
                lastUpdated: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      }
  if (url.includes('/api/voice-agents') && options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderSidebar();

    await waitFor(() => expect(screen.getByText(/call log/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /agents/i }));

    await waitFor(() => expect(screen.getByText(/sales bot/i)).toBeInTheDocument());

    fireEvent.click(screen.getByTitle(/delete/i));

    expect(confirmSpy).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/voice-agents?id=agent-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );

    confirmSpy.mockRestore();
  });

  test('shows error state when agent fetch fails', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [] }) });
      }
      if (url.includes('/api/voice-agents') && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });

    renderSidebar();

    await waitFor(() => expect(screen.getByRole('button', { name: /agents/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /agents/i }));

    await waitFor(() => expect(screen.getByText(/failed to fetch agents/i)).toBeInTheDocument());
  });

  test('alerts when creating agent request fails', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [] }) });
      }
      if (url.includes('/api/voice-agents') && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: async () => ({ agents: [] }) });
      }
  if (url.includes('/api/voice-agents') && options?.method === 'POST') {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });

    renderSidebar();

    await waitFor(() => expect(screen.getByRole('button', { name: /agents/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /agents/i }));

    await waitFor(() => expect(screen.getByText(/new agent/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/new agent/i));

    fireEvent.change(screen.getByPlaceholderText(/agent title/i), { target: { value: 'Agent B' } });
    fireEvent.change(screen.getByPlaceholderText(/system prompt/i), { target: { value: 'Prompt B' } });

    fireEvent.click(screen.getByText(/create/i));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to create voice agent'));
  });

  test('alerts when deleting agent request fails', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [] }) });
      }
      if (url.includes('/api/voice-agents') && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            agents: [
              {
                id: 'agent-err',
                userId: 'u-1',
                title: 'Error Bot',
                prompt: 'Handle errors',
                lastUpdated: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      }
  if (url.includes('/api/voice-agents') && options?.method === 'DELETE') {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });

    renderSidebar();

    await waitFor(() => expect(screen.getByRole('button', { name: /agents/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /agents/i }));

    await waitFor(() => expect(screen.getByText(/error bot/i)).toBeInTheDocument());
    fireEvent.click(screen.getByTitle(/delete/i));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to delete voice agent'));
  });
});
