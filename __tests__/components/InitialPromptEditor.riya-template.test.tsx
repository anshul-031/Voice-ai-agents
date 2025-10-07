import { render, screen, fireEvent } from '../test-utils'
import InitialPromptEditor from '@/components/InitialPromptEditor'

describe('InitialPromptEditor - Riya Template', () => {
    const mockOnChange = jest.fn()

    beforeEach(() => {
        mockOnChange.mockClear()
    })

    describe('Riya Template Content', () => {
        it('should include role definition', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('Role: You are Riya')
            expect(calledWith).toContain('collecting overdue EMI payments')
        })

        it('should include profile information', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Profile')
            expect(calledWith).toContain('language: Hinglish')
            expect(calledWith).toContain('banking collections and recovery')
        })

        it('should include skills section', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Skills')
            expect(calledWith).toContain('Overdue EMI collection communication')
            expect(calledWith).toContain('Handling excuses and objections')
        })

        it('should include background section', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Background:')
            expect(calledWith).toContain('voice-to-voice conversation')
            expect(calledWith).toContain('Punjab National Bank')
        })

        it('should include goals section', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Goals:')
            expect(calledWith).toContain('firmly remind the customer')
            expect(calledWith).toContain('credit score')
        })

        it('should include style and tone guidelines', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Style and tone')
            expect(calledWith).toContain('strict, authoritative')
            expect(calledWith).toContain('देखिए')
        })

        it('should include rules section', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Rules')
            expect(calledWith).toContain('Do not accept vague answers')
            expect(calledWith).toContain('NEVER type out a number or symbol')
        })

        it('should include number formatting examples', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('$130,000 should be "one hundred and thirty thousand dollars"')
            expect(calledWith).toContain('50% should be "fifty percent"')
            expect(calledWith).toContain('"API" should be "A P I"')
        })

        it('should include forbidden content section', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Forbidden content:')
            expect(calledWith).toContain('Do not use any form of profanity')
            expect(calledWith).toContain('Do not request sensitive personal details')
            expect(calledWith).toContain('OTP, PIN, Aadhaar')
        })

        it('should include workflows section', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Workflows')
            expect(calledWith).toContain('Start by verifying customer identity')
            expect(calledWith).toContain('State firmly')
            expect(calledWith).toContain('Push for payment')
        })

        it('should include init message with Hinglish greeting', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('## Init')
            expect(calledWith).toContain('नमस्ते जी')
            expect(calledWith).toContain('मैं रिया बोल रही हूँ')
            expect(calledWith).toContain('Punjab National Bank की तरफ़ से')
        })
    })

    describe('Riya Template - Hinglish Content', () => {
        it('should include Hindi (Devanagari) examples', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('अभिजीत जी')
            expect(calledWith).toContain('देखेंगे')
            expect(calledWith).toContain('सोचेंगे')
        })

        it('should include mixed Hinglish conversation examples', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('EMI तीन हज़ार रुपये का बीस तारीख को due था')
            expect(calledWith).toContain('clear नहीं हुआ है')
            expect(calledWith).toContain('तुरंत payment करना होगा')
        })

        it('should include strict response phrases', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('Please note')
            expect(calledWith).toContain('late charges और penalty')
            expect(calledWith).toContain('severe action')
        })
    })

    describe('Riya Template - Banking Specific Features', () => {
        it('should mention EMI (Equated Monthly Installment)', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('EMI')
        })

        it('should mention Punjab National Bank', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('Punjab National Bank')
        })

        it('should mention credit score impact', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('credit score')
            expect(calledWith).toContain('negative impact')
        })

        it('should mention late charges and penalty', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('late charges')
            expect(calledWith).toContain('penalty')
        })
    })

    describe('Riya Template - Professional Tone', () => {
        it('should emphasize professional and firm tone', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('strict, firm, and professional')
            expect(calledWith).toContain('professional bank recovery officer')
        })

        it('should specify to not be overly friendly', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('Do not sound too casual or overly friendly')
        })

        it('should maintain authority without emotions', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('Do not get emotional or apologetic')
            expect(calledWith).toContain('Maintain firm, professional authority')
        })
    })

    describe('Riya Template - Security & Compliance', () => {
        it('should prohibit requesting sensitive information', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('Do not request sensitive personal details')
            expect(calledWith).toContain('OTP, PIN, Aadhaar full number, or passwords')
        })

        it('should prohibit profanity', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('Do not use any form of profanity')
            expect(calledWith).toContain('Forbidden words')
        })

        it('should prohibit misleading content', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const button = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(button)

            const calledWith = mockOnChange.mock.calls[0][0]
            expect(calledWith).toContain('Do not use any form of misleading or deceptive content')
        })
    })

    describe('Template Switching', () => {
        it('should switch from Riya to other templates', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            // First apply Riya template
            const riyaButton = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(riyaButton)

            expect(mockOnChange).toHaveBeenCalledWith(
                expect.stringContaining('Riya')
            )

            // Then switch to another template
            const empathyButton = screen.getByText('Professional & Empathetic')
            fireEvent.click(empathyButton)

            expect(mockOnChange).toHaveBeenCalledWith(
                expect.stringContaining('professional and empathetic')
            )
            expect(mockOnChange).toHaveBeenCalledWith(
                expect.not.stringContaining('Riya')
            )
        })

        it('should completely replace content when switching templates', () => {
            render(<InitialPromptEditor value="" onChange={mockOnChange} />)

            const riyaButton = screen.getByText('Riya - PNB EMI Collection')
            fireEvent.click(riyaButton)

            const riyaContent = mockOnChange.mock.calls[0][0]

            const solutionsButton = screen.getByText('Focus on Solutions')
            fireEvent.click(solutionsButton)

            const solutionsContent = mockOnChange.mock.calls[1][0]

            // New content should not contain old content
            expect(solutionsContent).not.toContain('Punjab National Bank')
            expect(solutionsContent).not.toContain('नमस्ते जी')
        })
    })
})
