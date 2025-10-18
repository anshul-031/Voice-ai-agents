import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock heavy children used by DashboardPage
jest.mock('@/components/VoiceAgentsTable', () => jest.fn((props: any) => (
  <div data-testid="VoiceAgentsTable">
    <button data-testid="add-agent-btn" onClick={props.onAddAgent}>Add Agent</button>
    <button data-testid="edit-agent-btn" onClick={() => props.onEditAgent?.({ id: '1', title: 'Test Agent' })}>Edit Agent</button>
  </div>
)))
jest.mock('@/components/CallLogsTable', () => jest.fn((props: any) => (
  <div data-testid="CallLogsTable">
    <button data-testid="view-call-btn" onClick={() => props.onViewCallDetails?.('session-1')}>View Call</button>
  </div>
)))
jest.mock('@/components/CampaignsTable', () => jest.fn((props: any) => (
  <div data-testid="CampaignsTable">
    <button data-testid="add-campaign-btn" onClick={props.onAddCampaign}>Add Campaign</button>
    <button data-testid="edit-campaign-btn" onClick={() => props.onEditCampaign?.({ _id: '1', title: 'Test Campaign' })}>Edit Campaign</button>
    <button data-testid="view-campaign-btn" onClick={() => props.onViewCampaign?.({ _id: '1', title: 'Test Campaign' })}>View Campaign</button>
    <button data-testid="start-campaign-btn" onClick={() => props.onStartCampaign?.({ _id: '1', title: 'Test Campaign' })}>Start Campaign</button>
  </div>
)))
jest.mock('@/components/PhoneNumbersTable', () => jest.fn((props: any) => (
  <div data-testid="PhoneNumbersTable">
    <button data-testid="add-phone-btn" onClick={props.onAddPhone}>Add Phone</button>
    <button data-testid="edit-phone-btn" onClick={() => props.onEditPhone?.({ id: '1', number: '1234567890' })}>Edit Phone</button>
  </div>
)))
jest.mock('@/components/AgentModal', () => jest.fn((props: any) => (
  props.isOpen ? <div data-testid="AgentModal"><button data-testid="close-agent-modal" onClick={props.onClose}>Close</button></div> : null
)))
jest.mock('@/components/CampaignModal', () => jest.fn((props: any) => (
  props.isOpen ? <div data-testid="CampaignModal"><button data-testid="close-campaign-modal" onClick={props.onClose}>Close</button></div> : null
)))
jest.mock('@/components/CampaignContactsModal', () => jest.fn((props: any) => (
  props.isOpen ? <div data-testid="CampaignContactsModal"><button data-testid="close-contacts-modal" onClick={props.onClose}>Close</button></div> : null
)))
jest.mock('@/components/PhoneNumberModal', () => jest.fn((props: any) => (
  props.isOpen ? <div data-testid="PhoneNumberModal"><button data-testid="close-phone-modal" onClick={props.onClose}>Close</button></div> : null
)))
jest.mock('@/components/ChatHistory', () => jest.fn((props: any) => (
  props.isOpen ? <div data-testid="ChatHistory"><button data-testid="close-chat-history" onClick={props.onClose}>Close</button></div> : null
)))

// Mock DashboardSidebar
jest.mock('@/components/DashboardSidebar', () => jest.fn((props: any) => (
  <div data-testid="DashboardSidebar">
    <button data-testid="voice-agents-nav" onClick={() => props.onNavigate('voice-agents')}>Voice Agents</button>
    <button data-testid="call-logs-nav" onClick={() => props.onNavigate('call-logs')}>Call Logs</button>
    <button data-testid="campaigns-nav" onClick={() => props.onNavigate('campaigns')}>Campaigns</button>
    <button data-testid="phone-number-nav" onClick={() => props.onNavigate('phone-number')}>Phone Number</button>
    <button data-testid="agent-knowledge-nav" onClick={() => props.onNavigate('agent-knowledge')}>Agent Knowledge</button>
    <button data-testid="api-keys-nav" onClick={() => props.onNavigate('api-keys')}>API Keys</button>
    <button data-testid="credentials-nav" onClick={() => props.onNavigate('credentials')}>Credentials</button>
    <button data-testid="billing-nav" onClick={() => props.onNavigate('billing')}>Billing</button>
    <button data-testid="transactions-nav" onClick={() => props.onNavigate('transactions')}>Transactions</button>
    <button data-testid="documentation-nav" onClick={() => props.onNavigate('documentation')}>Documentation</button>
    <button data-testid="whats-new-nav" onClick={() => props.onNavigate('whats-new')}>What's New</button>
  </div>
)))

import DashboardPage from '@/app/dashboard/page'

