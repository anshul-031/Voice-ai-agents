import Sidebar from '@/components/Sidebar'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function setup(fetchImpl?: jest.Mock) {
  if (fetchImpl) {
    ;(global.fetch as jest.Mock) = fetchImpl
  } else {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [] }) })
      }
      if (s.includes('/api/voice-agents')) {
        return Promise.resolve({ ok: true, json: async () => ({ agents: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  }
}

describe('Sidebar', () => {
  it('toggles open/close and tabs and triggers fetches', async () => {
    setup()

    const onToggle = jest.fn()
    const onSelectAgent = jest.fn()
    const onViewSession = jest.fn()

    render(
      <Sidebar
        isOpen={true}
        onToggle={onToggle}
        onSelectAgent={onSelectAgent}
        onViewSession={onViewSession}
      />
    )

    // Should show tabs
    expect(screen.getByText('Call Log')).toBeInTheDocument()
    expect(screen.getByText('Agents')).toBeInTheDocument()

    // Switch to Agents tab triggers fetch
    await userEvent.click(screen.getByText('Agents'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Toggle sidebar
    await userEvent.click(screen.getByRole('button', { name: '' }))
    expect(onToggle).toHaveBeenCalled()
  })

  it('handles agent form validation', async () => {
    setup()
    const user = userEvent.setup()

    render(
      <Sidebar
        isOpen={true}
        onToggle={() => {}}
        onSelectAgent={() => {}}
        onViewSession={() => {}}
      />
    )

    // open Agents tab
    await user.click(screen.getByText('Agents'))
    // click New Agent
    const newBtn = await screen.findByText('New Agent')
    await user.click(newBtn)

    // try to save without fields -> triggers alert; mock it
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    await user.click(screen.getByText(/Create|Update/))
    expect(alertSpy).toHaveBeenCalled()
    alertSpy.mockRestore()
  })
})
