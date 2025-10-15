import Sidebar from '@/components/Sidebar'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Sidebar CRUD flows', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL, init?: RequestInit) => {
      const s = String(url)
      if (s.includes('/api/chat/sessions')) {
        return Promise.resolve({ ok: true, json: async () => ({ sessions: [] }) })
      }
      if (s.includes('/api/voice-agents') && (!init || init.method === 'GET')) {
        return Promise.resolve({ ok: true, json: async () => ({ agents: [{ id: 'a1', userId: 'u', title: 'Agent 1', prompt: 'P1', createdAt: '', lastUpdated: '' }] }) })
      }
      if (s.includes('/api/voice-agents') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      if (s.includes('/api/voice-agents') && init?.method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      if (s.includes('/api/voice-agents') && init?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    // Silence confirm/alert in tests
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    jest.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('creates, edits and deletes an agent', async () => {
    const user = userEvent.setup()
    render(
      <Sidebar isOpen={true} onToggle={() => {}} onSelectAgent={() => {}} onViewSession={() => {}} />
    )

    // Switch to agents tab and open form
    await user.click(screen.getByText('Agents'))
    const newBtn = await screen.findByText('New Agent')
    await user.click(newBtn)

    // Fill and create
    await user.type(screen.getByPlaceholderText('Agent Title'), 'New Agent')
    await user.type(screen.getByPlaceholderText('System Prompt'), 'Be helpful')
    await user.click(screen.getByText('Create'))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/voice-agents', expect.objectContaining({ method: 'POST' })))

    // Start editing existing agent
    const editButtons = await screen.findAllByTitle('Edit')
    await user.click(editButtons[0])
    await user.clear(screen.getByPlaceholderText('Agent Title'))
    await user.type(screen.getByPlaceholderText('Agent Title'), 'Updated Agent')
    await user.click(screen.getByText('Update'))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/voice-agents', expect.objectContaining({ method: 'PUT' })))

    // Delete
    const deleteButtons = await screen.findAllByTitle('Delete')
    await user.click(deleteButtons[0])

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/voice-agents?id='), expect.objectContaining({ method: 'DELETE' })))
  })
})
