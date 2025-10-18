/**
 * @jest-environment jsdom
 */

import PhoneNumbersTable from '@/components/PhoneNumbersTable';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe('PhoneNumbersTable', () => {
  const mockOnAddPhone = jest.fn();
  const mockOnEditPhone = jest.fn();

  const mockPhoneNumbers = [
    {
      id: '1',
      phoneNumber: '+1234567890',
      provider: 'exotel',
      displayName: 'Test Phone',
      exotelConfig: {
        sid: 'test-sid',
        domain: 'api.in.exotel.com',
        region: 'in',
      },
      linkedAgentId: 'agent-1',
      webhookUrl: 'https://example.com/webhook',
      websocketUrl: 'wss://example.com/ws',
      status: 'active',
      lastUsed: '2024-01-01',
      createdAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ phoneNumbers: mockPhoneNumbers }),
    });
  });

  it('renders loading state initially', () => {
    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    expect(screen.getByText('Loading phone numbers...')).toBeInTheDocument();
  });

  it('fetches and displays phone numbers', async () => {
    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/phone-numbers?userId=mukul');
    });

    await waitFor(() => {
      expect(screen.getByText('Test Phone')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('displays empty state when no phone numbers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ phoneNumbers: [] }),
    });

    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('No phone numbers yet')).toBeInTheDocument();
      expect(screen.getAllByText('Import Phone Number')).toHaveLength(2); // Header and empty state buttons
    });
  });

  it('calls onAddPhone when add button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ phoneNumbers: [] }),
    });

    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('No phone numbers yet')).toBeInTheDocument();
    });

    const addButton = screen.getAllByText('Import Phone Number')[0];
    fireEvent.click(addButton);

    expect(mockOnAddPhone).toHaveBeenCalled();
  });

  it('calls onEditPhone when edit button is clicked', async () => {
    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('Test Phone')).toBeInTheDocument();
    });

    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);

    expect(mockOnEditPhone).toHaveBeenCalledWith(mockPhoneNumbers[0]);
  });

  it('handles delete with confirmation', async () => {
    mockConfirm.mockReturnValue(true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ phoneNumbers: mockPhoneNumbers }),
    }).mockResolvedValueOnce({
      ok: true,
    });

    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('Test Phone')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this phone number?');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/phone-numbers?id=1', {
        method: 'DELETE',
      });
    });
  });

  it('handles delete cancellation', async () => {
    mockConfirm.mockReturnValue(false);

    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('Test Phone')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this phone number?');
    expect(mockFetch).not.toHaveBeenCalledWith('/api/phone-numbers?id=1', {
      method: 'DELETE',
    });
  });

  it('handles delete failure', async () => {
    mockConfirm.mockReturnValue(true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ phoneNumbers: mockPhoneNumbers }),
    }).mockResolvedValueOnce({
      ok: false,
    });

    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('Test Phone')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to delete phone number');
    });
  });

  it('copies webhook URL to clipboard', async () => {
    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('Test Phone')).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByText('Copy');
    const webhookCopyButton = copyButtons[0]; // First copy button is for webhook
    fireEvent.click(webhookCopyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/webhook');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('refreshes phone numbers when refresh button is clicked', async () => {
    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('Test Phone')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockFetch).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PhoneNumbersTable onAddPhone={mockOnAddPhone} onEditPhone={mockOnEditPhone} />);

    await waitFor(() => {
      expect(screen.getByText('No phone numbers yet')).toBeInTheDocument();
    });
  });
});