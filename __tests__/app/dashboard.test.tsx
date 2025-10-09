import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock child components
jest.mock('@/components/DashboardSidebar', () => {
    return function MockDashboardSidebar({ onNavigate }: any) {
        return (
            <div data-testid="dashboard-sidebar">
                <button onClick={() => onNavigate('voice-agents')}>Voice Agents</button>
                <button onClick={() => onNavigate('call-logs')}>Call Logs</button>
                <button onClick={() => onNavigate('chat-history')}>Chat History</button>
            </div>
        );
    };
});

jest.mock('@/components/VoiceAgentsTable', () => {
    return function MockVoiceAgentsTable({ onEditAgent, onAddAgent }: any) {
        return (
            <div data-testid="voice-agents-table">
                <button onClick={onAddAgent}>Add Agent</button>
                <button onClick={() => onEditAgent({ id: '1', title: 'Test', prompt: 'Test prompt' })}>
                    Edit Agent
                </button>
            </div>
        );
    };
});

jest.mock('@/components/AgentModal', () => {
    return function MockAgentModal({ isOpen, onClose, onSuccess }: any) {
        if (!isOpen) return null;
        return (
            <div data-testid="agent-modal">
                <button onClick={onClose}>Close Modal</button>
                <button onClick={onSuccess}>Save Agent</button>
            </div>
        );
    };
});

jest.mock('@/components/ChatHistory', () => {
    return function MockChatHistory({ isOpen, onClose, initialSessionId }: any) {
        if (!isOpen) return null;
        return (
            <div data-testid="chat-history">
                <p>Session: {initialSessionId}</p>
                <button onClick={onClose}>Close History</button>
            </div>
        );
    };
});

jest.mock('@/components/CallLogsTable', () => {
    return function MockCallLogsTable({ onViewCallDetails }: any) {
        return (
            <div data-testid="call-logs-table">
                <button onClick={() => onViewCallDetails('session-123')}>View Details</button>
            </div>
        );
    };
});

describe.skip('DashboardPage', () => {
    let DashboardPage: any;
    beforeEach(() => {
        jest.resetModules();
        DashboardPage = require('@/app/dashboard/page').default;
    });
    it('should render dashboard with sidebar', () => {
        render(<DashboardPage />);
        expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    });

    it('should render voice agents table by default', () => {
        render(<DashboardPage />);
        expect(screen.getByTestId('voice-agents-table')).toBeInTheDocument();
    });

    it('should open modal when add agent is clicked', () => {
        render(<DashboardPage />);
        const addButton = screen.getByText('Add Agent');
        fireEvent.click(addButton);
        expect(screen.getByTestId('agent-modal')).toBeInTheDocument();
    });

    it('should open modal when edit agent is clicked', () => {
        render(<DashboardPage />);
        const editButton = screen.getByText('Edit Agent');
        fireEvent.click(editButton);
        expect(screen.getByTestId('agent-modal')).toBeInTheDocument();
    });

    it('should close modal', () => {
        render(<DashboardPage />);
        fireEvent.click(screen.getByText('Add Agent'));
        expect(screen.getByTestId('agent-modal')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Close Modal'));
        expect(screen.queryByTestId('agent-modal')).not.toBeInTheDocument();
    });

    it('should switch to call logs view', () => {
        render(<DashboardPage />);
        fireEvent.click(screen.getByText('Call Logs'));
        expect(screen.getByTestId('call-logs-table')).toBeInTheDocument();
    });

    it('should open chat history when view details is clicked', () => {
        render(<DashboardPage />);
        fireEvent.click(screen.getByText('Call Logs'));
        fireEvent.click(screen.getByText('View Details'));
        expect(screen.getByTestId('chat-history')).toBeInTheDocument();
        expect(screen.getByText('Session: session-123')).toBeInTheDocument();
    });

    it('should close chat history', () => {
        render(<DashboardPage />);
        fireEvent.click(screen.getByText('Call Logs'));
        fireEvent.click(screen.getByText('View Details'));
        expect(screen.getByTestId('chat-history')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Close History'));
        expect(screen.queryByTestId('chat-history')).not.toBeInTheDocument();
    });

    it('should refresh table after modal success', () => {
        render(<DashboardPage />);
        fireEvent.click(screen.getByText('Add Agent'));
        fireEvent.click(screen.getByText('Save Agent'));
        // Modal should close and table should refresh
        expect(screen.queryByTestId('agent-modal')).not.toBeInTheDocument();
    });
});
