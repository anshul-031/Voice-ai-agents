import { render, screen, fireEvent } from '../test-utils'
import InitialPromptEditor from '@/components/InitialPromptEditor'

describe('InitialPromptEditor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('Rendering', () => {
    it('should render the component with label', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      expect(screen.getByText('System Prompt')).toBeInTheDocument()
    })

    it('should render textarea with correct value', () => {
      const testValue = 'Test prompt text'
      render(<InitialPromptEditor value={testValue} onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(testValue)
    })

    it('should show placeholder when empty', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const textarea = screen.getByPlaceholderText(
        'Define how the AI should behave and respond...'
      )
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Character Counter', () => {
    it('should show correct character count', () => {
      const testValue = 'Hello World'
      render(<InitialPromptEditor value={testValue} onChange={mockOnChange} />)

      expect(screen.getByText('11')).toBeInTheDocument()
      expect(screen.getByText('/5000')).toBeInTheDocument()
    })

    it('should update character count when value changes', () => {
      const { rerender } = render(
        <InitialPromptEditor value="Test" onChange={mockOnChange} />
      )

      expect(screen.getByText('4')).toBeInTheDocument()

      rerender(<InitialPromptEditor value="Test123" onChange={mockOnChange} />)

      expect(screen.getByText('7')).toBeInTheDocument()
    })

    it('should show zero count for empty value', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle exactly 5000 characters', () => {
      const maxValue = 'A'.repeat(5000)
      render(<InitialPromptEditor value={maxValue} onChange={mockOnChange} />)

      expect(screen.getByText('5000')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onChange when user types', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'New text' } })

      expect(mockOnChange).toHaveBeenCalledWith('New text')
    })

    it('should allow multiple changes', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'First' } })
      fireEvent.change(textarea, { target: { value: 'Second' } })
      fireEvent.change(textarea, { target: { value: 'Third' } })

      expect(mockOnChange).toHaveBeenCalledTimes(3)
    })

    it('should respect maxLength attribute', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.maxLength).toBe(5000)
    })
  })

  describe('Quick Prompt Suggestions', () => {
    it('should render all suggestion buttons', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      expect(screen.getByText('Riya - PNB EMI Collection')).toBeInTheDocument()
      expect(screen.getByText('Professional & Empathetic')).toBeInTheDocument()
      expect(screen.getByText('Focus on Solutions')).toBeInTheDocument()
      expect(screen.getByText('Clear Communication')).toBeInTheDocument()
      expect(screen.getByText('Payment Assistance')).toBeInTheDocument()
    })

    it('should apply "Riya - PNB EMI Collection" template', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const button = screen.getByText('Riya - PNB EMI Collection')
      fireEvent.click(button)

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.stringContaining('Role: You are Riya')
      )
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.stringContaining('Punjab National Bank')
      )
    })

    it('should apply "Professional & Empathetic" template', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const button = screen.getByText('Professional & Empathetic')
      fireEvent.click(button)

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.stringContaining('professional and empathetic')
      )
    })

    it('should apply "Focus on Solutions" template', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const button = screen.getByText('Focus on Solutions')
      fireEvent.click(button)

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.stringContaining('solution-focused')
      )
    })

    it('should apply "Clear Communication" template', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const button = screen.getByText('Clear Communication')
      fireEvent.click(button)

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.stringContaining('clear and direct')
      )
    })

    it('should apply "Payment Assistance" template', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const button = screen.getByText('Payment Assistance')
      fireEvent.click(button)

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.stringContaining('payment assistance')
      )
    })

    it('should replace existing value when template is clicked', () => {
      render(<InitialPromptEditor value="Old value" onChange={mockOnChange} />)

      const button = screen.getByText('Professional & Empathetic')
      fireEvent.click(button)

      // Should not include the old value
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.not.stringContaining('Old value')
      )
    })
  })

  describe('Textarea Properties', () => {
    it('should have 5 rows', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.rows).toBe(5)
    })

    it('should have correct ID for label association', () => {
      render(<InitialPromptEditor value="" onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('id', 'initial-prompt')
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./'
      render(<InitialPromptEditor value={specialChars} onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(specialChars)
    })

    it('should handle multiline text', () => {
      const multiline = 'Line 1\nLine 2\nLine 3'
      render(<InitialPromptEditor value={multiline} onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(multiline)
    })

    it('should handle unicode characters', () => {
      const unicode = '你好 🌟 مرحبا'
      render(<InitialPromptEditor value={unicode} onChange={mockOnChange} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(unicode)
    })
  })
})
