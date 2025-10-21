import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Sidebar from '@/components/Sidebar'

const fetchMock = jest.spyOn(global, 'fetch')

beforeEach(() => {
  jest.clearAllMocks()
})

test('shows alert when update agent API fails', async () => {
  // Prepare an existing agent to edit
  fetchMock.mockImplementation((url: RequestInfo | URL, init?: any) => {
    const s = String(url)
    if (s.includes('/api/voice-agents') && (!init || init.method === 'GET')) {
      return Promise.resolve({ ok: true, json: async () => ({ agents: [{ id: 'a1', title: 'A1', prompt: 'p', lastUpdated: new Date().toISOString(), userId: 'mukul', createdAt: new Date().toISOString() }] }) } as any)
    }
    // For PUT (update) return non-ok
    if (s.includes('/api/voice-agents') && init && init.method === 'PUT') {
      return Promise.resolve({ ok: false, json: async () => ({ error: 'update failed' }) } as any)
    }
    return Promise.resolve({ ok: true, json: async () => ({}) } as any)
  })

  render(<Sidebar isOpen={true} onToggle={() => {}} onSelectAgent={() => {}} onViewSession={() => {}} />)

  // Switch to agents
  await userEvent.click(screen.getByText('Agents'))

  // Wait for agent to appear
  await waitFor(() => expect(screen.getByText('A1')).toBeInTheDocument())

  // Click edit
  const editBtn = screen.getByTitle('Edit')
  await userEvent.click(editBtn)

  // Change title and click Update
  await userEvent.clear(screen.getByPlaceholderText('Agent Title'))
  await userEvent.type(screen.getByPlaceholderText('Agent Title'), 'A1 Updated')

  // Spy on alert
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

  await userEvent.click(screen.getByText('Update'))

  await waitFor(() => expect(alertSpy).toHaveBeenCalled())
  alertSpy.mockRestore()
})

test('shows alert when delete agent API fails', async () => {
  fetchMock.mockImplementation((url: RequestInfo | URL, init?: any) => {
    const s = String(url)
    if (s.includes('/api/voice-agents') && (!init || init.method === 'GET')) {
      return Promise.resolve({ ok: true, json: async () => ({ agents: [{ id: 'a1', title: 'A1', prompt: 'p', lastUpdated: new Date().toISOString(), userId: 'mukul', createdAt: new Date().toISOString() }] }) } as any)
    }
    if (s.includes('/api/voice-agents') && init && init.method === 'DELETE') {
      return Promise.resolve({ ok: false, json: async () => ({ error: 'delete failed' }) } as any)
    }
    return Promise.resolve({ ok: true, json: async () => ({}) } as any)
  })

  // Mock confirm to always return true
  const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true)
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

  render(<Sidebar isOpen={true} onToggle={() => {}} onSelectAgent={() => {}} onViewSession={() => {}} />)

  await userEvent.click(screen.getByText('Agents'))
  await waitFor(() => expect(screen.getByText('A1')).toBeInTheDocument())

  // Click delete icon (Trash2) - find by title attribute set in component
  const deleteBtn = screen.getByTitle('Delete')
  await userEvent.click(deleteBtn)

  await waitFor(() => expect(alertSpy).toHaveBeenCalled())

  confirmSpy.mockRestore()
  alertSpy.mockRestore()
})
