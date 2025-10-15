import MicButton from '@/components/MicButton'
import { fireEvent, render, screen } from '../test-utils'

describe('MicButton', () => {
  const mockOnToggle = jest.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  describe('Rendering', () => {
    it('should render the microphone button', () => {
      render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should show mic icon when not listening', () => {
      render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Start recording'
      )
    })

    it('should show square icon when listening', () => {
      render(
        <MicButton
          isListening={true}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Stop recording'
      )
    })
  })

  describe('Button States', () => {
    it('should have glass-button styling', () => {
      const { container } = render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      const button = container.querySelector('.glass-button')
      expect(button).toBeInTheDocument()
    })

    it('should show blue gradient when not open', () => {
      const { container } = render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      const button = container.querySelector('.from-blue-500\\/40')
      expect(button).toBeInTheDocument()
    })

    it('should show red gradient when listening', () => {
      const { container } = render(
        <MicButton
          isListening={true}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      )

      const button = container.querySelector('.from-red-500\\/40')
      expect(button).toBeInTheDocument()
    })

    it('should show slate gradient when open but not listening', () => {
      const { container } = render(
        <MicButton
          isListening={false}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      )

      const button = container.querySelector('.from-slate-600\\/40')
      expect(button).toBeInTheDocument()
    })

    it('should have glow effect when not open', () => {
      const { container } = render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      const button = container.querySelector('.glow-blue')
      expect(button).toBeInTheDocument()
    })

    it('should have glow effect when listening', () => {
      const { container } = render(
        <MicButton
          isListening={true}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      )

      const button = container.querySelector('.glow-red')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Status Indicator', () => {
    it('should show green indicator when not open', () => {
      const { container } = render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      const indicator = container.querySelector('.bg-green-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should show red indicator when listening', () => {
      const { container } = render(
        <MicButton
          isListening={true}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      )

      const indicator = container.querySelector('.bg-red-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should show yellow indicator when open but not listening', () => {
      const { container } = render(
        <MicButton
          isListening={false}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      )

      const indicator = container.querySelector('.bg-yellow-400')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onToggle when clicked', () => {
      render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(mockOnToggle).toHaveBeenCalledTimes(1)
    })

    it('should call onToggle multiple times', () => {
      render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(mockOnToggle).toHaveBeenCalledTimes(3)
    })
  })

  describe('Accessibility', () => {
    it('should have correct aria-label when starting', () => {
      render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Start recording'
      )
    })

    it('should have correct aria-label when stopping', () => {
      render(
        <MicButton
          isListening={true}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Stop recording'
      )
    })

    it('should have correct title attribute when not listening', () => {
      render(
        <MicButton
          isListening={false}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByRole('button')).toHaveAttribute(
        'title',
        'Start recording'
      )
    })

    it('should have correct title attribute when listening', () => {
      render(
        <MicButton
          isListening={true}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByRole('button')).toHaveAttribute(
        'title',
        'Stop recording'
      )
    })
  })
})
