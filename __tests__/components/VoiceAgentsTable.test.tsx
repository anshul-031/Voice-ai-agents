import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VoiceAgentsTable from '@/components/VoiceAgentsTable'
import { mockFetchResponse } from '../test-utils'

// Mock fetch
global.fetch = jest.fn()

describe('VoiceAgentsTable', () => {
    const mockOnAddAgent = jest.fn()
    const mockOnEditAgent = jest.fn()

    const mockAgents = [
        {
            id: '1',
            title: 'EMI Reminder',
            prompt: 'You are Riya, a professional EMI collection assistant...',
            userId: 'mukul',
            lastUpdated: '2025-10-08T10:00:00Z',
            createdAt: '2025-10-01T10:00:00Z',
        },
        {
            id: '2',
            title: 'Customer Support',
            prompt: 'You are a helpful customer support representative...',
            userId: 'mukul',
            lastUpdated: '2025-10-07T10:00:00Z',
            createdAt: '2025-10-02T10:00:00Z',
        },
    ]

    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockResolvedValue(
                mockFetchResponse({
                    success: true,
                    agents: mockAgents,
                    count: mockAgents.length,
                })
            )
    })

    describe('Rendering', () => {
        it('should render the header with title and Add button', async () => {
            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            expect(screen.getByText('Voice Agents')).toBeInTheDocument()
            expect(screen.getByText('Add')).toBeInTheDocument()
        })

        it('should show loading state initially', () => {
            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            expect(screen.getByText('Loading...')).toBeInTheDocument()
        })

        it('should fetch and display agents', async () => {
            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
                expect(screen.getByText('Customer Support')).toBeInTheDocument()
            })

            expect(global.fetch).toHaveBeenCalledWith('/api/voice-agents?userId=mukul')
        })

        it('should display table headers', async () => {
            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('Name')).toBeInTheDocument()
            })

            expect(screen.getByText('Created')).toBeInTheDocument()
            expect(screen.getByText('Status')).toBeInTheDocument()
        })

        it('should display agent information', async () => {
            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            // Check truncated prompt
            expect(screen.getByText(/You are Riya, a professional EMI collection assistant/)).toBeInTheDocument()

            // Check status
            expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
        })

        it('should show empty state when no agents', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue(
                mockFetchResponse({
                    success: true,
                    agents: [],
                    count: 0,
                })
            )

            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('No voice agents yet. Click "Add" to create one.')).toBeInTheDocument()
            })
        })

        it('should handle empty agents array from API', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue(
                mockFetchResponse({
                    success: true,
                    agents: [],
                })
            )

            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.queryByText('EMI Reminder')).not.toBeInTheDocument()
            })
        })
    })

    describe('Add Agent Button', () => {
        it('should call onAddAgent when clicking Add button', async () => {
            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            fireEvent.click(screen.getByText('Add'))
            expect(mockOnAddAgent).toHaveBeenCalledTimes(1)
        })
    })

    describe('Agent Actions', () => {
        it('should open action menu when clicking three dots', async () => {
            const { container } = render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            // Get all buttons - first is Add, then we have menu buttons for each agent
            const allButtons = screen.getAllByRole('button')
            // The second button should be the menu button for the first agent
            const moreButton = allButtons[1] // 0 = Add button, 1 = first agent menu button

            fireEvent.click(moreButton)

            await waitFor(() => {
                expect(screen.getByText('Edit')).toBeInTheDocument()
                expect(screen.getByText('Delete')).toBeInTheDocument()
            })
        })

        it('should close action menu when clicking outside', async () => {
            const { container } = render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            // Open menu - get second button (first agent's menu button)
            const menuButtons = screen.getAllByRole('button')
            const moreButton = menuButtons[1]

            fireEvent.click(moreButton)

            await waitFor(() => {
                expect(screen.getByText('Edit')).toBeInTheDocument()
            })

            // Click outside (on the backdrop)
            const backdrop = container.querySelector('div.fixed.inset-0')
            expect(backdrop).toBeTruthy()
            fireEvent.click(backdrop!)

            await waitFor(() => {
                expect(screen.queryByText('Edit')).not.toBeInTheDocument()
            })
        })

        it('should call onEditAgent when clicking Edit', async () => {
            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            // Open menu and click Edit
            const menuButtons = screen.getAllByRole('button')
            const moreButton = menuButtons[menuButtons.length - 2] // Second to last button (before last one which might be another menu)

            fireEvent.click(moreButton)

            await waitFor(() => {
                const editButton = screen.getByText('Edit')
                fireEvent.click(editButton)
                expect(mockOnEditAgent).toHaveBeenCalled()
            })
        })

        it('should delete agent after confirmation', async () => {
            global.confirm = jest.fn(() => true)
                ; (global.fetch as jest.Mock)
                    .mockResolvedValueOnce(
                        mockFetchResponse({
                            success: true,
                            agents: mockAgents,
                            count: mockAgents.length,
                        })
                    )
                    .mockResolvedValueOnce(
                        mockFetchResponse({ success: true })
                    )

            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            // Open menu
            const menuButtons = screen.getAllByRole('button')
            const moreButton = menuButtons[menuButtons.length - 2]

            fireEvent.click(moreButton)

            await waitFor(() => {
                const deleteButton = screen.getByText('Delete')
                fireEvent.click(deleteButton)
            })

            expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this agent?')

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/voice-agents',
                    expect.objectContaining({
                        method: 'DELETE',
                    })
                )
            })
        })

        it('should not delete agent when confirmation is cancelled', async () => {
            global.confirm = jest.fn(() => false)

            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            const initialFetchCalls = (global.fetch as jest.Mock).mock.calls.length

            // Open menu
            const menuButtons = screen.getAllByRole('button')
            const moreButton = menuButtons[menuButtons.length - 2]

            fireEvent.click(moreButton)

            await waitFor(() => {
                const deleteButton = screen.getByText('Delete')
                fireEvent.click(deleteButton)
            })

            expect(global.confirm).toHaveBeenCalled()

            // Should not call delete API
            expect((global.fetch as jest.Mock).mock.calls.length).toBe(initialFetchCalls)
        })
    })

    describe('Error Handling', () => {
        it('should handle fetch error gracefully', async () => {
            ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
            })

            // Should show empty state on error
            expect(screen.getByText('No voice agents yet. Click "Add" to create one.')).toBeInTheDocument()
        })

        it('should handle non-ok response', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 500,
            })

            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
            })

            expect(screen.getByText('No voice agents yet. Click "Add" to create one.')).toBeInTheDocument()
        })

        it('should handle delete error gracefully', async () => {
            global.confirm = jest.fn(() => true)
                ; (global.fetch as jest.Mock)
                    .mockResolvedValueOnce(
                        mockFetchResponse({
                            success: true,
                            agents: mockAgents,
                        })
                    )
                    .mockRejectedValueOnce(new Error('Delete failed'))

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            // Try to delete
            const menuButtons = screen.getAllByRole('button')
            const moreButton = menuButtons[menuButtons.length - 2]

            fireEvent.click(moreButton)

            await waitFor(() => {
                const deleteButton = screen.getByText('Delete')
                fireEvent.click(deleteButton)
            })

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Error deleting agent:',
                    expect.any(Error)
                )
            })

            consoleSpy.mockRestore()
        })
    })

    describe('Date Formatting', () => {
        it('should format dates correctly', async () => {
            render(
                <VoiceAgentsTable
                    onAddAgent={mockOnAddAgent}
                    onEditAgent={mockOnEditAgent}
                />
            )

            await waitFor(() => {
                expect(screen.getByText('EMI Reminder')).toBeInTheDocument()
            })

            // Check that dates are formatted (should contain month names)
            const octElements = screen.getAllByText(/Oct/)
            expect(octElements.length).toBeGreaterThan(0)
        })
    })
})
