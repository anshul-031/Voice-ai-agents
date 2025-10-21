import WhatsAppNumberModal from '@/components/WhatsAppNumberModal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

describe('WhatsAppNumberModal', () => {
  const response = (body: unknown, ok = true) => ({
    ok,
    json: async () => body,
  }) as Response;

  const setupFetchMock = (
    implementations: Array<(...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>>,
  ): jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>> => {
    const fetchMock = jest.spyOn(globalThis, 'fetch') as jest.SpyInstance<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >;
    implementations.forEach((impl) => fetchMock.mockImplementationOnce(impl));
    return fetchMock;
  };

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('returns null when the modal is closed', () => {
    const { container } = render(
      <WhatsAppNumberModal isOpen={false} onClose={jest.fn()} onSuccess={jest.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('submits a new WhatsApp number with meta credentials', async () => {
    const fetchMock = setupFetchMock([
      () => Promise.resolve(response({ agents: [{ id: 'agent-1', title: 'Agent One' }] })),
      (_, init) => Promise.resolve(response({}, true)),
    ]);

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    render(
      <WhatsAppNumberModal isOpen onClose={onClose} onSuccess={onSuccess} />,
    );

  await screen.findByRole('option', { name: 'Agent One' });

  fireEvent.change(screen.getByPlaceholderText('+91-98730 16484'), { target: { value: '+1 234 567 890' } });
  fireEvent.change(screen.getByPlaceholderText('e.g., Support WhatsApp'), { target: { value: 'Support Line' } });
  fireEvent.change(screen.getByPlaceholderText('Enter WhatsApp Phone Number ID'), { target: { value: 'meta-42' } });

  const agentSelect = screen.getByRole('option', { name: '-- No Agent Linked --' }).parentElement as HTMLSelectElement;
  fireEvent.change(agentSelect, { target: { value: 'agent-1' } });

  fireEvent.change(screen.getByPlaceholderText('Meta App ID'), { target: { value: 'app-id' } });
  fireEvent.change(screen.getByPlaceholderText('Meta App Secret'), { target: { value: 'app-secret' } });
  fireEvent.change(screen.getByPlaceholderText('Meta Business ID'), { target: { value: 'biz-id' } });
  fireEvent.change(screen.getByPlaceholderText('Meta Access Token'), { target: { value: 'token-xyz' } });
  fireEvent.change(screen.getByPlaceholderText('v20.0'), { target: { value: 'v99.0' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add WhatsApp Number' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [, requestInit] = fetchMock.mock.calls[1];
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.headers).toEqual({ 'Content-Type': 'application/json' });

    const payload = JSON.parse((requestInit?.body as string) ?? '{}');
    expect(payload).toEqual({
      phoneNumber: '+1 234 567 890',
      displayName: 'Support Line',
      phoneNumberId: 'meta-42',
      linkedAgentId: 'agent-1',
      status: 'active',
      metaConfig: {
        appId: 'app-id',
        appSecret: 'app-secret',
        businessId: 'biz-id',
        accessToken: 'token-xyz',
        graphApiVersion: 'v99.0',
      },
    });
  });

  it('updates an existing WhatsApp number without meta config when unchanged', async () => {
    const fetchMock = setupFetchMock([
      () => Promise.resolve(response({ agents: [{ id: 'agent-x', title: 'Agent X' }] })),
      (_, init) => Promise.resolve(response({}, true)),
    ]);

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    render(
      <WhatsAppNumberModal
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        whatsAppNumber={{
          id: 'wh-1',
          phoneNumber: '+44 1234 567890',
          displayName: 'Primary Line',
          phoneNumberId: 'phone-123',
          linkedAgentId: 'agent-x',
          status: 'inactive',
          metaConfig: { graphApiVersion: 'v20.0' },
        }}
      />,
    );

  await screen.findByRole('option', { name: 'Agent X' });

  fireEvent.change(screen.getByPlaceholderText('e.g., Support WhatsApp'), { target: { value: 'Primary Line Updated' } });
  fireEvent.change(screen.getByPlaceholderText('v20.0'), { target: { value: '' } });

  const agentSelect = screen.getByRole('option', { name: '-- No Agent Linked --' }).parentElement as HTMLSelectElement;
  fireEvent.change(agentSelect, { target: { value: '' } });

  const statusSelect = screen.getByRole('option', { name: 'Active' }).parentElement as HTMLSelectElement;
  fireEvent.change(statusSelect, { target: { value: 'active' } });

    fireEvent.click(screen.getByRole('button', { name: 'Update WhatsApp Number' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    const updateCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(updateCall).toBeDefined();

    const [, requestInit] = updateCall as [RequestInfo | URL, RequestInit];

    const payload = JSON.parse((requestInit?.body as string) ?? '{}');
    expect(payload).toEqual({
      id: 'wh-1',
      phoneNumber: '+44 1234 567890',
      displayName: 'Primary Line Updated',
      phoneNumberId: 'phone-123',
      linkedAgentId: undefined,
      status: 'active',
    });
  });
});
