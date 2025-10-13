import TopModelBoxes from '@/components/TopModelBoxes'
import { createMockModelConfig, render, screen } from '../test-utils'

describe('TopModelBoxes', () => {
  describe('Rendering', () => {
    it('should render the component with title', () => {
      const config = createMockModelConfig()
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('Model Configuration')).toBeInTheDocument()
    })

    it('should display all three model types', () => {
      const config = createMockModelConfig()
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('LLM')).toBeInTheDocument()
      expect(screen.getByText('STT')).toBeInTheDocument()
      expect(screen.getByText('TTS')).toBeInTheDocument()
    })

    it('should display correct model names', () => {
      const config = createMockModelConfig()
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('Gemini 1.5 Flash')).toBeInTheDocument()
      expect(screen.getByText('AssemblyAI Universal')).toBeInTheDocument()
      expect(screen.getByText('Sarvam Voice Manisha')).toBeInTheDocument()
    })
  })

  describe('Custom Configuration', () => {
    it('should display custom LLM model', () => {
      const config = createMockModelConfig({
        llmModel: 'GPT-4',
      })
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('GPT-4')).toBeInTheDocument()
    })

    it('should display custom STT model', () => {
      const config = createMockModelConfig({
        sttModel: 'Whisper v3',
      })
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('Whisper v3')).toBeInTheDocument()
    })

    it('should display custom TTS model', () => {
      const config = createMockModelConfig({
        ttsModel: 'Google Cloud TTS',
      })
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('Google Cloud TTS')).toBeInTheDocument()
    })

    it('should handle all custom models at once', () => {
      const config = createMockModelConfig({
        llmModel: 'Claude 3',
        sttModel: 'Azure Speech',
        ttsModel: 'Amazon Polly',
      })
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('Claude 3')).toBeInTheDocument()
      expect(screen.getByText('Azure Speech')).toBeInTheDocument()
      expect(screen.getByText('Amazon Polly')).toBeInTheDocument()
    })
  })

  describe('Model Boxes Layout', () => {
    it('should render LLM box first', () => {
      const config = createMockModelConfig()
      const { container } = render(<TopModelBoxes config={config} />)

      // Updated to match glass-card structure
      const boxes = container.querySelectorAll('.glass-card.rounded-xl')
      const firstBox = boxes[0]
      expect(firstBox.textContent).toContain('LLM')
    })

    it('should render STT box second', () => {
      const config = createMockModelConfig()
      const { container } = render(<TopModelBoxes config={config} />)

      // Updated to match glass-card structure
      const boxes = container.querySelectorAll('.glass-card.rounded-xl')
      const secondBox = boxes[1]
      expect(secondBox.textContent).toContain('STT')
    })

    it('should render TTS box third', () => {
      const config = createMockModelConfig()
      const { container } = render(<TopModelBoxes config={config} />)

      // Updated to match glass-card structure
      const boxes = container.querySelectorAll('.glass-card.rounded-xl')
      const thirdBox = boxes[2]
      expect(thirdBox.textContent).toContain('TTS')
    })

    it('should render exactly 3 model boxes', () => {
      const config = createMockModelConfig()
      const { container } = render(<TopModelBoxes config={config} />)

      // Updated to match glass-card structure
      const boxes = container.querySelectorAll('.glass-card.rounded-xl')
      expect(boxes.length).toBe(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty model names', () => {
      const config = createMockModelConfig({
        llmModel: '',
        sttModel: '',
        ttsModel: '',
      })
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('LLM')).toBeInTheDocument()
      expect(screen.getByText('STT')).toBeInTheDocument()
      expect(screen.getByText('TTS')).toBeInTheDocument()
    })

    it('should handle very long model names', () => {
      const longName = 'A'.repeat(100)
      const config = createMockModelConfig({
        llmModel: longName,
      })
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText(longName)).toBeInTheDocument()
    })

    it('should handle special characters in model names', () => {
      const config = createMockModelConfig({
        llmModel: 'GPT-4 Turbo (Beta) v1.0',
        sttModel: 'Whisper-v3-large',
        ttsModel: 'Azure_TTS_Premium',
      })
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('GPT-4 Turbo (Beta) v1.0')).toBeInTheDocument()
      expect(screen.getByText('Whisper-v3-large')).toBeInTheDocument()
      expect(screen.getByText('Azure_TTS_Premium')).toBeInTheDocument()
    })

    it('should handle unicode characters in model names', () => {
      const config = createMockModelConfig({
        llmModel: 'GPT-4 🚀',
        sttModel: 'Whisper 语音识别',
        ttsModel: 'TTS العربية',
      })
      render(<TopModelBoxes config={config} />)

      expect(screen.getByText('GPT-4 🚀')).toBeInTheDocument()
      expect(screen.getByText('Whisper 语音识别')).toBeInTheDocument()
      expect(screen.getByText('TTS العربية')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply glass panel styling', () => {
      const config = createMockModelConfig()
      const { container } = render(<TopModelBoxes config={config} />)

      const outerBox = container.querySelector('.glass-panel')
      expect(outerBox).toBeInTheDocument()

      // Check for blue gradient classes on model cards
      const gradientBoxes = container.querySelectorAll('[class*="from-blue"]')
      expect(gradientBoxes.length).toBeGreaterThanOrEqual(3)
    })
  })
})
