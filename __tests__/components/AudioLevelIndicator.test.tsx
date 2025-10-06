import { render, screen } from '../test-utils'
import AudioLevelIndicator from '@/components/AudioLevelIndicator'

describe('AudioLevelIndicator', () => {
  describe('Rendering', () => {
    it('should render the component with audio level', () => {
      render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      expect(screen.getByText('Audio Level:')).toBeInTheDocument()
      expect(screen.getByText('0.5000')).toBeInTheDocument()
    })

    it('should display formatted level with 4 decimal places', () => {
      render(<AudioLevelIndicator level={0.123456} isListening={false} />)
      
      expect(screen.getByText('0.1235')).toBeInTheDocument()
    })

    it('should render with zero level', () => {
      render(<AudioLevelIndicator level={0} isListening={false} />)
      
      expect(screen.getByText('0.0000')).toBeInTheDocument()
    })
  })

  describe('Audio Level Bar', () => {
    it('should show green color when listening and level > 0.5%', () => {
      const { container } = render(<AudioLevelIndicator level={0.001} isListening={true} />)
      
      const bar = container.querySelector('.bg-green-500')
      expect(bar).toBeInTheDocument()
    })

    it('should show yellow color when listening and level <= 0.5%', () => {
      const { container } = render(<AudioLevelIndicator level={0.0001} isListening={true} />)
      
      const bar = container.querySelector('.bg-yellow-500')
      expect(bar).toBeInTheDocument()
    })

    it('should show gray color when not listening', () => {
      const { container } = render(<AudioLevelIndicator level={0.5} isListening={false} />)
      
      const bar = container.querySelector('.bg-gray-500')
      expect(bar).toBeInTheDocument()
    })

    it('should calculate width percentage correctly', () => {
      const { container } = render(<AudioLevelIndicator level={0.05} isListening={true} />)
      
      // level * 1000 = 0.05 * 1000 = 50%
      const bar = container.querySelector('[style*="width"]')
      expect(bar).toHaveStyle({ width: '50%' })
    })

    it('should cap width at 100%', () => {
      const { container } = render(<AudioLevelIndicator level={1.0} isListening={true} />)
      
      const bar = container.querySelector('[style*="width"]')
      expect(bar).toHaveStyle({ width: '100%' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative levels', () => {
      const { container } = render(<AudioLevelIndicator level={-0.5} isListening={true} />)
      
      expect(screen.getByText('-0.5000')).toBeInTheDocument()
    })

    it('should handle very large levels', () => {
      render(<AudioLevelIndicator level={999.999} isListening={true} />)
      
      expect(screen.getByText('999.9990')).toBeInTheDocument()
    })
  })
})
