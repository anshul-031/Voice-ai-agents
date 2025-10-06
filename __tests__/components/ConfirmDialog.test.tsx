import { render, screen, fireEvent } from '../test-utils'
import ConfirmDialog from '@/components/ConfirmDialog'

describe('ConfirmDialog', () => {
  const mockOnConfirm = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    mockOnConfirm.mockClear()
    mockOnCancel.mockClear()
  })

  describe('Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ConfirmDialog
          isOpen={false}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Message')).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should display correct title and message', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Item"
          message="Are you sure you want to delete this item?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Delete Item')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
    })

    it('should display custom button labels', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Yes, Delete')).toBeInTheDocument()
      expect(screen.getByText('No, Keep')).toBeInTheDocument()
    })

    it('should display default button labels', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Button Styling', () => {
    it('should apply red color to confirm button by default', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const confirmButton = container.querySelector('.bg-red-600')
      expect(confirmButton).toBeInTheDocument()
    })

    it('should apply blue color to confirm button when specified', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          confirmColor="blue"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const confirmButton = container.querySelector('.bg-blue-600')
      expect(confirmButton).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const confirmButton = screen.getByText('Confirm')
      fireEvent.click(confirmButton)

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      expect(mockOnCancel).not.toHaveBeenCalled()
    })

    it('should call onCancel when cancel button is clicked', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })

    it('should call onCancel when backdrop is clicked', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const backdrop = container.querySelector('.bg-black\\/50')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(mockOnCancel).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings in title and message', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title=""
          message=""
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // Dialog should still render with default buttons
      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should handle very long text', () => {
      const longMessage = 'A'.repeat(1000)
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message={longMessage}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('should not call handlers multiple times on single click', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const confirmButton = screen.getByText('Confirm')
      fireEvent.click(confirmButton)
      
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })
  })
})
