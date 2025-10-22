/**
 * @jest-environment jsdom
 */

import DashboardPage from '@/app/dashboard/page'
import { fireEvent, render, waitFor } from '@testing-library/react'

jest.mock('@/components/AgentModal', () => () => null)
jest.mock('@/components/CallLogsTable', () => () => null)
jest.mock('@/components/CampaignContactsModal', () => () => null)
jest.mock('@/components/CampaignModal', () => () => null)
jest.mock('@/components/ChatHistory', () => () => null)
jest.mock('@/components/PhoneNumberModal', () => () => null)
jest.mock('@/components/PhoneNumbersTable', () => () => null)
jest.mock('@/components/VoiceAgentsTable', () => () => null)
jest.mock('@/components/WhatsAppNumberModal', () => () => null)
jest.mock('@/components/WhatsAppNumbersTable', () => () => null)

jest.mock('@/components/DashboardSidebar', () => {
  const React = require('react')
  return function MockDashboardSidebar({ onNavigate }: { onNavigate: (view: string) => void }) {
    React.useEffect(() => {
      onNavigate('campaigns')
    }, [onNavigate])
    return <div data-testid="sidebar" />
  }
})

declare global {
  var __campaignsTableLatestProps: any
}

global.__campaignsTableLatestProps = undefined

jest.mock('@/components/CampaignsTable', () => {
  const React = require('react')

  return function MockCampaignsTable(props: any) {
    global.__campaignsTableLatestProps = props

    return (
      <div data-testid="campaigns-table">
        {props.campaigns.map((campaign: any) => (
          <button
            key={campaign._id}
            data-testid={`start-${campaign._id}`}
            onClick={() => props.onStartCampaign(campaign)}
          >
            Start {campaign.title}
          </button>
        ))}
      </div>
    )
  }
})

const mockCampaigns = [
  {
    _id: 'running-1',
    title: 'Running Campaign',
    status: 'running',
    start_date: '2025-01-01',
    updated_at: '2025-01-02',
    agent_id: 'agent-a',
    user_id: 'user-a'
  },
  {
    _id: 'stopped-1',
    title: 'Stopped Campaign',
    status: 'stopped',
    start_date: '2025-01-03',
    updated_at: '2025-01-04',
    agent_id: 'agent-b',
    user_id: 'user-b'
  }
]

describe('DashboardPage start campaign flow', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    global.__campaignsTableLatestProps = undefined
    fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string' && input === '/api/campaigns/start') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        } as Response
      }
      
      if (typeof input === 'string' && input === '/api/campaigns') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockCampaigns })
        } as Response
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ data: mockCampaigns })
      } as Response
    })
    
    global.fetch = fetchMock as unknown as typeof fetch
    window.fetch = fetchMock as unknown as typeof fetch
    window.confirm = jest.fn()
    window.alert = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const renderDashboard = async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(global.__campaignsTableLatestProps?.campaigns?.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  }

  it('alerts immediately when campaign is already running', async () => {
    await renderDashboard()

    const startButton = await waitFor(() =>
      document.querySelector('[data-testid="start-running-1"]') as HTMLButtonElement
    )

    fireEvent.click(startButton)

    expect(window.alert).toHaveBeenCalledWith('Campaign is already running.')
    expect(window.confirm).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not start campaign when confirmation is cancelled', async () => {
    await renderDashboard()

    ;(window.confirm as jest.Mock).mockReturnValue(false)

    const startButton = await waitFor(() =>
      document.querySelector('[data-testid="start-stopped-1"]') as HTMLButtonElement
    )

    fireEvent.click(startButton)

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(window.alert).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('starts campaign when confirmed and shows success alert', async () => {
    await renderDashboard()

    ;(window.confirm as jest.Mock).mockReturnValue(true)

    const startButton = await waitFor(() =>
      document.querySelector('[data-testid="start-stopped-1"]') as HTMLButtonElement
    )

    fireEvent.click(startButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/campaigns/start',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ campaign_id: 'stopped-1' })
        })
      )
    })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Campaign starting. Calls are being placed.')
    })
  })
})
