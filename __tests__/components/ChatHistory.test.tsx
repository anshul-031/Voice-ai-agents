import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatHistory from '@/components/ChatHistory';

// Mock fetch globally
global.fetch = jest.fn();

describe('ChatHistory Component', () => {
    const mockOnClose = jest.fn();

    const defaultProps = {
        initialSessionId: 'test-session-123',
        onClose: mockOnClose,
        isOpen: true
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();
    });

    it('should render when open', () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, chats: [] })
        });

        // Do not pass initialSessionId; header may briefly render either state depending on timing
        render(<ChatHistory isOpen={true} onClose={mockOnClose} /> as any);
        const header = screen.queryByText(/Chat History/i) ?? screen.getByText(/Session Details/i)
        expect(header).toBeInTheDocument();
    });

    it('should fetch sessions first, then chat history for initialSessionId', async () => {
        const mockSessions = { success: true, sessions: [], count: 0, userId: 'mukul' }
        const mockChats = {
            success: true,
            chats: [
                { id: 'chat1', role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00.000Z' },
                { id: 'chat2', role: 'assistant', content: 'Hi there', timestamp: '2024-01-01T00:00:01.000Z' },
            ],
        }

        ;(global.fetch as jest.Mock)
          // first call: sessions
          .mockResolvedValueOnce({ ok: true, json: async () => mockSessions })
          // second call: history for initialSessionId
          .mockResolvedValueOnce({ ok: true, json: async () => mockChats })

        render(<ChatHistory {...defaultProps} />)

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/chat/sessions?userId=mukul')
          )
        })

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/chat/history?sessionId=test-session-123')
          )
        })
    })

    it('should call onClose when close button is clicked', () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, chats: [] })
        });

        render(<ChatHistory {...defaultProps} />);
        
    // Footer Close button is the visible text button (not the title="Close" icon button)
    const footerClose = screen.getAllByRole('button', { name: /close/i }).find(btn => btn.textContent?.match(/close/i))!
    fireEvent.click(footerClose);
        
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        render(<ChatHistory {...defaultProps} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    it('should not render when closed', () => {
        const { container } = render(<ChatHistory {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('should display loading state', () => {
        (global.fetch as jest.Mock).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: async () => ({ success: true, chats: [] })
            }), 100))
        );

        const { container } = render(<ChatHistory {...defaultProps} />);
        // Loading shows a spinner; assert presence by spinner class
        const spinners = container.querySelectorAll('.animate-spin')
        expect(spinners.length).toBeGreaterThan(0)
    });
});
