import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';

// Mock fetch globally
global.fetch = jest.fn();

describe('Sidebar Component', () => {
    const mockOnToggle = jest.fn();
    const mockOnSelectAgent = jest.fn();
    const mockOnViewSession = jest.fn();

    const defaultProps = {
        isOpen: true,
        onToggle: mockOnToggle,
        onSelectAgent: mockOnSelectAgent,
        onViewSession: mockOnViewSession
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();
    });

    it('should render sidebar when open', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText('Call Log')).toBeInTheDocument();
        expect(screen.getByText('Agents')).toBeInTheDocument();
    });

    it('should call onToggle when toggle button is clicked', () => {
        render(<Sidebar {...defaultProps} />);
        const buttons = screen.getAllByRole('button');
        // The header toggle button is the first small icon button
        fireEvent.click(buttons[0]);
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should fetch sessions on mount', async () => {
        const mockSessions = {
            success: true,
            sessions: [
                {
                    sessionId: 'session1',
                    userId: 'user1',
                    messageCount: 5,
                    firstMessage: 'Hello',
                    lastMessage: 'Goodbye',
                    lastTimestamp: '2024-01-01T00:00:00.000Z',
                    firstTimestamp: '2024-01-01T00:00:00.000Z'
                }
            ]
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockSessions
        });

        render(<Sidebar {...defaultProps} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/chat/sessions?userId=mukul');
        });
    });

    it('should switch to voice agents tab', async () => {
        const mockAgents = {
            success: true,
            agents: []
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockAgents
        });

        render(<Sidebar {...defaultProps} />);

    const agentsTab = screen.getByText('Agents');
    fireEvent.click(agentsTab);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/voice-agents?userId=mukul');
        });
    });

    it('should handle fetch errors gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        render(<Sidebar {...defaultProps} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    it('should not render when closed', () => {
        const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);
        expect(container.querySelector('[class*="sidebar"]')).toBeNull();
    });
});
