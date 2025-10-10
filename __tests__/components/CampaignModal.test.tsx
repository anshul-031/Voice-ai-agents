import CampaignModal from '@/components/CampaignModal'
import { Campaign } from '@/components/CampaignsTable'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock fetch
global.fetch = jest.fn()

describe('CampaignModal Component', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  const mockCampaign: Campaign = {
    _id: 'campaign-123',
    title: 'Test Campaign',
    status: 'running',
    start_date: '2025-10-01',
    updated_at: '2025-10-10',
    agent_id: 'emi reminder',
    user_id: 'mukul'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Rendering - Add Mode', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <CampaignModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render modal with title "Add Campaign" when no campaign prop', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Add Campaign')).toBeInTheDocument()
    })

    it('should render all form fields in add mode', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('Campaign Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Agent ID')).toBeInTheDocument()
      expect(screen.getByLabelText('User ID')).toBeInTheDocument()
    })

    it('should have default values in add mode', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('Campaign Title')).toHaveValue('')
      expect(screen.getByLabelText('Start Date')).toHaveValue('')
      expect(screen.getByLabelText('Status')).toHaveValue('running')
      expect(screen.getByLabelText('Agent ID')).toHaveValue('emi reminder')
      expect(screen.getByLabelText('User ID')).toHaveValue('mukul')
    })

    it('should not show file upload section in add mode', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText(/Upload Contacts/)).not.toBeInTheDocument()
    })

    it('should render Cancel and Create Campaign buttons', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Create Campaign')).toBeInTheDocument()
    })
  })

  describe('Rendering - Edit Mode', () => {
    it('should render modal with title "Edit Campaign" when campaign prop exists', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Edit Campaign')).toBeInTheDocument()
    })

    it('should populate form fields with campaign data in edit mode', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('Campaign Title')).toHaveValue('Test Campaign')
      expect(screen.getByLabelText('Start Date')).toHaveValue('2025-10-01')
      expect(screen.getByLabelText('Status')).toHaveValue('running')
      expect(screen.getByLabelText('Agent ID')).toHaveValue('emi reminder')
      expect(screen.getByLabelText('User ID')).toHaveValue('mukul')
    })

    it('should show file upload section in edit mode', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/Upload Contacts/)).toBeInTheDocument()
      expect(screen.getByText(/CSV must have columns:/)).toBeInTheDocument()
    })

    it('should render Save Changes button in edit mode', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should update title field when user types', async () => {
      const user = userEvent.setup()

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const titleInput = screen.getByLabelText('Campaign Title')
      await user.type(titleInput, 'New Campaign Title')

      expect(titleInput).toHaveValue('New Campaign Title')
    })

    it('should update date field when user selects a date', async () => {
      const user = userEvent.setup()

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const dateInput = screen.getByLabelText('Start Date')
      await user.type(dateInput, '2025-12-25')

      expect(dateInput).toHaveValue('2025-12-25')
    })

    it('should update status field when user selects a status', async () => {
      const user = userEvent.setup()

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const statusSelect = screen.getByLabelText('Status')
      await user.selectOptions(statusSelect, 'stopped')

      expect(statusSelect).toHaveValue('stopped')
    })

    it('should call onClose when Cancel button is clicked', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when X button is clicked', () => {
      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const closeButton = screen.getByText('✕')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Submission - Create Campaign', () => {
    it('should submit form data to create a new campaign', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.type(screen.getByLabelText('Campaign Title'), 'New Campaign')
      await user.type(screen.getByLabelText('Start Date'), '2025-10-15')
      
      const submitButton = screen.getByText('Create Campaign')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"title":"New Campaign"')
        })
      })
    })

    it('should call onSuccess and onClose after successful creation', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.type(screen.getByLabelText('Campaign Title'), 'New Campaign')
      await user.type(screen.getByLabelText('Start Date'), '2025-10-15')
      
      const submitButton = screen.getByText('Create Campaign')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      )

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.type(screen.getByLabelText('Campaign Title'), 'New Campaign')
      await user.type(screen.getByLabelText('Start Date'), '2025-10-15')
      
      const submitButton = screen.getByText('Create Campaign')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })
    })

    it('should disable button during submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      )

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.type(screen.getByLabelText('Campaign Title'), 'New Campaign')
      await user.type(screen.getByLabelText('Start Date'), '2025-10-15')
      
      const submitButton = screen.getByText('Create Campaign')
      fireEvent.click(submitButton)

      await waitFor(() => {
        const savingButton = screen.getByText('Saving...')
        expect(savingButton).toBeDisabled()
      })
    })
  })

  describe('Form Submission - Update Campaign', () => {
    it('should submit form data to update existing campaign', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      const titleInput = screen.getByLabelText('Campaign Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Campaign')
      
      const submitButton = screen.getByText('Save Changes')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"title":"Updated Campaign"')
        })
      })
    })

    it('should include campaign ID in update request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      const submitButton = screen.getByText('Save Changes')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/campaigns', 
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"id":"campaign-123"')
          })
        )
      })
    })
  })

  describe('File Upload', () => {
    it('should handle CSV file upload', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 5 })
      })

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      const file = new File(['number,name\n1234567890,John'], 'contacts.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/campaign-contacts', 
          expect.objectContaining({
            method: 'POST'
          })
        )
      })
    })

    it('should display success message after successful upload', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 5 })
      })

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      const file = new File(['number,name\n1234567890,John'], 'contacts.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText('✓ Uploaded 5 contacts!')).toBeInTheDocument()
      })
    })

    it('should display error message on failed upload', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid CSV format' })
      })

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      const file = new File(['invalid'], 'contacts.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText('✗ Invalid CSV format')).toBeInTheDocument()
      })
    })

    it('should show uploading state during file upload', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ 
          ok: true, 
          json: async () => ({ success: true, count: 3 })
        }), 100))
      )

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      const file = new File(['number,name\n1234567890,John'], 'contacts.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText('⏳ Uploading...')).toBeInTheDocument()
      })
    })

    it('should disable file input during upload', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ 
          ok: true, 
          json: async () => ({ success: true, count: 3 })
        }), 100))
      )

      render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      const file = new File(['number,name\n1234567890,John'], 'contacts.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(fileInput).toBeDisabled()
      })
    })
  })

  describe('Field Reset', () => {
    it('should reset form fields when modal is closed and reopened', async () => {
      const { rerender } = render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const titleInput = screen.getByLabelText('Campaign Title')
      await userEvent.type(titleInput, 'Test Title')

      rerender(
        <CampaignModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      rerender(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('Campaign Title')).toHaveValue('')
    })

    it('should populate fields when switching from add to edit mode', () => {
      const { rerender } = render(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('Campaign Title')).toHaveValue('')

      rerender(
        <CampaignModal
          isOpen={true}
          onClose={mockOnClose}
          campaign={mockCampaign}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('Campaign Title')).toHaveValue('Test Campaign')
    })
  })
})
