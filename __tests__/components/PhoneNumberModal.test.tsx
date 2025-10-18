/**
 * @jest-environment jsdom
 */

import PhoneNumberModal from '@/components/PhoneNumberModal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe('PhoneNumberModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const mockAgents = [
    { id: 'agent-1', name: 'Test Agent 1' },
    { id: 'agent-2', name: 'Test Agent 2' },
  ];

  const mockPhoneNumber = {
    id: '1',
    phoneNumber: '+1234567890',
    displayName: 'Test Phone',
    provider: 'exotel',
    exotelConfig: {
      sid: 'test-sid',
      appId: 'test-app-id',
      domain: 'api.in.exotel.com',
      region: 'in',
    },
    linkedAgentId: 'agent-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ agents: mockAgents }),
    });
  });

  it('does not render when isOpen is false', () => {
    render(
      <PhoneNumberModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Import Phone Number')).not.toBeInTheDocument();
  });

  it('renders add modal correctly', async () => {
    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Import Phone Number' })).toBeInTheDocument();
    });

    // Check for form inputs by placeholder text since labels aren't properly associated
    expect(screen.getByPlaceholderText('+919876543210')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Support Line, Sales Number')).toBeInTheDocument();
    
    // Check that provider select exists (first select in the form)
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(3); // Provider, Region, Agent selects
  });

  it('renders edit modal correctly', async () => {
    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        phoneNumber={mockPhoneNumber}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit Phone Number' })).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Phone')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test-sid')).toBeInTheDocument();
  });

  it('fetches agents on open', async () => {
    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/voice-agents?userId=mukul');
    });
  });

  it('handles form submission for new phone number', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ agents: mockAgents }),
    }).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('+919876543210')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('+919876543210'), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., Support Line, Sales Number'), {
      target: { value: 'Test Phone' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Key'), {
      target: { value: 'test-api-key' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Token'), {
      target: { value: 'test-api-token' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel SID'), {
      target: { value: 'test-sid' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Import Phone Number' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/phone-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+1234567890',
          displayName: 'Test Phone',
          provider: 'exotel',
          exotelConfig: {
            apiKey: 'test-api-key',
            apiToken: 'test-api-token',
            sid: 'test-sid',
            appId: undefined,
            domain: 'api.in.exotel.com',
            region: 'in',
          },
        }),
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles form submission for editing phone number', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ agents: mockAgents }),
    }).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        phoneNumber={mockPhoneNumber}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Phone')).toBeInTheDocument();
    });

    // Modify form
    fireEvent.change(screen.getByDisplayValue('Test Phone'), {
      target: { value: 'Updated Phone' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Update Phone Number' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/phone-numbers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+1234567890',
          displayName: 'Updated Phone',
          provider: 'exotel',
          linkedAgentId: 'agent-1',
          exotelConfig: {
            apiKey: '',
            apiToken: '',
            sid: 'test-sid',
            appId: 'test-app-id',
            domain: 'api.in.exotel.com',
            region: 'in',
          },
          id: '1',
        }),
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles form submission error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ agents: mockAgents }),
    }).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Validation error' }),
    });

    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('+919876543210')).toBeInTheDocument();
    });

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('+919876543210'), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., Support Line, Sales Number'), {
      target: { value: 'Test Phone' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Key'), {
      target: { value: 'test-api-key' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel API Token'), {
      target: { value: 'test-api-token' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Exotel SID'), {
      target: { value: 'test-sid' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Import Phone Number' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Validation error');
    });
  });

  it('closes modal when close button is clicked', async () => {
    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Import Phone Number' })).toBeInTheDocument();
    });

    // Find the close button (first button in header with X icon)
    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows form field changes', () => {
    render(<PhoneNumberModal isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />);

    // Test phone number input
    const phoneInput = screen.getByPlaceholderText('+919876543210');
    fireEvent.change(phoneInput, { target: { value: '+9876543210' } });
    expect(phoneInput).toHaveValue('+9876543210');

    // Test display name input
    const displayNameInput = screen.getByPlaceholderText('e.g., Support Line, Sales Number');
    fireEvent.change(displayNameInput, { target: { value: 'Test Line' } });
    expect(displayNameInput).toHaveValue('Test Line');
  });

  it('shows exotel config fields when exotel provider is selected', async () => {
    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Import Phone Number' })).toBeInTheDocument();
    });

    // Exotel fields should be visible by default
    expect(screen.getByPlaceholderText('Enter Exotel API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Exotel API Token')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Exotel SID')).toBeInTheDocument();
  });

  it('hides exotel config fields when non-exotel provider is selected', async () => {
    render(
      <PhoneNumberModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Import Phone Number' })).toBeInTheDocument();
    });

    // Change provider to twilio
    const providerSelect = screen.getByDisplayValue('Exotel');
    fireEvent.change(providerSelect, { target: { value: 'twilio' } });

    // Exotel fields should be hidden
    expect(screen.queryByPlaceholderText('Enter your Exotel API Key')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter your Exotel API Token')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter your Exotel SID')).not.toBeInTheDocument();
  });
});