import AudioLevelIndicator from '@/components/AudioLevelIndicator'
import { render, screen } from '../test-utils'

describe('AudioLevelIndicator', () => {
  describe('Rendering', () => {
    it('should render the component with audio level', () => {
      render(<AudioLevelIndicator level={0.05} isListening={true} />)
      
      expect(screen.getByText('Listening')).toBeInTheDocument()
      expect(screen.getByText('50', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('%', { exact: false })).toBeInTheDocument()
    })

    it('should display percentage correctly', () => {
      render(<AudioLevelIndicator level={0.123456} isListening={false} />)
      
      expect(screen.getByText('100', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('%', { exact: false })).toBeInTheDocument()
    })

    it('should render with zero level', () => {
      render(<AudioLevelIndicator level={0} isListening={false} />)
      
      expect(screen.getByText('0', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('%', { exact: false })).toBeInTheDocument()
    })

    it('should show Idle when not listening', () => {
      render(<AudioLevelIndicator level={0.5} isListening={false} />)
      
      expect(screen.getByText('Idle')).toBeInTheDocument()
    })

    it('should show Listening when listening', () => {
      render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      expect(screen.getByText('Listening')).toBeInTheDocument()
    })
  })

  describe('Canvas Visualizer', () => {
    it('should render canvas element', () => {
      const { container } = render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('should show green indicator when listening', () => {
      const { container } = render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      // Look for the green pulsing dot indicator
      const greenIndicator = container.querySelector('.bg-gradient-to-br.from-green-400')
      expect(greenIndicator).toBeInTheDocument()
    })

    it('should not show green indicator when not listening', () => {
      const { container} = render(<AudioLevelIndicator level={0.5} isListening={false} />)
      
      const greenIndicator = container.querySelector('.bg-gradient-to-br.from-green-400')
      expect(greenIndicator).not.toBeInTheDocument()
    })
  })

  describe('Glass Effects', () => {
    it('should have glass-card styling', () => {
      const { container } = render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      // Component uses backdrop-blur and glass effects (rounded-2xl, border, bg-gradient)
      const visualizerContainer = container.querySelector('.rounded-2xl')
      expect(visualizerContainer).toBeInTheDocument()
      expect(visualizerContainer).toHaveClass('bg-gradient-to-br')
    })
  })

  describe('Percentage Display', () => {
    it('should calculate percentage correctly (level * 1000)', () => {
      render(<AudioLevelIndicator level={0.05} isListening={true} />)
      
      // level * 1000 = 0.05 * 1000 = 50%
      expect(screen.getByText('50', { exact: false })).toBeInTheDocument()
    })

    it('should cap percentage at 100%', () => {
      render(<AudioLevelIndicator level={1.0} isListening={true} />)
      
      expect(screen.getByText('100', { exact: false })).toBeInTheDocument()
    })
  })

  describe('High Level Warning', () => {
    it('should show warning when percentage > 85 and listening', () => {
      render(<AudioLevelIndicator level={0.09} isListening={true} />)
      
      expect(screen.getByText('High audio level detected')).toBeInTheDocument()
    })

    it('should not show warning when percentage <= 85', () => {
      render(<AudioLevelIndicator level={0.08} isListening={true} />)
      
      expect(screen.queryByText('High audio level detected')).not.toBeInTheDocument()
    })

    it('should not show warning when not listening', () => {
      render(<AudioLevelIndicator level={0.09} isListening={false} />)
      
      expect(screen.queryByText('High audio level detected')).not.toBeInTheDocument()
    })
  })
})
