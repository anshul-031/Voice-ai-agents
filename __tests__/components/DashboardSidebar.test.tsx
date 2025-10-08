import { render, screen, fireEvent } from '@testing-library/react'
import DashboardSidebar from '@/components/DashboardSidebar'

describe('DashboardSidebar', () => {
    const mockOnNavigate = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render all main navigation items', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            expect(screen.getByText('Voice Agents')).toBeInTheDocument()
            expect(screen.getByText('Phone Number')).toBeInTheDocument()
            expect(screen.getByText('Campaigns')).toBeInTheDocument()
            expect(screen.getByText('Agent Knowledge')).toBeInTheDocument()
            expect(screen.getByText('Call Logs')).toBeInTheDocument()
            expect(screen.getByText('Settings')).toBeInTheDocument()
        })

        it('should render bottom navigation items', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            expect(screen.getByText('Documentation')).toBeInTheDocument()
            expect(screen.getByText("What's New")).toBeInTheDocument()
        })

        it('should highlight active view', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            const voiceAgentsButton = screen.getByText('Voice Agents').closest('button')
            expect(voiceAgentsButton).toHaveClass('text-emerald-400')
        })
    })

    describe('Navigation', () => {
        it('should call onNavigate when clicking a navigation item', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            fireEvent.click(screen.getByText('Call Logs'))
            expect(mockOnNavigate).toHaveBeenCalledWith('call-logs')
        })

        it('should call onNavigate for Phone Number', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            fireEvent.click(screen.getByText('Phone Number'))
            expect(mockOnNavigate).toHaveBeenCalledWith('phone-number')
        })

        it('should call onNavigate for Campaigns', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            fireEvent.click(screen.getByText('Campaigns'))
            expect(mockOnNavigate).toHaveBeenCalledWith('campaigns')
        })

        it('should call onNavigate for Agent Knowledge', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            fireEvent.click(screen.getByText('Agent Knowledge'))
            expect(mockOnNavigate).toHaveBeenCalledWith('agent-knowledge')
        })

        it('should call onNavigate for Documentation', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            fireEvent.click(screen.getByText('Documentation'))
            expect(mockOnNavigate).toHaveBeenCalledWith('documentation')
        })

        it('should call onNavigate for What\'s New', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            fireEvent.click(screen.getByText("What's New"))
            expect(mockOnNavigate).toHaveBeenCalledWith('whats-new')
        })
    })

    describe('Settings Submenu', () => {
        it('should not show settings submenu by default', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            expect(screen.queryByText('API Keys')).not.toBeInTheDocument()
        })

        it('should expand settings submenu when clicking Settings', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            fireEvent.click(screen.getByText('Settings'))

            expect(screen.getByText('API Keys')).toBeInTheDocument()
            expect(screen.getByText('Credentials')).toBeInTheDocument()
            expect(screen.getByText('Billing')).toBeInTheDocument()
            expect(screen.getByText('Transactions')).toBeInTheDocument()
        })

        it('should collapse settings submenu when clicking Settings again', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            const settingsButton = screen.getByText('Settings')

            // Expand
            fireEvent.click(settingsButton)
            expect(screen.getByText('API Keys')).toBeInTheDocument()

            // Collapse
            fireEvent.click(settingsButton)
            expect(screen.queryByText('API Keys')).not.toBeInTheDocument()
        })

        it('should call onNavigate when clicking submenu item', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            fireEvent.click(screen.getByText('Settings'))
            fireEvent.click(screen.getByText('API Keys'))

            expect(mockOnNavigate).toHaveBeenCalledWith('api-keys')
        })

        it('should highlight active submenu item', () => {
            render(
                <DashboardSidebar
                    activeView="api-keys"
                    onNavigate={mockOnNavigate}
                />
            )

            // Settings should be auto-expanded when a submenu item is active
            const apiKeysButton = screen.getByText('API Keys').closest('button')
            expect(apiKeysButton).toHaveClass('text-emerald-400')
        })

        it('should keep settings expanded when a submenu item is active', () => {
            render(
                <DashboardSidebar
                    activeView="billing"
                    onNavigate={mockOnNavigate}
                />
            )

            // Submenu should be visible when one of its items is active
            expect(screen.getByText('API Keys')).toBeInTheDocument()
            expect(screen.getByText('Credentials')).toBeInTheDocument()
            expect(screen.getByText('Billing')).toBeInTheDocument()
        })
    })

    describe('Visual States', () => {
        it('should apply active styles to Voice Agents', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            const button = screen.getByText('Voice Agents').closest('button')
            expect(button).toHaveClass('bg-gray-800')
            expect(button).toHaveClass('text-emerald-400')
        })

        it('should apply inactive styles to non-active items', () => {
            render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            const button = screen.getByText('Call Logs').closest('button')
            expect(button).toHaveClass('text-gray-400')
            expect(button).not.toHaveClass('text-emerald-400')
        })

        it('should show correct icons for all items', () => {
            const { container } = render(
                <DashboardSidebar
                    activeView="voice-agents"
                    onNavigate={mockOnNavigate}
                />
            )

            // Check for SVG icons
            const icons = container.querySelectorAll('svg')
            expect(icons.length).toBeGreaterThan(0)
        })
    })
})
