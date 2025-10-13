import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'

// Mock heavy children used by DashboardPage
jest.mock('@/components/DashboardSidebar', () => (props: any) => (
  <div data-testid="DashboardSidebar" onClick={() => props.onNavigate?.('campaigns')}>Sidebar</div>
))
jest.mock('@/components/VoiceAgentsTable', () => (props: any) => (
  <div data-testid="VoiceAgentsTable" onClick={() => props.onAddAgent?.()}>AgentsTable</div>
))
jest.mock('@/components/CallLogsTable', () => (props: any) => (
  <div data-testid="CallLogsTable" onClick={() => props.onViewCallDetails?.('s1')}>CallLogs</div>
))
jest.mock('@/components/CampaignsTable', () => (props: any) => (
  <div data-testid="CampaignsTable" onClick={() => props.onAddCampaign?.()}>Campaigns</div>
))
jest.mock('@/components/AgentModal', () => (props: any) => (props.isOpen ? <div data-testid="AgentModal" /> : null))
jest.mock('@/components/CampaignModal', () => (props: any) => (props.isOpen ? <div data-testid="CampaignModal" /> : null))
jest.mock('@/components/CampaignContactsModal', () => (props: any) => (props.isOpen ? <div data-testid="CampaignContactsModal" /> : null))
jest.mock('@/components/ChatHistory', () => (props: any) => (props.isOpen ? <div data-testid="ChatHistory" /> : null))

import DashboardPage from '@/app/dashboard/page'

describe('DashboardPage smoke', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/campaigns')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  it('renders and navigates to campaigns view', async () => {
    render(<DashboardPage />)

    // Sidebar mock is present; click it to navigate to campaigns
    const sidebar = screen.getByTestId('DashboardSidebar')
    sidebar.click()

    // Loading state then CampaignsTable
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/campaigns')
    })
    expect(await screen.findByTestId('CampaignsTable')).toBeInTheDocument()
  })
})
