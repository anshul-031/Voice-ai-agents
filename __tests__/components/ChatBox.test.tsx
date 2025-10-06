import { render, screen } from '../test-utils'
import { createMockMessage } from '../test-utils'
import ChatBox from '@/components/ChatBox'

describe('ChatBox', () => {
  describe('Initial State (Not Open)', () => {
    it('should show ready to start message when not open', () => {
      render(
        <ChatBox
          messages={[]}
          isOpen={false}
          isListening={false}
          isProcessing={false}
        />
      )

      expect(screen.getByText('Ready to Start')).toBeInTheDocument()
      expect(screen.getByText(/Click the microphone button/i)).toBeInTheDocument()
    })

    it('should not show messages when not open', () => {
      const messages = [createMockMessage({ text: 'Test message' })]
      
      render(
        <ChatBox
          messages={messages}
          isOpen={false}
          isListening={false}
          isProcessing={false}
        />
      )

      expect(screen.queryByText('Test message')).not.toBeInTheDocument()
    })
  })

  describe('Chat Open State', () => {
    it('should show listening message when open with no messages', () => {
      render(
        <ChatBox
          messages={[]}
          isOpen={true}
          isListening={true}
          isProcessing={false}
        />
      )

      expect(screen.getByText('Listening...')).toBeInTheDocument()
      expect(screen.getByText(/Speak naturally and clearly/i)).toBeInTheDocument()
    })

    it('should display user messages correctly', () => {
      const messages = [
        createMockMessage({
          id: '1',
          text: 'Hello, assistant!',
          source: 'user',
        }),
      ]

      render(
        <ChatBox
          messages={messages}
          isOpen={true}
          isListening={false}
          isProcessing={false}
        />
      )

      expect(screen.getByText('Hello, assistant!')).toBeInTheDocument()
      expect(screen.getByText('You')).toBeInTheDocument()
    })

    it('should display assistant messages correctly', () => {
      const messages = [
        createMockMessage({
          id: '2',
          text: 'Hello! How can I help?',
          source: 'assistant',
        }),
      ]

      render(
        <ChatBox
          messages={messages}
          isOpen={true}
          isListening={false}
          isProcessing={false}
        />
      )

      expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument()
      expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    })

    it('should display multiple messages in order', () => {
      const messages = [
        createMockMessage({
          id: '1',
          text: 'First message',
          source: 'user',
          timestamp: new Date('2024-01-01T12:00:00Z'),
        }),
        createMockMessage({
          id: '2',
          text: 'Second message',
          source: 'assistant',
          timestamp: new Date('2024-01-01T12:01:00Z'),
        }),
        createMockMessage({
          id: '3',
          text: 'Third message',
          source: 'user',
          timestamp: new Date('2024-01-01T12:02:00Z'),
        }),
      ]

      render(
        <ChatBox
          messages={messages}
          isOpen={true}
          isListening={false}
          isProcessing={false}
        />
      )

      expect(screen.getByText('First message')).toBeInTheDocument()
      expect(screen.getByText('Second message')).toBeInTheDocument()
      expect(screen.getByText('Third message')).toBeInTheDocument()
    })
  })

  describe('Message Formatting', () => {
    it('should format timestamps correctly', () => {
      const messages = [
        createMockMessage({
          timestamp: new Date('2024-01-01T14:30:00Z'),
        }),
      ]

      render(
        <ChatBox
          messages={messages}
          isOpen={true}
          isListening={false}
          isProcessing={false}
        />
      )

      // Timestamp should be formatted as HH:MM
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/)
      expect(timeElements.length).toBeGreaterThan(0)
    })

    it('should preserve whitespace in message text', () => {
      const messages = [
        createMockMessage({
          text: 'Line 1\nLine 2\n\nLine 4',
          source: 'user',
        }),
      ]

      const { container } = render(
        <ChatBox
          messages={messages}
          isOpen={true}
          isListening={false}
          isProcessing={false}
        />
      )

      const messageElement = container.querySelector('.whitespace-pre-wrap')
      expect(messageElement).toBeInTheDocument()
    })
  })

  describe('Processing State', () => {
    it('should show processing indicator when processing', () => {
      render(
        <ChatBox
          messages={[]}
          isOpen={true}
          isListening={false}
          isProcessing={true}
          processingStep="Transcribing audio..."
        />
      )

      expect(screen.getByText('Transcribing audio...')).toBeInTheDocument()
    })

    it('should show different processing steps', () => {
      const { rerender } = render(
        <ChatBox
          messages={[]}
          isOpen={true}
          isListening={false}
          isProcessing={true}
          processingStep="Generating response..."
        />
      )

      expect(screen.getByText('Generating response...')).toBeInTheDocument()

      rerender(
        <ChatBox
          messages={[]}
          isOpen={true}
          isListening={false}
          isProcessing={true}
          processingStep="Generating speech..."
        />
      )

      expect(screen.getByText('Generating speech...')).toBeInTheDocument()
    })
  })

  describe('Message Styling', () => {
    it('should apply correct styling to user messages', () => {
      const messages = [
        createMockMessage({
          text: 'User message',
          source: 'user',
        }),
      ]

      const { container } = render(
        <ChatBox
          messages={messages}
          isOpen={true}
          isListening={false}
          isProcessing={false}
        />
      )

      const userBubble = container.querySelector('.bg-blue-600')
      expect(userBubble).toBeInTheDocument()
    })

    it('should apply correct styling to assistant messages', () => {
      const messages = [
        createMockMessage({
          text: 'Assistant message',
          source: 'assistant',
        }),
      ]

      const { container } = render(
        <ChatBox
          messages={messages}
          isOpen={true}
          isListening={false}
          isProcessing={false}
        />
      )

      const assistantBubble = container.querySelector('.bg-slate-700')
      expect(assistantBubble).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should handle empty message text', () => {
      const messages = [
        createMockMessage({
          text: '',
          source: 'user',
        }),
      ]

      render(
        <ChatBox
          messages={messages}
          isOpen={true}
          isListening={false}
          isProcessing={false}
        />
      )

      // Should still render the message container
      expect(screen.getByText('You')).toBeInTheDocument()
    })
  })
})