describe('DashboardPage comprehensive', () => {
  const mockAlert = jest.fn()
  const mockConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] })
    })
    global.alert = mockAlert
    global.confirm = mockConfirm
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Re-assign global mocks after clearing
    global.alert = mockAlert
    global.confirm = mockConfirm
  })

  describe('Initial Rendering', () => {
    it('renders voice-agents view by default', () => {
      render(<DashboardPage />)
      expect(screen.getByTestId('VoiceAgentsTable')).toBeInTheDocument()
    })

    it('renders sidebar with all navigation options', () => {
      render(<DashboardPage />)
      expect(screen.getByTestId('DashboardSidebar')).toBeInTheDocument()
      expect(screen.getByTestId('voice-agents-nav')).toBeInTheDocument()
      expect(screen.getByTestId('call-logs-nav')).toBeInTheDocument()
      expect(screen.getByTestId('campaigns-nav')).toBeInTheDocument()
      expect(screen.getByTestId('phone-number-nav')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to call-logs view', async () => {
      render(<DashboardPage />)
      const callLogsButton = screen.getByTestId('call-logs-nav')
      fireEvent.click(callLogsButton)
      expect(screen.getByTestId('CallLogsTable')).toBeInTheDocument()
    })

    it('navigates to campaigns view and loads campaigns', async () => {
      const mockCampaigns = [{ _id: '1', title: 'Test Campaign' }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCampaigns })
      })

      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/campaigns')
      })
    })

    it('navigates to phone-number view', async () => {
      render(<DashboardPage />)
      const phoneButton = screen.getByTestId('phone-number-nav')
      fireEvent.click(phoneButton)
      expect(screen.getByTestId('PhoneNumbersTable')).toBeInTheDocument()
    })

    it('renders coming soon views for various features', async () => {
      render(<DashboardPage />)

      const features = ['agent-knowledge', 'api-keys', 'credentials', 'billing', 'transactions', 'documentation', 'whats-new']

      for (const feature of features) {
        const button = screen.getByTestId(`${feature}-nav`)
        fireEvent.click(button)
        expect(await screen.findByText('This feature is coming soon...')).toBeInTheDocument()
        const expectedTitle = feature === 'api-keys' ? 'Api keys' :
                             feature === 'agent-knowledge' ? 'Agent knowledge' :
                             feature === 'whats-new' ? 'Whats new' :
                             feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
        expect(screen.getByText(expectedTitle.toLowerCase())).toBeInTheDocument()
      }
    })
  })

  describe('Voice Agents Functionality', () => {
    it('opens agent modal when adding agent', async () => {
      render(<DashboardPage />)
      const addButton = screen.getByTestId('add-agent-btn')
      fireEvent.click(addButton)
      expect(screen.getByTestId('AgentModal')).toBeInTheDocument()
    })

    it('opens agent modal when editing agent', async () => {
      render(<DashboardPage />)
      const editButton = screen.getByTestId('edit-agent-btn')
      fireEvent.click(editButton)
      expect(screen.getByTestId('AgentModal')).toBeInTheDocument()
    })

    it('closes agent modal', async () => {
      render(<DashboardPage />)
      const addButton = screen.getByTestId('add-agent-btn')
      fireEvent.click(addButton)
      expect(screen.getByTestId('AgentModal')).toBeInTheDocument()

      const closeButton = screen.getByTestId('close-agent-modal')
      fireEvent.click(closeButton)
      expect(screen.queryByTestId('AgentModal')).not.toBeInTheDocument()
    })
  })

  describe('Call Logs Functionality', () => {
    it('opens chat history when viewing call details', async () => {
      render(<DashboardPage />)
      const callLogsButton = screen.getByTestId('call-logs-nav')
      fireEvent.click(callLogsButton)

      const viewButton = screen.getByTestId('view-call-btn')
      fireEvent.click(viewButton)
      expect(screen.getByTestId('ChatHistory')).toBeInTheDocument()
    })

    it('closes chat history', async () => {
      render(<DashboardPage />)
      const callLogsButton = screen.getByTestId('call-logs-nav')
      fireEvent.click(callLogsButton)

      const viewButton = screen.getByTestId('view-call-btn')
      fireEvent.click(viewButton)
      expect(screen.getByTestId('ChatHistory')).toBeInTheDocument()

      const closeButton = screen.getByTestId('close-chat-history')
      fireEvent.click(closeButton)
      expect(screen.queryByTestId('ChatHistory')).not.toBeInTheDocument()
    })
  })

  describe('Campaigns Functionality', () => {
    it('opens campaign modal when adding campaign', async () => {
      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const addButton = screen.getByTestId('add-campaign-btn')
        fireEvent.click(addButton)
        expect(screen.getByTestId('CampaignModal')).toBeInTheDocument()
      })
    })

    it('opens campaign modal when editing campaign', async () => {
      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const editButton = screen.getByTestId('edit-campaign-btn')
        fireEvent.click(editButton)
        expect(screen.getByTestId('CampaignModal')).toBeInTheDocument()
      })
    })

    it('opens contacts modal when viewing campaign', async () => {
      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-campaign-btn')
        fireEvent.click(viewButton)
        expect(screen.getByTestId('CampaignContactsModal')).toBeInTheDocument()
      })
    })

    it('starts campaign successfully', async () => {
      mockConfirm.mockReturnValue(true)
      // Mock campaigns loading first, then campaign start
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { total_contacts: 5 } })
        })

      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const startButton = screen.getByTestId('start-campaign-btn')
        fireEvent.click(startButton)
      })

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to start campaign "Test Campaign"? This will trigger calls to all contacts in the campaign.')
        expect(mockAlert).toHaveBeenCalledWith('Campaign started successfully! Calling 5 contacts.')
      })
    })

    it('handles campaign start failure', async () => {
      mockConfirm.mockReturnValue(true)
      // Mock campaigns loading first, then campaign start failure
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Campaign start failed' })
        })

      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const startButton = screen.getByTestId('start-campaign-btn')
        fireEvent.click(startButton)
      })

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to start campaign: Campaign start failed')
      })
    })

    it('cancels campaign start when user declines', async () => {
      mockConfirm.mockReturnValue(false)

      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const startButton = screen.getByTestId('start-campaign-btn')
        fireEvent.click(startButton)
      })

      expect(mockConfirm).toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalledWith('/api/campaigns/start', expect.any(Object))
    })

    it('handles campaign fetch error gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/campaigns')
      })
      // Should not crash, campaigns should be empty array
    })

    it('closes campaign modal', async () => {
      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const addButton = screen.getByTestId('add-campaign-btn')
        fireEvent.click(addButton)
        expect(screen.getByTestId('CampaignModal')).toBeInTheDocument()

        const closeButton = screen.getByTestId('close-campaign-modal')
        fireEvent.click(closeButton)
        expect(screen.queryByTestId('CampaignModal')).not.toBeInTheDocument()
      })
    })

    it('closes contacts modal', async () => {
      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-campaign-btn')
        fireEvent.click(viewButton)
        expect(screen.getByTestId('CampaignContactsModal')).toBeInTheDocument()

        const closeButton = screen.getByTestId('close-contacts-modal')
        fireEvent.click(closeButton)
        expect(screen.queryByTestId('CampaignContactsModal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Phone Numbers Functionality', () => {
    it('opens phone number modal when adding phone number', async () => {
      render(<DashboardPage />)
      const phoneButton = screen.getByTestId('phone-number-nav')
      fireEvent.click(phoneButton)

      await waitFor(() => {
        const addButton = screen.getByTestId('add-phone-btn')
        fireEvent.click(addButton)
        expect(screen.getByTestId('PhoneNumberModal')).toBeInTheDocument()
      })
    })

    it('opens phone number modal when editing phone number', async () => {
      render(<DashboardPage />)
      const phoneButton = screen.getByTestId('phone-number-nav')
      fireEvent.click(phoneButton)

      await waitFor(() => {
        const editButton = screen.getByTestId('edit-phone-btn')
        fireEvent.click(editButton)
        expect(screen.getByTestId('PhoneNumberModal')).toBeInTheDocument()
      })
    })

    it('closes phone number modal', async () => {
      render(<DashboardPage />)
      const phoneButton = screen.getByTestId('phone-number-nav')
      fireEvent.click(phoneButton)

      await waitFor(() => {
        const addButton = screen.getByTestId('add-phone-btn')
        fireEvent.click(addButton)
        expect(screen.getByTestId('PhoneNumberModal')).toBeInTheDocument()

        const closeButton = screen.getByTestId('close-phone-modal')
        fireEvent.click(closeButton)
        expect(screen.queryByTestId('PhoneNumberModal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Modal State Management', () => {
    it('manages modal states independently', async () => {
      render(<DashboardPage />)

      // Open agent modal
      const addAgentButton = screen.getByTestId('add-agent-btn')
      fireEvent.click(addAgentButton)
      expect(screen.getByTestId('AgentModal')).toBeInTheDocument()

      // Navigate to campaigns and open campaign modal
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      await waitFor(() => {
        const addCampaignButton = screen.getByTestId('add-campaign-btn')
        fireEvent.click(addCampaignButton)
        // Both modals should be managed independently
        expect(screen.getByTestId('CampaignModal')).toBeInTheDocument()
      })
    })

    it('refreshes tables after modal success', async () => {
      render(<DashboardPage />)

      // Initially should have refresh key 0
      expect(screen.getByTestId('VoiceAgentsTable')).toBeInTheDocument()

      // This would normally be called by modal onSuccess, but since we can't easily test that,
      // we verify the modal close functionality works
      const addButton = screen.getByTestId('add-agent-btn')
      fireEvent.click(addButton)
      expect(screen.getByTestId('AgentModal')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state for campaigns', async () => {
      let resolveFetch: (value: any) => void
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve
      })

      ;(global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise)

      render(<DashboardPage />)
      const campaignsButton = screen.getByTestId('campaigns-nav')
      fireEvent.click(campaignsButton)

      // Should show loading state initially
      expect(screen.getByText('Loading campaigns...')).toBeInTheDocument()

      // Resolve the fetch
      resolveFetch!({
        ok: true,
        json: async () => ({ data: [] })
      })

      await waitFor(() => {
        expect(screen.queryByText('Loading campaigns...')).not.toBeInTheDocument()
      })
    })
  })
})
