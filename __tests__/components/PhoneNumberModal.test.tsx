/**
 * @jest-environment jsdom
 */

import PhoneNumberModal from '@/components/PhoneNumberModal';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const originalFetch = global.fetch;
const originalAlert = window.alert;

const createResponse = <T,>(data: T, ok = true): Response => ({
  ok,
  json: jest.fn().mockResolvedValue(data),
} as unknown as Response);

const fillRequiredExotelFields = (
  overrides: Partial<{
    phoneNumber: string;
    displayName: string;
    apiKey: string;
    apiToken: string;
    sid: string;
  }> = {}
) => {
  const {
    phoneNumber = '+919876543210',
    displayName = 'Support Line',
    apiKey = 'api-key',
    apiToken = 'api-token',
    sid = 'sid-123',
  } = overrides;

  fireEvent.change(screen.getByPlaceholderText('+919876543210'), {
    target: { value: phoneNumber },
  });
  fireEvent.change(screen.getByPlaceholderText('e.g., Support Line, Sales Number'), {
    target: { value: displayName },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Key'), {
    target: { value: apiKey },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Token'), {
    target: { value: apiToken },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Exotel SID'), {
    target: { value: sid },
  });
};

describe('PhoneNumberModal', () => {
  let fetchMock: jest.Mock;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as typeof global & { fetch: jest.Mock }).fetch = fetchMock;
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    (global as typeof global & { fetch: typeof fetch }).fetch = originalFetch;
    alertSpy.mockRestore();
    window.alert = originalAlert;
  });

  const agents = [
    {
      id: 'agent-1',
      title: 'Support Agent',
      prompt: '',
      llmModel: '',
      sttModel: '',
      ttsModel: '',
      userId: '',
      lastUpdated: '',
      createdAt: '',
    },
  ];

  const existingPhoneNumber = {
    id: 'phone-1',
    phoneNumber: '+911234567890',
    provider: 'exotel',
    displayName: 'Existing Line',
    status: 'active',
    linkedAgentId: 'agent-1',
    exotelConfig: {
      sid: 'existing-sid',
      appId: 'existing-app',
      domain: 'api.us.exotel.com',
      region: 'us',
    },
  } as const;

  it('returns null when closed', () => {
    render(
      <PhoneNumberModal
        isOpen={false}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.queryByText('Import Phone Number')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits a new phone number with exotel configuration', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    fetchMock
      .mockResolvedValueOnce(createResponse({ agents }))
      .mockResolvedValueOnce(createResponse({}, true));

    render(<PhoneNumberModal isOpen onClose={onClose} onSuccess={onSuccess} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/voice-agents?userId=mukul'));

    fireEvent.change(screen.getByPlaceholderText('+919876543210'), {
      target: { value: '+919876543210' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., Support Line, Sales Number'), {
      target: { value: 'Support Line' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Key'), {
      target: { value: 'api-key' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Token'), {
      target: { value: 'api-token' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel SID'), {
      target: { value: 'sid-123' },
    });

    await screen.findByRole('option', { name: 'Support Agent' });
    const agentSelect = screen.getByText('-- No Agent Linked --').parentElement as HTMLSelectElement;
    fireEvent.change(agentSelect, { target: { value: 'agent-1' } });

    fireEvent.click(screen.getByRole('button', { name: 'Import Phone Number' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/phone-numbers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            phoneNumber: '+919876543210',
            displayName: 'Support Line',
            provider: 'exotel',
            linkedAgentId: 'agent-1',
            exotelConfig: {
              apiKey: 'api-key',
              apiToken: 'api-token',
              sid: 'sid-123',
              appId: undefined,
              domain: 'api.in.exotel.com',
              region: 'in',
            },
          }),
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('prefills data for editing and alerts on update failure', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    fetchMock
      .mockResolvedValueOnce(createResponse({ agents }))
      .mockResolvedValueOnce(createResponse({ error: 'Invalid configuration' }, false));

    render(
      <PhoneNumberModal
        isOpen
        phoneNumber={existingPhoneNumber}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByDisplayValue('+911234567890')).toBeDisabled();
    expect(screen.getByDisplayValue('Existing Line')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existing-sid')).toBeInTheDocument();

  const providerSelect = screen.getByDisplayValue('Exotel');
  fireEvent.change(providerSelect, { target: { value: 'twilio' } });
    await waitFor(() => expect(screen.queryByText('Exotel Configuration')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Update Phone Number' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/phone-numbers',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(alertSpy).toHaveBeenCalledWith('Invalid configuration');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('prefills defaults when editing phone number missing optional fields', async () => {
    fetchMock.mockResolvedValueOnce(createResponse({ agents }));

    const incompletePhoneNumber = {
      id: 'phone-2',
      phoneNumber: '',
      provider: '',
      displayName: '',
      status: 'inactive',
    } as any;

    render(
      <PhoneNumberModal
        isOpen
        phoneNumber={incompletePhoneNumber}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/voice-agents?userId=mukul')
    );

    expect(screen.getByPlaceholderText('+919876543210')).toBeDisabled();
    expect(screen.getByDisplayValue('Exotel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Exotel SID')).toHaveValue('');
    expect(screen.getByPlaceholderText('api.in.exotel.com')).toHaveValue('api.in.exotel.com');
    expect(screen.getByDisplayValue('India (in)')).toBeInTheDocument();

    const agentSelect = screen
      .getAllByRole('combobox')
      .find((element) => within(element).queryByText('-- No Agent Linked --')) as HTMLSelectElement | undefined;
    expect(agentSelect).toBeDefined();
    expect((agentSelect as HTMLSelectElement).value).toBe('');
  });

  it('shows alert when submission throws', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    fetchMock
      .mockResolvedValueOnce(createResponse({ agents: [] }))
      .mockRejectedValueOnce(new Error('network error'));

    render(<PhoneNumberModal isOpen onClose={onClose} onSuccess={onSuccess} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/voice-agents?userId=mukul'));

    fireEvent.change(screen.getByPlaceholderText('+919876543210'), {
      target: { value: '+919876543210' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., Support Line, Sales Number'), {
      target: { value: 'Support Line' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Key'), {
      target: { value: 'api-key' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Token'), {
      target: { value: 'api-token' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel SID'), {
      target: { value: 'sid-123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Import Phone Number' }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to save phone number');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('invokes onClose when cancel button clicked', async () => {
    const onClose = jest.fn();

    fetchMock.mockResolvedValueOnce(createResponse({ agents }));

    render(<PhoneNumberModal isOpen onClose={onClose} onSuccess={jest.fn()} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('falls back to empty agent list when fetch fails initially', async () => {
    fetchMock.mockRejectedValueOnce(new Error('load error'));

    render(<PhoneNumberModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/voice-agents?userId=mukul'));

    const agentSelect = screen
      .getAllByRole('combobox')
      .find((element) => within(element).queryByText('-- No Agent Linked --')) as HTMLSelectElement | undefined;
    expect(agentSelect).toBeDefined();
    const agentOptions = within(agentSelect as HTMLSelectElement).getAllByRole('option');
    expect(agentOptions).toHaveLength(1);
    expect(agentOptions[0]).toHaveTextContent('-- No Agent Linked --');
  });

  it('defaults to empty agent list when response lacks agents array', async () => {
    fetchMock.mockResolvedValueOnce(createResponse({}, true));

    render(<PhoneNumberModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/voice-agents?userId=mukul'));

    const agentSelect = screen
      .getAllByRole('combobox')
      .find((element) => within(element).queryByText('-- No Agent Linked --')) as HTMLSelectElement | undefined;
    expect(agentSelect).toBeDefined();
    const options = within(agentSelect as HTMLSelectElement).getAllByRole('option');
    expect(options).toHaveLength(1);
  });

  it('omits exotel config when provider is not exotel', async () => {
    fetchMock
      .mockResolvedValueOnce(createResponse({ agents: [] }))
      .mockResolvedValueOnce(createResponse({}, true));

    render(<PhoneNumberModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/voice-agents?userId=mukul'));

    fireEvent.change(screen.getByPlaceholderText('+919876543210'), {
      target: { value: '+918888888888' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., Support Line, Sales Number'), {
      target: { value: 'General Line' },
    });

    const providerSelect = screen.getByDisplayValue('Exotel');
    fireEvent.change(providerSelect, { target: { value: 'twilio' } });
    await waitFor(() => expect(screen.queryByText('Exotel Configuration')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Import Phone Number' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, requestInit] = fetchMock.mock.calls[1];
    const payload = JSON.parse((requestInit as RequestInit).body as string);

    expect(payload.provider).toBe('twilio');
    expect(Object.prototype.hasOwnProperty.call(payload, 'exotelConfig')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(payload, 'linkedAgentId')).toBe(false);
  });

  it('alerts default message when server responds without error details', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    fetchMock
      .mockResolvedValueOnce(createResponse({ agents }))
      .mockResolvedValueOnce(createResponse({}, false));

    render(<PhoneNumberModal isOpen onClose={onClose} onSuccess={onSuccess} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/voice-agents?userId=mukul'));

    fillRequiredExotelFields();

    fireEvent.click(screen.getByRole('button', { name: 'Import Phone Number' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(alertSpy).toHaveBeenCalledWith('Failed to save phone number');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});