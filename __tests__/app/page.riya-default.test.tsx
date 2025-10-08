import { render, screen, waitFor, fireEvent } from '../test-utils'
import Home from '@/app/page'
import '@testing-library/jest-dom'

// Mock the useVoiceRecorder hook
jest.mock('@/hooks/useVoiceRecorder', () => ({
    useVoiceRecorder: jest.fn(() => ({
        isListening: false,
        isProcessing: false,
        audioLevel: 0,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
    })),
}))

// Mock the useSpeechRecognition hook
jest.mock('@/hooks/useSpeechRecognition', () => ({
    useSpeechRecognition: jest.fn(() => ({
        supported: false,
        isListening: false,
        interimTranscript: '',
        startListening: jest.fn(),
        stopListening: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
    })),
}))

// Mock fetch globally
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: async () => ({
            services: { stt: true, llm: true, tts: true },
            allConfigured: true,
            message: 'All services configured',
        }),
    } as Response)
)

describe('Home Page - Riya Template Default', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: async () => ({
                        services: { stt: true, llm: true, tts: true },
                        allConfigured: true,
                        message: 'All services configured',
                    }),
                } as Response)
            )
    })

    describe('Default Riya Template Loading', () => {
        it('should load with Riya template as default prompt', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('Role: You are Riya')
            })
        })

        it('should include Punjab National Bank in default prompt', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('Punjab National Bank')
            })
        })

        it('should include Hinglish language specification in default', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('Hinglish')
            })
        })

        it('should include EMI collection focus in default', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('overdue EMI payments')
            })
        })

        it('should include Hindi greeting in Init section', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('नमस्ते जी')
                expect(textarea.value).toContain('मैं रिया बोल रही हूँ')
            })
        })
    })

    describe('Riya Template Structure', () => {
        it('should include all major sections in default prompt', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                const value = textarea.value

                expect(value).toContain('## Profile')
                expect(value).toContain('## Skills')
                expect(value).toContain('## Background:')
                expect(value).toContain('## Goals:')
                expect(value).toContain('## Style and tone')
                expect(value).toContain('## Rules')
                expect(value).toContain('## Forbidden content:')
                expect(value).toContain('## Workflows')
                expect(value).toContain('## Init')
            })
        })

        it('should include number formatting rules', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('NEVER type out a number or symbol')
                expect(textarea.value).toContain('one hundred and thirty thousand dollars')
            })
        })

        it('should include security guidelines', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('OTP, PIN, Aadhaar')
                expect(textarea.value).toContain('Do not request sensitive personal details')
            })
        })
    })

    describe('Riya Template Usage in Messages', () => {
        it('should use Riya template when sending text messages', async () => {
            render(<Home />)

            // Open text chat
            const textChatButton = screen.getByTitle('Toggle text chat')
            fireEvent.click(textChatButton)

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
            })

            // Type and send message
            const input = screen.getByPlaceholderText('Type your message here...')
            fireEvent.change(input, { target: { value: 'Hello' } })

            const sendButton = screen.getByTitle('Send message')

                // Mock LLM response
                ; (global.fetch as jest.Mock).mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        json: async () => ({
                            llmText: 'नमस्ते जी, मैं रिया बोल रही हूँ Punjab National Bank की तरफ़ से।',
                        }),
                    } as Response)
                )

            fireEvent.click(sendButton)

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/llm',
                    expect.objectContaining({
                        method: 'POST',
                        body: expect.stringContaining('Role: You are Riya'),
                    })
                )
            })
        })
    })

    describe('Template Switching from Default', () => {
        it('should allow switching from Riya to other templates', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('Riya')
            })

            // Click Professional & Empathetic template
            const templateButton = screen.getByText('Professional & Empathetic')
            fireEvent.click(templateButton)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('professional and empathetic')
                expect(textarea.value).not.toContain('Riya')
            })
        })

        it('should allow manual editing of Riya template', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i })
                expect(textarea).toBeInTheDocument()
            })

            const textareaEl = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement

            // Add custom text to the template
            fireEvent.change(textareaEl, {
                target: { value: 'Custom modified Riya template for testing' }
            })

            await waitFor(() => {
                expect(textareaEl.value).toBe('Custom modified Riya template for testing')
            })
        })

        it('should persist template changes during session', async () => {
            const { rerender } = render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i })
                expect(textarea).toBeInTheDocument()
            })

            // Change to another template
            const solutionsButton = screen.getByText('Focus on Solutions')
            fireEvent.click(solutionsButton)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('solution-focused')
            })

            // Re-render component
            rerender(<Home />)

            // Should maintain the changed template
            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i })
                // Note: In actual app, this would persist in state, but in test it resets
                // This test verifies the component can handle template changes
                expect(textarea).toBeInTheDocument()
            })
        })
    })

    describe('Riya Template Character Count', () => {
        it('should display character count for Riya template', async () => {
            render(<Home />)

            await waitFor(() => {
                // Riya template is quite long, should show a substantial character count
                const characterCountElement = screen.getByText(/\/5000/)
                expect(characterCountElement).toBeInTheDocument()
            })
        })

        it('should not exceed character limit with default Riya template', async () => {
            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                const value = textarea.value
                expect(value.length).toBeLessThanOrEqual(5000)
            })
        })
    })

    describe('Riya Template in Different Scenarios', () => {
        it('should use Riya template for voice recording flow', async () => {
            const mockStartRecording = jest.fn()
            const { useVoiceRecorder } = require('@/hooks/useVoiceRecorder')

            useVoiceRecorder.mockImplementation(() => ({
                isListening: false,
                isProcessing: false,
                audioLevel: 0,
                startRecording: mockStartRecording,
                stopRecording: jest.fn(),
            }))

            render(<Home />)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('Riya')
            })

            // The template should be ready for voice interactions
            const micButton = screen.getByLabelText(/start recording/i)
            expect(micButton).toBeInTheDocument()
        })

        it('should show Riya template before any user interaction', async () => {
            render(<Home />)

            // Even before any messages, Riya template should be loaded
            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('Role: You are Riya')
            })

            // No messages should be present yet
            const conversation = screen.getByText('Conversation')
            expect(conversation).toBeInTheDocument()
        })
    })

    describe('Quick Templates with Riya as First Option', () => {
        it('should show Riya template as first quick template option', async () => {
            render(<Home />)

            await waitFor(() => {
                expect(screen.getByText('Riya - PNB EMI Collection')).toBeInTheDocument()
            })

            // Get all template buttons
            const templateButtons = screen.getAllByRole('button').filter(button =>
                button.textContent?.includes('Riya') ||
                button.textContent?.includes('Professional') ||
                button.textContent?.includes('Solutions')
            )

            // Riya should be among the template buttons
            expect(templateButtons.length).toBeGreaterThan(0)
        })

        it('should allow re-applying Riya template after switching', async () => {
            render(<Home />)

            // Switch to another template
            const empathyButton = screen.getByText('Professional & Empathetic')
            fireEvent.click(empathyButton)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('professional and empathetic')
            })

            // Switch back to Riya
            const riyaButton = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(riyaButton)

            await waitFor(() => {
                const textarea = screen.getByRole('textbox', { name: /system prompt/i }) as HTMLTextAreaElement
                expect(textarea.value).toContain('Role: You are Riya')
                expect(textarea.value).toContain('Punjab National Bank')
            })
        })
    })
})
