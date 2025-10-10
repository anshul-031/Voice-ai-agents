import AudioLevelIndicator from '@/components/AudioLevelIndicator'
import { render, screen } from '../test-utils'

describe('AudioLevelIndicator', () => {
  describe('Rendering', () => {
    it('should render the component with audio level', () => {
      render(<AudioLevelIndicator level={0.05} isListening={true} />)
      
      expect(screen.getByText('Audio Active')).toBeInTheDocument()
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

    it('should show Audio Idle when not listening', () => {
      render(<AudioLevelIndicator level={0.5} isListening={false} />)
      
      expect(screen.getByText('Audio Idle')).toBeInTheDocument()
    })

    it('should show Audio Active when listening', () => {
      render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      expect(screen.getByText('Audio Active')).toBeInTheDocument()
    })
  })

  describe('Frequency Bars', () => {
    it('should render 32 frequency bars', () => {
      const { container } = render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      const bars = container.querySelectorAll('.rounded-full.flex-1')
      expect(bars).toHaveLength(32)
    })

    it('should show blue gradient when listening', () => {
      const { container } = render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      const bar = container.querySelector('.from-blue-600')
      expect(bar).toBeInTheDocument()
    })

    it('should show slate gradient when not listening', () => {
      const { container } = render(<AudioLevelIndicator level={0.5} isListening={false} />)
      
      const bar = container.querySelector('.from-slate-700')
      expect(bar).toBeInTheDocument()
    })
  })

  describe('Glass Effects', () => {
    it('should have glass-card styling', () => {
      const { container } = render(<AudioLevelIndicator level={0.5} isListening={true} />)
      
      const glassCards = container.querySelectorAll('.glass-card')
      expect(glassCards.length).toBeGreaterThan(0)
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
