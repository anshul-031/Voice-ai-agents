import CampaignsTable, { Campaign } from '@/components/CampaignsTable'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'

describe('CampaignsTable Component', () => {
  const mockCampaigns: Campaign[] = [
    {
      _id: '1',
      title: 'Campaign 1',
      status: 'running',
      start_date: '2025-10-01',
      updated_at: '2025-10-10',
      agent_id: 'emi reminder',
      user_id: 'user1'
    },
    {
      _id: '2',
      title: 'Campaign 2',
      status: 'stopped',
      start_date: '2025-09-15',
      updated_at: '2025-10-05',
      agent_id: 'emi reminder',
      user_id: 'user1'
    },
    {
      _id: '3',
      title: 'Campaign 3',
      status: 'completed',
      start_date: '2025-08-01',
      updated_at: '2025-09-30',
      agent_id: 'emi reminder',
      user_id: 'user1'
    }
  ]

  const mockHandlers = {
    onEditCampaign: jest.fn(),
    onAddCampaign: jest.fn(),
    onViewCampaign: jest.fn(),
    onStartCampaign: jest.fn(),
    onRetriggerCampaign: jest.fn(),
    onDeleteCampaign: jest.fn()
  }

  type CampaignsTableProps = ComponentProps<typeof CampaignsTable>

  const renderCampaignsTable = (props: Partial<CampaignsTableProps> = {}) => {
    const defaultProps: CampaignsTableProps = {
      campaigns: mockCampaigns,
      onEditCampaign: mockHandlers.onEditCampaign,
      onAddCampaign: mockHandlers.onAddCampaign,
      onViewCampaign: mockHandlers.onViewCampaign,
      onStartCampaign: mockHandlers.onStartCampaign,
      onRetriggerCampaign: mockHandlers.onRetriggerCampaign,
      onDeleteCampaign: mockHandlers.onDeleteCampaign,
      startingId: null,
      retriggeringId: null,
      deletingId: null
    }

    return render(<CampaignsTable {...defaultProps} {...props} />)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the component with title', () => {
      renderCampaignsTable({ campaigns: [] })

      expect(screen.getByText('Campaigns')).toBeInTheDocument()
    })

    it('should render Add Campaign button', () => {
      renderCampaignsTable({ campaigns: [] })

      expect(screen.getByText('+ Add Campaign')).toBeInTheDocument()
    })

    it('should display empty state when no campaigns', () => {
      renderCampaignsTable({ campaigns: [] })

      expect(screen.getByText('No campaigns yet. Click "Add Campaign" to create one.')).toBeInTheDocument()
    })

      it('should render table headers when campaigns exist', () => {
        renderCampaignsTable()

      expect(screen.getByText('Campaign Title')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Start Date')).toBeInTheDocument()
      expect(screen.getByText('Updated At')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should render all campaigns in the list', () => {
        renderCampaignsTable()

      expect(screen.getByText('Campaign 1')).toBeInTheDocument()
      expect(screen.getByText('Campaign 2')).toBeInTheDocument()
      expect(screen.getByText('Campaign 3')).toBeInTheDocument()
    })

    it('should display campaign status badges correctly', () => {
        renderCampaignsTable()

      expect(screen.getByText('running')).toBeInTheDocument()
      expect(screen.getByText('stopped')).toBeInTheDocument()
      expect(screen.getByText('completed')).toBeInTheDocument()
    })

    it('should format dates correctly', () => {
        renderCampaignsTable()

      // Dates should be formatted using toLocaleDateString
      const startDate = new Date('2025-10-01').toLocaleDateString()
      const updatedDate = new Date('2025-10-10').toLocaleDateString()

      expect(screen.getByText(startDate)).toBeInTheDocument()
      expect(screen.getByText(updatedDate)).toBeInTheDocument()
    })

    it('should render View and Edit buttons for each campaign', () => {
        renderCampaignsTable()

      const viewButtons = screen.getAllByText('View')
      const editButtons = screen.getAllByText('Edit')

      expect(viewButtons).toHaveLength(3)
      expect(editButtons).toHaveLength(3)
    })
  })

  describe('User Interactions', () => {
    it('should call onAddCampaign when Add Campaign button is clicked', () => {
      renderCampaignsTable()

      const addButton = screen.getByText('+ Add Campaign')
      fireEvent.click(addButton)

      expect(mockHandlers.onAddCampaign).toHaveBeenCalledTimes(1)
    })

    it('should call onViewCampaign with correct campaign when View button is clicked', () => {
      renderCampaignsTable()

      const viewButtons = screen.getAllByText('View')
      fireEvent.click(viewButtons[0])

      expect(mockHandlers.onViewCampaign).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onViewCampaign).toHaveBeenCalledWith(mockCampaigns[0])
    })

    it('should call onEditCampaign with correct campaign when Edit button is clicked', () => {
      renderCampaignsTable()

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[1])

      expect(mockHandlers.onEditCampaign).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onEditCampaign).toHaveBeenCalledWith(mockCampaigns[1])
    })

    it('should handle multiple button clicks correctly', () => {
      renderCampaignsTable()

      const viewButtons = screen.getAllByText('View')
      const editButtons = screen.getAllByText('Edit')

      fireEvent.click(viewButtons[0])
      fireEvent.click(editButtons[1])
      fireEvent.click(viewButtons[2])

      expect(mockHandlers.onViewCampaign).toHaveBeenCalledTimes(2)
      expect(mockHandlers.onEditCampaign).toHaveBeenCalledTimes(1)
    })
  })

  describe('Status Badge Styling', () => {
    it('should apply correct styling for running status', () => {
      const runningCampaign: Campaign[] = [{
        _id: '1',
        title: 'Running Campaign',
        status: 'running',
        start_date: '2025-10-01',
        updated_at: '2025-10-10',
        agent_id: 'emi reminder',
        user_id: 'user1'
      }]

      renderCampaignsTable({ campaigns: runningCampaign })

      const statusBadge = screen.getByText('running').closest('span')
      expect(statusBadge).toHaveClass('bg-emerald-500/10', 'text-emerald-400')
    })

    it('should apply correct styling for stopped status', () => {
      const stoppedCampaign: Campaign[] = [{
        _id: '1',
        title: 'Stopped Campaign',
        status: 'stopped',
        start_date: '2025-10-01',
        updated_at: '2025-10-10',
        agent_id: 'emi reminder',
        user_id: 'user1'
      }]

      renderCampaignsTable({ campaigns: stoppedCampaign })

      const statusBadge = screen.getByText('stopped').closest('span')
      expect(statusBadge).toHaveClass('bg-red-500/10', 'text-red-400')
    })

    it('should apply correct styling for completed status', () => {
      const completedCampaign: Campaign[] = [{
        _id: '1',
        title: 'Completed Campaign',
        status: 'completed',
        start_date: '2025-10-01',
        updated_at: '2025-10-10',
        agent_id: 'emi reminder',
        user_id: 'user1'
      }]

      renderCampaignsTable({ campaigns: completedCampaign })

      const statusBadge = screen.getByText('completed').closest('span')
      expect(statusBadge).toHaveClass('bg-blue-500/10', 'text-blue-400')
    })
  })

  describe('Edge Cases', () => {
    it('should handle campaigns with missing updated_at field', () => {
      const campaignNoUpdatedAt: Campaign[] = [{
        _id: '1',
        title: 'Test Campaign',
        status: 'running',
        start_date: '2025-10-01',
        updated_at: '',
        agent_id: 'emi reminder',
        user_id: 'user1'
      }]

      renderCampaignsTable({ campaigns: campaignNoUpdatedAt })

      const placeholderCells = screen.getAllByText('-', { exact: true })
      expect(placeholderCells.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle single campaign', () => {
      renderCampaignsTable({ campaigns: [mockCampaigns[0]] })

      expect(screen.getByText('Campaign 1')).toBeInTheDocument()
      expect(screen.queryByText('Campaign 2')).not.toBeInTheDocument()
    })

    it('should handle long campaign titles with truncation', () => {
      const longTitleCampaign: Campaign[] = [{
        _id: '1',
        title: 'This is a very long campaign title that should be truncated in the UI',
        status: 'running',
        start_date: '2025-10-01',
        updated_at: '2025-10-10',
        agent_id: 'emi reminder',
        user_id: 'user1'
      }]

      renderCampaignsTable({ campaigns: longTitleCampaign })

      const titleElement = screen.getByText(longTitleCampaign[0].title)
      expect(titleElement).toHaveClass('truncate')
    })
  })

  describe('Start Campaign Button', () => {
    it('should render Start button for each campaign', () => {
      renderCampaignsTable()

      const startButtons = screen.getAllByText('Start')
      expect(startButtons).toHaveLength(mockCampaigns.length)
    })

    it('should disable Start button for running campaigns', () => {
      renderCampaignsTable()

      const startButtons = screen.getAllByText('Start')
      expect(startButtons[0]).toBeDisabled()
      expect(startButtons[1]).not.toBeDisabled()
    })

    it('should call onStartCampaign with correct campaign when Start button is clicked', () => {
      renderCampaignsTable()

      const startButtons = screen.getAllByText('Start')
      fireEvent.click(startButtons[1])

      expect(mockHandlers.onStartCampaign).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onStartCampaign).toHaveBeenCalledWith(mockCampaigns[1])
    })

    it('should show loading state when campaign is starting', () => {
      renderCampaignsTable({ startingId: mockCampaigns[1]._id })

      expect(screen.getByText('Starting…')).toBeDisabled()
    })
  })

  describe('Retrigger Campaign Button', () => {
    it('should render Retrigger button for each campaign', () => {
      renderCampaignsTable()

      const retriggerButtons = screen.getAllByText('Retrigger')
      expect(retriggerButtons).toHaveLength(mockCampaigns.length)
    })

    it('should call onRetriggerCampaign with correct campaign when Retrigger button is clicked', () => {
      renderCampaignsTable()

      const retriggerButtons = screen.getAllByText('Retrigger')
      fireEvent.click(retriggerButtons[0])

      expect(mockHandlers.onRetriggerCampaign).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onRetriggerCampaign).toHaveBeenCalledWith(mockCampaigns[0])
    })

    it('should disable Retrigger button and show loading state when retriggering', () => {
      renderCampaignsTable({ retriggeringId: mockCampaigns[0]._id })

      const retriggeringButton = screen.getByText('Retriggering…')
      expect(retriggeringButton).toBeDisabled()
    })

    it('should keep Retrigger button enabled when not retriggering', () => {
      renderCampaignsTable({ retriggeringId: 'different-id' })

      const retriggerButtons = screen.getAllByText('Retrigger')
      expect(retriggerButtons[0]).not.toBeDisabled()
    })

    it('should display campaign progress when available', () => {
      const campaignWithProgress: Campaign[] = [{
        _id: '1',
        title: 'Campaign with Progress',
        status: 'running',
        start_date: '2025-10-01',
        updated_at: '2025-10-10',
        agent_id: 'emi reminder',
        user_id: 'user1',
        total_contacts: 100,
        calls_completed: 45,
        calls_failed: 5
      }]

      renderCampaignsTable({ campaigns: campaignWithProgress })

      expect(screen.getByText('45/100')).toBeInTheDocument()
      expect(screen.getByText('(5 failed)')).toBeInTheDocument()
    })

    it('should show dash when no progress data available', () => {
      const campaignNoProgress: Campaign[] = [{
        _id: '1',
        title: 'Campaign without Progress',
        status: 'stopped',
        start_date: '2025-10-01',
        updated_at: '2025-10-10',
        agent_id: 'emi reminder',
        user_id: 'user1'
      }]

      renderCampaignsTable({ campaigns: campaignNoProgress })

      const progressCells = screen.getAllByText('-')
      expect(progressCells.length).toBeGreaterThan(0)
    })
  })

  describe('Delete Campaign Button', () => {
    it('should render Delete button for each campaign', () => {
      renderCampaignsTable()

      const deleteButtons = screen.getAllByText('Delete')
      expect(deleteButtons).toHaveLength(mockCampaigns.length)
    })

    it('should call onDeleteCampaign with correct campaign when Delete button is clicked', () => {
      renderCampaignsTable()

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      expect(mockHandlers.onDeleteCampaign).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onDeleteCampaign).toHaveBeenCalledWith(mockCampaigns[0])
    })

    it('should disable Delete button and show loading state when deleting', () => {
      renderCampaignsTable({ deletingId: mockCampaigns[1]._id })

      const deletingButton = screen.getByText('Deleting…')
      expect(deletingButton).toBeDisabled()
    })

    it('should keep Delete button enabled when not deleting', () => {
      renderCampaignsTable({ deletingId: 'different-id' })

      const deleteButtons = screen.getAllByText('Delete')
      deleteButtons.forEach(button => {
        expect(button).not.toBeDisabled()
      })
    })

    it('should apply correct styling to Delete button', () => {
      renderCampaignsTable()

      const deleteButtons = screen.getAllByText('Delete')
      expect(deleteButtons[0]).toHaveClass('text-red-400')
    })

    it('should handle multiple delete operations correctly', () => {
      renderCampaignsTable()

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])
      fireEvent.click(deleteButtons[2])

      expect(mockHandlers.onDeleteCampaign).toHaveBeenCalledTimes(2)
      expect(mockHandlers.onDeleteCampaign).toHaveBeenNthCalledWith(1, mockCampaigns[0])
      expect(mockHandlers.onDeleteCampaign).toHaveBeenNthCalledWith(2, mockCampaigns[2])
    })
  })
})
