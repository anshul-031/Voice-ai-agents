import WhatsAppNumbersTable from '@/components/WhatsAppNumbersTable';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

describe('WhatsAppNumbersTable', () => {
  const originalFetch = global.fetch;
  const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  const mockFetch = (payload: unknown, ok = true) => {
    const response = {
      ok,
      json: async () => payload,
    } as Response;
    return Promise.resolve(response);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch' as any).mockImplementation(() => mockFetch({ whatsappNumbers: [] }));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    global.fetch = originalFetch;

    if (clipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    } else {
      delete (navigator as unknown as { clipboard?: unknown }).clipboard;
    }

    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('renders empty state when no WhatsApp numbers exist', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => mockFetch({ whatsappNumbers: [] }));

    render(<WhatsAppNumbersTable onAddWhatsApp={jest.fn()} onEditWhatsApp={jest.fn()} />);

    expect(await screen.findByText('No WhatsApp numbers yet')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/whatsapp-numbers?userId=mukul');
  });

  it('converts relative webhook URLs to absolute values and supports refresh + copy', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://deploy.example';

    const firstDataset = {
      whatsappNumbers: [
        {
          id: 'wh-1',
          phoneNumber: '+1 234 567 890',
          phoneNumberId: 'meta-123',
          displayName: 'Primary Line',
          linkedAgentId: 'agent-1',
          webhookUrl: '/api/meta-webhook/wh-1',
          status: 'active',
          lastInteractionAt: '2024-01-10T10:00:00.000Z',
          settings: { isMock: true },
          metaConfig: {
            appId: 'app-x',
            appSecret: 'secret-x',
            businessId: 'biz-x',
            accessToken: 'token-x',
            graphApiVersion: 'v19.0',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'wh-2',
          phoneNumber: '+1 987 654 321',
          webhookUrl: 'https://external.example/hook',
          status: 'inactive',
          settings: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    const secondDataset = {
      whatsappNumbers: [],
    };

    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementationOnce(() => mockFetch(firstDataset));
    fetchMock.mockImplementationOnce(() => mockFetch(secondDataset));

    const onAddWhatsApp = jest.fn();
    const onEditWhatsApp = jest.fn();

    render(<WhatsAppNumbersTable onAddWhatsApp={onAddWhatsApp} onEditWhatsApp={onEditWhatsApp} />);

    expect(await screen.findByText('Primary Line')).toBeInTheDocument();
    expect(screen.getByText('Mock')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
    expect(screen.getByText('meta-123')).toBeInTheDocument();
    expect(screen.getByText('app-x')).toBeInTheDocument();
    expect(screen.getByText('biz-x')).toBeInTheDocument();

    const webhookDisplay = screen.getAllByText(/Webhook URL/i)[0];
    expect(webhookDisplay).toBeInTheDocument();

    const webhookCode = screen.getByText('http://localhost/api/meta-webhook/wh-1');
    expect(webhookCode).toBeInTheDocument();

    const copyButtons = screen.getAllByRole('button', { name: /Copy|Copied!/ });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost/api/meta-webhook/wh-1');
      expect(copyButtons[0].textContent).toMatch(/Copied!/);
    });

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    expect(onEditWhatsApp).toHaveBeenCalledWith(expect.objectContaining({ id: 'wh-1' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add WhatsApp Number' }));
    expect(onAddWhatsApp).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('logs an error when initial fetch fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: async () => ({}) } as Response),
    );

    render(<WhatsAppNumbersTable onAddWhatsApp={jest.fn()} onEditWhatsApp={jest.fn()} />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Failed to fetch WhatsApp numbers');
    });
  });

  it('does not attempt deletion when confirmation is cancelled', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    const dataset = {
      whatsappNumbers: [
        {
          id: 'wh-1',
          phoneNumber: '+1 111 111 111',
          status: 'active',
          settings: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementationOnce(() => mockFetch(dataset));

    render(<WhatsAppNumbersTable onAddWhatsApp={jest.fn()} onEditWhatsApp={jest.fn()} />);

    const deleteButton = await screen.findByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    const deleteCall = (fetchMock.mock.calls as Array<[RequestInfo | URL, RequestInit | undefined]>).find(([, init]) => init?.method === 'DELETE');
    expect(deleteCall).toBeUndefined();
  });

  it('alerts when deletion fails', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);

    const dataset = {
      whatsappNumbers: [
        {
          id: 'wh-2',
          phoneNumber: '+1 222 222 222',
          status: 'inactive',
          settings: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementationOnce(() => mockFetch(dataset));
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: async () => ({}) } as Response),
    );

    render(<WhatsAppNumbersTable onAddWhatsApp={jest.fn()} onEditWhatsApp={jest.fn()} />);

    const deleteButton = await screen.findByTitle('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete WhatsApp number');
    });
  });

  it('refreshes data after successful deletion', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const initialDataset = {
      whatsappNumbers: [
        {
          id: 'wh-3',
          phoneNumber: '+1 333 333 333',
          status: 'active',
          settings: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementationOnce(() => mockFetch(initialDataset));
    fetchMock.mockImplementationOnce(() => Promise.resolve({ ok: true } as Response));
    fetchMock.mockImplementationOnce(() => mockFetch({ whatsappNumbers: [] }));

    render(<WhatsAppNumbersTable onAddWhatsApp={jest.fn()} onEditWhatsApp={jest.fn()} />);

    const deleteButton = await screen.findByTitle('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const deleteCall = (fetchMock.mock.calls as Array<[RequestInfo | URL, RequestInit | undefined]>).find(([, init]) => init?.method === 'DELETE');
      expect(deleteCall).toBeDefined();
      expect(screen.queryByText('+1 333 333 333')).not.toBeInTheDocument();
      expect(screen.getByText('No WhatsApp numbers yet')).toBeInTheDocument();
    });
  });
});
