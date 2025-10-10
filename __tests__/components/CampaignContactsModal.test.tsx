import CampaignContactsModal from '@/components/CampaignContactsModal'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock fetch and window.confirm
global.fetch = jest.fn()
global.confirm = jest.fn()

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Trash2: ({ className }: { className?: string }) => <span className={className}>🗑️</span>
}))

describe('CampaignContactsModal Component', () => {
  const mockOnClose = jest.fn()
  const mockContacts = [
    {
      _id: 'contact-1',
      number: '1234567890',
      name: 'John Doe',
      description: 'Customer from Q1',
      call_done: 'no'
    },
    {
      _id: 'contact-2',
      number: '0987654321',
      name: 'Jane Smith',
      description: 'Lead from marketing campaign',
      call_done: 'yes'
    },
    {
      _id: 'contact-3',
      number: '5555555555',
      name: 'Bob Johnson',
      description: 'Referred by existing customer',
      call_done: 'no'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.confirm as jest.Mock).mockClear()
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <CampaignContactsModal
          isOpen={false}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render modal with title when isOpen is true', () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      expect(screen.getByText('Campaign Contacts')).toBeInTheDocument()
    })

    it('should show loading state initially', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ 
          ok: true, 
          json: async () => ({ success: true, data: mockContacts })
        }), 100))
      )

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      expect(screen.getByText('Loading contacts...')).toBeInTheDocument()
    })

    it('should display empty state when no contacts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('No contacts found for this campaign.')).toBeInTheDocument()
        expect(screen.getByText('Upload a CSV file in Edit mode to add contacts.')).toBeInTheDocument()
      })
    })

    it('should render table headers when contacts exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Number')).toBeInTheDocument()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Description')).toBeInTheDocument()
        expect(screen.getByText('Call Done')).toBeInTheDocument()
        expect(screen.getByText('Actions')).toBeInTheDocument()
      })
    })

    it('should render all contacts in the table', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('0987654321')).toBeInTheDocument()
        expect(screen.getByText('5555555555')).toBeInTheDocument()
      })
    })

    it('should display total contacts count', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Total contacts: 3')).toBeInTheDocument()
      })
    })

    it('should render close button', () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      expect(screen.getByText('✕')).toBeInTheDocument()
    })
  })

  describe('Data Fetching', () => {
    it('should fetch contacts when modal opens', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/campaign-contacts?campaign_id=campaign-123')
      })
    })

    it('should not fetch when campaignId is null', () => {
      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId={null}
        />
      )

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('No contacts found for this campaign.')).toBeInTheDocument()
      })
    })

    it('should handle malformed response data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }) // Missing data field
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('No contacts found for this campaign.')).toBeInTheDocument()
      })
    })

    it('should refetch contacts when modal is reopened', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      const { rerender } = render(
        <CampaignContactsModal
          isOpen={false}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      expect(global.fetch).not.toHaveBeenCalled()

      rerender(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      rerender(
        <CampaignContactsModal
          isOpen={false}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      rerender(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Call Done Status Display', () => {
    it('should display "Yes" badge for completed calls', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('✓ Yes')).toBeInTheDocument()
      })
    })

    it('should display "No" badge for pending calls', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        const noBadges = screen.getAllByText('○ No')
        expect(noBadges).toHaveLength(2)
      })
    })

    it('should apply correct styling to Yes badge', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [{ ...mockContacts[1] }] // Jane Smith with call_done: 'yes'
        })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        const yesBadge = screen.getByText('✓ Yes').closest('span')
        expect(yesBadge).toHaveClass('bg-emerald-500/10', 'text-emerald-400')
      })
    })

    it('should apply correct styling to No badge', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [{ ...mockContacts[0] }] // John Doe with call_done: 'no'
        })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        const noBadge = screen.getByText('○ No').closest('span')
        expect(noBadge).toHaveClass('bg-gray-500/10', 'text-gray-400')
      })
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      const closeButton = screen.getByText('✕')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete contact')
      fireEvent.click(deleteButtons[0])

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this contact?')
    })

    it('should delete contact when confirmed', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockContacts })
        })
        .mockResolvedValueOnce({ ok: true })

      ;(global.confirm as jest.Mock).mockReturnValue(true)

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete contact')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/campaign-contacts?id=contact-1',
          { method: 'DELETE' }
        )
      })
    })

    it('should remove contact from list after successful deletion', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockContacts })
        })
        .mockResolvedValueOnce({ ok: true })

      ;(global.confirm as jest.Mock).mockReturnValue(true)

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Total contacts: 3')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete contact')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
        expect(screen.getByText('Total contacts: 2')).toBeInTheDocument()
      })
    })

    it('should not delete contact when user cancels confirmation', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      ;(global.confirm as jest.Mock).mockReturnValue(false)

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete contact')
      fireEvent.click(deleteButtons[0])

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Total contacts: 3')).toBeInTheDocument()
      expect(global.fetch).toHaveBeenCalledTimes(1) // Only the initial fetch
    })

    it('should handle delete errors gracefully', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockContacts })
        })
        .mockRejectedValueOnce(new Error('Network error'))

      ;(global.confirm as jest.Mock).mockReturnValue(true)

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete contact')
      fireEvent.click(deleteButtons[0])

      // Contact should still be in the list after error
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should truncate long descriptions with title attribute', async () => {
      const longDescContact = [{
        ...mockContacts[0],
        description: 'This is a very long description that should be truncated in the UI to prevent layout issues and maintain readability'
      }]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: longDescContact })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        const descElement = screen.getByText(longDescContact[0].description)
        expect(descElement).toHaveClass('truncate')
        expect(descElement).toHaveAttribute('title', longDescContact[0].description)
      })
    })

    it('should handle single contact', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [mockContacts[0]] })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Total contacts: 1')).toBeInTheDocument()
      })
    })

    it('should apply alternating row colors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContacts })
      })

      render(
        <CampaignContactsModal
          isOpen={true}
          onClose={mockOnClose}
          campaignId="campaign-123"
        />
      )

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // Skip header row (index 0)
        expect(rows[1]).toHaveClass('bg-[#0f1419]')
        expect(rows[2]).toHaveClass('bg-[#11161d]')
        expect(rows[3]).toHaveClass('bg-[#0f1419]')
      })
    })
  })
})
