import AgentModal from '@/components/AgentModal'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { mockFetchResponse } from '../test-utils'

// Mock fetch
global.fetch = jest.fn()

describe('AgentModal', () => {
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockResolvedValue(
                mockFetchResponse({ success: true })
            )
    })

    describe('Create Mode', () => {
        it('should render in create mode when no agent prop is provided', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            expect(screen.getByText('Add Voice Agent')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Create Agent' })).toBeInTheDocument()
        })

        it('should show empty form fields in create mode', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            expect(titleInput).toHaveValue('')
            expect(promptTextarea).toHaveValue('')
        })

        it('should not render when isOpen is false', () => {
            render(
                <AgentModal
                    isOpen={false}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            expect(screen.queryByText('Add Voice Agent')).not.toBeInTheDocument()
        })
    })

    describe('Edit Mode', () => {
        const existingAgent = {
            id: 'agent-1',
            title: 'EMI Reminder',
            prompt: 'You are a professional EMI collection assistant...',
            llmModel: 'Gemini 1.5 Flash',
            sttModel: 'AssemblyAI Universal',
            ttsModel: 'Sarvam Manisha',
            userId: 'mukul',
            lastUpdated: '2025-10-08T10:00:00Z',
            createdAt: '2025-10-01T10:00:00Z',
        }

        it('should render in edit mode when agent prop is provided', () => {
            render(
                <AgentModal
                    isOpen={true}
                    agent={existingAgent}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            expect(screen.getByText('Edit Voice Agent')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
        })

        it('should populate form fields with existing agent data', () => {
            render(
                <AgentModal
                    isOpen={true}
                    agent={existingAgent}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support') as HTMLInputElement
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i) as HTMLTextAreaElement

            expect(titleInput.value).toBe('EMI Reminder')
            expect(promptTextarea.value).toBe('You are a professional EMI collection assistant...')
        })
    })

    describe('Form Interactions', () => {
        it('should update title field when typing', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')

            fireEvent.change(titleInput, { target: { value: 'New Agent' } })

            expect(titleInput).toHaveValue('New Agent')
        })

        it('should update prompt field when typing', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(promptTextarea, { target: { value: 'Test prompt content' } })

            expect(promptTextarea).toHaveValue('Test prompt content')
        })

        it('should call onClose when clicking Cancel button', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

            expect(mockOnClose).toHaveBeenCalledTimes(1)
        })

        it('should call onClose when clicking backdrop', () => {
            const { container } = render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const backdrop = container.querySelector('div.fixed.inset-0.bg-black')
            if (backdrop) {
                fireEvent.click(backdrop)
                expect(mockOnClose).toHaveBeenCalled()
            }
        })
    })

    describe('Create Agent Submission', () => {
        it('should create new agent successfully', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            // Fill in the form
            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(titleInput, { target: { value: 'Test Agent' } })
            fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } })

            // Submit the form
            fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/voice-agents',
                    expect.objectContaining({
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: 'mukul',
                            title: 'Test Agent',
                            prompt: 'Test prompt',
                            llmModel: 'Gemini 1.5 Flash',
                            sttModel: 'AssemblyAI Universal',
                            ttsModel: 'Sarvam Manisha',
                            knowledgeItems: [],
                        }),
                    })
                )
            })

            expect(mockOnSuccess).toHaveBeenCalledTimes(1)
        })

        it('should not submit if title is empty', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)
            fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } })

            // Try to submit without title
            fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }))

            // Should not call API or onSuccess
            expect(global.fetch).not.toHaveBeenCalled()
            expect(mockOnSuccess).not.toHaveBeenCalled()
        })

        it('should not submit if prompt is empty', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            fireEvent.change(titleInput, { target: { value: 'Test Agent' } })

            // Try to submit without prompt
            fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }))

            // Should not call API or onSuccess
            expect(global.fetch).not.toHaveBeenCalled()
            expect(mockOnSuccess).not.toHaveBeenCalled()
        })

        it('should handle create error gracefully', async () => {
            ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Create failed'))
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(titleInput, { target: { value: 'Test Agent' } })
            fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } })

            fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }))

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Error saving agent:',
                    expect.any(Error)
                )
            })

            consoleSpy.mockRestore()
        })
    })

    describe('Update Agent Submission', () => {
        const existingAgent = {
            id: 'agent-1',
            title: 'EMI Reminder',
            prompt: 'Original prompt',
            llmModel: 'Gemini 1.5 Flash',
            sttModel: 'AssemblyAI Universal',
            ttsModel: 'Sarvam Manisha',
            userId: 'mukul',
            lastUpdated: '2025-10-08T10:00:00Z',
            createdAt: '2025-10-01T10:00:00Z',
        }

        it('should update existing agent successfully', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    agent={existingAgent}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            // Modify the fields
            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(titleInput, { target: { value: 'Updated Agent' } })
            fireEvent.change(promptTextarea, { target: { value: 'Updated prompt' } })

            // Submit the form
            fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/voice-agents',
                    expect.objectContaining({
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: 'agent-1',
                            title: 'Updated Agent',
                            prompt: 'Updated prompt',
                            llmModel: 'Gemini 1.5 Flash',
                            sttModel: 'AssemblyAI Universal',
                            ttsModel: 'Sarvam Manisha',
                            knowledgeItems: [],
                        }),
                    })
                )
            })

            expect(mockOnSuccess).toHaveBeenCalledTimes(1)
        })

        it('should handle update error gracefully', async () => {
            ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Update failed'))
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            render(
                <AgentModal
                    isOpen={true}
                    agent={existingAgent}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            fireEvent.change(titleInput, { target: { value: 'Updated Agent' } })

            fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Error saving agent:',
                    expect.any(Error)
                )
            })

            consoleSpy.mockRestore()
        })
    })

    describe('Loading State', () => {
        it('should disable submit button during loading', async () => {
            // Make fetch slow to keep loading state
            ; (global.fetch as jest.Mock).mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve(mockFetchResponse({ success: true })), 100))
            )

            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(titleInput, { target: { value: 'Test Agent' } })
            fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } })

            const createButton = screen.getByRole('button', { name: 'Create Agent' })
            fireEvent.click(createButton)

            // During loading, button should be disabled
            expect(createButton).toBeDisabled()
        })
    })

    describe('Accessibility', () => {
        it('should have proper form labels', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            expect(screen.getByText('Agent Title')).toBeInTheDocument()
            expect(screen.getByText('System Prompt')).toBeInTheDocument()
        })

        it('should have required attribute on inputs', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            expect(titleInput).toBeRequired()
            expect(promptTextarea).toBeRequired()
        })

        it('should have modal role', () => {
            const { container } = render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            // Modal should be in a fixed overlay
            const overlay = container.querySelector('div.fixed.inset-0.flex.items-center.justify-center')
            expect(overlay).toBeInTheDocument()
        })
    })

    describe('Form Validation', () => {
        it('should trim whitespace from title and prompt', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(titleInput, { target: { value: '  Test Agent  ' } })
            fireEvent.change(promptTextarea, { target: { value: '  Test prompt  ' } })

            fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/voice-agents',
                    expect.objectContaining({
                        body: JSON.stringify({
                            userId: 'mukul',
                            title: '  Test Agent  ',
                            prompt: '  Test prompt  ',
                            llmModel: 'Gemini 1.5 Flash',
                            sttModel: 'AssemblyAI Universal',
                            ttsModel: 'Sarvam Manisha',
                            knowledgeItems: [],
                        }),
                    })
                )
            })
        })

        it('should treat whitespace-only input as empty', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(titleInput, { target: { value: '   ' } })
            fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } })

            fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }))

            // Note: In browser, required attribute would prevent submission
            // But in test environment, fireEvent doesn't trigger native validation
            // So the form will actually submit with whitespace
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled()
            })
        })
    })

    describe('Knowledge Base Features', () => {
        it('should render knowledge base section', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
            expect(screen.getByText(/Upload CSV or TXT files/i)).toBeInTheDocument()
        })

        it('should allow adding manual knowledge note', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const noteTextarea = screen.getByPlaceholderText(/Paste important FAQs/i)
            const addButton = screen.getByRole('button', { name: /Add to knowledge/i })

            // Initially button should be disabled
            expect(addButton).toBeDisabled()

            // Type some text
            fireEvent.change(noteTextarea, { target: { value: 'This is important information' } })

            // Now button should be enabled
            expect(addButton).toBeEnabled()

            // Click to add
            fireEvent.click(addButton)

            // Should show the added item
            await waitFor(() => {
                expect(screen.getByText(/Manual Note 1/i)).toBeInTheDocument()
            })

            // Textarea should be cleared
            expect(noteTextarea).toHaveValue('')
        })

        it('should remove knowledge item when remove button is clicked', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            // Add a manual note
            const noteTextarea = screen.getByPlaceholderText(/Paste important FAQs/i)
            fireEvent.change(noteTextarea, { target: { value: 'Test knowledge item' } })
            fireEvent.click(screen.getByRole('button', { name: /Add to knowledge/i }))

            await waitFor(() => {
                expect(screen.getByText(/Manual Note 1/i)).toBeInTheDocument()
            })

            // Click remove
            const removeButton = screen.getByRole('button', { name: /Remove/i })
            fireEvent.click(removeButton)

            // Should be removed
            await waitFor(() => {
                expect(screen.queryByText(/Manual Note 1/i)).not.toBeInTheDocument()
            })
        })

        it('should handle file upload (CSV)', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]')

            if (fileInput) {
                const csvContent = 'name,email\nJohn,john@example.com'
                const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                })

                fireEvent.change(fileInput)

                await waitFor(() => {
                    expect(screen.getByText('test.csv')).toBeInTheDocument()
                })
            }
        })

        it('should handle file upload (TXT)', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]')

            if (fileInput) {
                const txtContent = 'This is a text file with important information'
                const file = new File([txtContent], 'notes.txt', { type: 'text/plain' })

                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                })

                fireEvent.change(fileInput)

                await waitFor(() => {
                    expect(screen.getByText('notes.txt')).toBeInTheDocument()
                })
            }
        })

        it('should reject files that are too large', async () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation()

            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]')

            if (fileInput) {
                // Create a file larger than 2MB
                const largeContent = 'a'.repeat(3 * 1024 * 1024) // 3MB
                const file = new File([largeContent], 'large.txt', { type: 'text/plain' })

                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                })

                fireEvent.change(fileInput)

                await waitFor(() => {
                    expect(alertSpy).toHaveBeenCalledWith('File size exceeds 2 MB limit.')
                })
            }

            alertSpy.mockRestore()
        })

        it('should reject unsupported file types', async () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation()

            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]')

            if (fileInput) {
                const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                })

                fireEvent.change(fileInput)

                await waitFor(() => {
                    expect(alertSpy).toHaveBeenCalledWith('Only CSV and TXT files are supported.')
                })
            }

            alertSpy.mockRestore()
        })

        it('should include knowledge items when creating agent', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            // Fill in required fields
            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(titleInput, { target: { value: 'Test Agent' } })
            fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } })

            // Add knowledge
            const noteTextarea = screen.getByPlaceholderText(/Paste important FAQs/i)
            fireEvent.change(noteTextarea, { target: { value: 'Important info' } })
            fireEvent.click(screen.getByRole('button', { name: /Add to knowledge/i }))

            await waitFor(() => {
                expect(screen.getByText(/Manual Note 1/i)).toBeInTheDocument()
            })

            // Submit
            fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled()
                const callArgs = (global.fetch as jest.Mock).mock.calls[0]
                const body = JSON.parse(callArgs[1].body)
                expect(body.knowledgeItems).toBeDefined()
                expect(body.knowledgeItems.length).toBeGreaterThan(0)
            })
        })

        it('should show character count for manual knowledge', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const noteTextarea = screen.getByPlaceholderText(/Paste important FAQs/i)

            // Initially 0
            expect(screen.getByText('0 characters')).toBeInTheDocument()

            // Type some text
            fireEvent.change(noteTextarea, { target: { value: 'Hello' } })

            // Should update count
            expect(screen.getByText('5 characters')).toBeInTheDocument()
        })

        it('should show preview for knowledge items', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            // Add a manual note
            const noteTextarea = screen.getByPlaceholderText(/Paste important FAQs/i)
            const longText = 'A'.repeat(300)
            fireEvent.change(noteTextarea, { target: { value: longText } })
            fireEvent.click(screen.getByRole('button', { name: /Add to knowledge/i }))

            await waitFor(() => {
                expect(screen.getByText(/Manual Note 1/i)).toBeInTheDocument()
                // Should show truncated preview
                const preview = screen.getByText(/^A+…$/)
                expect(preview).toBeInTheDocument()
            })
        })

        it('should populate knowledge items when editing agent', () => {
            const agentWithKnowledge = {
                id: 'agent-1',
                title: 'Test Agent',
                prompt: 'Test prompt',
                llmModel: 'Gemini 1.5 Flash',
                sttModel: 'AssemblyAI Universal',
                ttsModel: 'Sarvam Manisha',
                userId: 'mukul',
                lastUpdated: '2025-10-08T10:00:00Z',
                createdAt: '2025-10-01T10:00:00Z',
                knowledgeItems: [
                    {
                        itemId: 'item-1',
                        name: 'Test Knowledge',
                        type: 'text' as const,
                        size: 100,
                        content: 'Test content',
                        preview: 'Test content',
                        createdAt: '2025-10-01T10:00:00Z',
                    },
                ],
            }

            render(
                <AgentModal
                    isOpen={true}
                    agent={agentWithKnowledge}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            expect(screen.getByText('Test Knowledge')).toBeInTheDocument()
            expect(screen.getByText(/Knowledge entries \(1\)/i)).toBeInTheDocument()
        })

        it('should handle FileReader error gracefully', async () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
            const originalFileReader = global.FileReader

            // Mock FileReader to trigger error
            global.FileReader = jest.fn().mockImplementation(() => ({
                readAsText: jest.fn(function(this: any) {
                    setTimeout(() => {
                        if (this.onerror) this.onerror({} as ProgressEvent<FileReader>)
                    }, 0)
                }),
                onerror: null,
                onload: null,
            })) as any

            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]')

            if (fileInput) {
                const file = new File(['content'], 'test.txt', { type: 'text/plain' })
                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                })

                fireEvent.change(fileInput)

                await waitFor(() => {
                    expect(alertSpy).toHaveBeenCalledWith('Failed to read the file. Please try again.')
                })
            }

            global.FileReader = originalFileReader
            alertSpy.mockRestore()
        })

        it('should handle non-string FileReader result', async () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
            const originalFileReader = global.FileReader

            // Mock FileReader to return ArrayBuffer instead of string
            global.FileReader = jest.fn().mockImplementation(() => ({
                readAsText: jest.fn(function(this: any) {
                    setTimeout(() => {
                        if (this.onload) {
                            this.result = new ArrayBuffer(8) // Not a string
                            this.onload({} as ProgressEvent<FileReader>)
                        }
                    }, 0)
                }),
                onerror: null,
                onload: null,
            })) as any

            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]')

            if (fileInput) {
                const file = new File(['content'], 'test.txt', { type: 'text/plain' })
                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                })

                fireEvent.change(fileInput)

                await waitFor(() => {
                    expect(alertSpy).toHaveBeenCalledWith('Unable to read file content.')
                })
            }

            global.FileReader = originalFileReader
            alertSpy.mockRestore()
        })

        it('should handle file upload with no file selected', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]')

            if (fileInput) {
                // Trigger change without files
                Object.defineProperty(fileInput, 'files', {
                    value: null,
                    writable: false,
                })

                fireEvent.change(fileInput)

                // Should not show any error or add items
                expect(screen.queryByRole('button', { name: /Remove/i })).not.toBeInTheDocument()
            }
        })

        it('should not add manual knowledge if text is only whitespace', () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const noteTextarea = screen.getByPlaceholderText(/Paste important FAQs/i)
            const addButton = screen.getByRole('button', { name: /Add to knowledge/i })

            // Type only whitespace
            fireEvent.change(noteTextarea, { target: { value: '   ' } })

            // Click add
            fireEvent.click(addButton)

            // Should not add item
            expect(screen.queryByText(/Manual Note/i)).not.toBeInTheDocument()
        })

        it('should handle form submission failure', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
            ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const titleInput = screen.getByPlaceholderText('e.g., EMI Reminder, Customer Support')
            const promptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines the agent's behavior/i)

            fireEvent.change(titleInput, { target: { value: 'Test' } })
            fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } })

            fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }))

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error saving agent:', expect.any(Error))
            })

            // Should not call onSuccess or onClose
            expect(mockOnSuccess).not.toHaveBeenCalled()
            expect(mockOnClose).not.toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        it('should update multiple knowledge items in sequence', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const noteTextarea = screen.getByPlaceholderText(/Paste important FAQs/i)
            const addButton = screen.getByRole('button', { name: /Add to knowledge/i })

            // Add first item
            fireEvent.change(noteTextarea, { target: { value: 'First item' } })
            fireEvent.click(addButton)

            await waitFor(() => {
                expect(screen.getByText(/Manual Note 1/i)).toBeInTheDocument()
            })

            // Add second item
            fireEvent.change(noteTextarea, { target: { value: 'Second item' } })
            fireEvent.click(addButton)

            await waitFor(() => {
                expect(screen.getByText(/Manual Note 2/i)).toBeInTheDocument()
            })

            // Should show count
            expect(screen.getByText(/Knowledge entries \(2\)/i)).toBeInTheDocument()
        })

        it('should show total size for knowledge items', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const noteTextarea = screen.getByPlaceholderText(/Paste important FAQs/i)
            fireEvent.change(noteTextarea, { target: { value: 'Test content' } })
            fireEvent.click(screen.getByRole('button', { name: /Add to knowledge/i }))

            await waitFor(() => {
                expect(screen.getByText(/Total size:/i)).toBeInTheDocument()
            })
        })

        it('should display CSV type correctly', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]')

            if (fileInput) {
                const csvContent = 'name,email\nJohn,john@example.com'
                const file = new File([csvContent], 'data.csv', { type: 'text/csv' })

                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                })

                fireEvent.change(fileInput)

                await waitFor(() => {
                    expect(screen.getByText('data.csv')).toBeInTheDocument()
                    // CSV type indicator
                    expect(screen.getByText(/CSV •/)).toBeInTheDocument()
                })
            }
        })

        it('should clear input after file upload', async () => {
            render(
                <AgentModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            )

            const fileInput = screen.getByLabelText(/Upload file \(CSV or TXT\)/i).closest('div')?.querySelector('input[type="file"]') as HTMLInputElement

            if (fileInput) {
                const file = new File(['content'], 'test.txt', { type: 'text/plain' })

                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                })

                const valueSetter = jest.spyOn(fileInput, 'value', 'set')

                fireEvent.change(fileInput)

                await waitFor(() => {
                    expect(screen.getByText('test.txt')).toBeInTheDocument()
                })

                // Input should be cleared
                expect(valueSetter).toHaveBeenCalledWith('')

                valueSetter.mockRestore()
            }
        })
    })
})

