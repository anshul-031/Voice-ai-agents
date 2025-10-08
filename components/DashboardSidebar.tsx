'use client'

import { useState, useEffect } from 'react'
import {
    Bot,
    Phone,
    Megaphone,
    BookOpen,
    PhoneCall,
    Settings,
    FileText,
    Sparkles,
    ChevronDown,
    Key,
    CreditCard,
    Banknote,
    Receipt
} from 'lucide-react'

interface DashboardSidebarProps {
    activeView: string
    onNavigate: (view: string) => void
}

export default function DashboardSidebar({ activeView, onNavigate }: DashboardSidebarProps) {
    const settingsItems = [
        { id: 'api-keys', label: 'API Keys', icon: Key },
        { id: 'credentials', label: 'Credentials', icon: CreditCard },
        { id: 'billing', label: 'Billing', icon: Banknote },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
    ]

    // Auto-expand settings if any settings item is active
    const isSettingsItemActive = settingsItems.some(item => item.id === activeView)
    const [settingsExpanded, setSettingsExpanded] = useState(isSettingsItemActive)

    // Keep settings expanded when activeView changes to a settings item
    useEffect(() => {
        if (isSettingsItemActive) {
            setSettingsExpanded(true)
        }
    }, [isSettingsItemActive])

    const navItems = [
        { id: 'voice-agents', label: 'Voice Agents', icon: Bot },
        { id: 'phone-number', label: 'Phone Number', icon: Phone },
        { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
        { id: 'agent-knowledge', label: 'Agent Knowledge', icon: BookOpen },
        { id: 'call-logs', label: 'Call Logs', icon: PhoneCall },
    ]

    const bottomNavItems = [
        { id: 'documentation', label: 'Documentation', icon: FileText },
        { id: 'whats-new', label: "What's New", icon: Sparkles },
    ]

    return (
        <div className="w-56 bg-[#0f1419] border-r border-gray-800 flex flex-col h-screen">
            {/* Main Navigation */}
            <div className="flex-1 py-4 overflow-y-auto">
                <nav className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeView === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-gray-800 text-emerald-400'
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}

                    {/* Settings with Submenu */}
                    <div>
                        <button
                            onClick={() => setSettingsExpanded(!settingsExpanded)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${settingsExpanded || settingsItems.some(item => item.id === activeView)
                                ? 'bg-gray-800 text-gray-300'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                                }`}
                        >
                            <Settings className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 text-left">Settings</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${settingsExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {settingsExpanded && (
                            <div className="mt-1 ml-4 space-y-1">
                                {settingsItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = activeView === item.id
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onNavigate(item.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                                ? 'bg-gray-800 text-emerald-400'
                                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span>{item.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            {/* Bottom Navigation */}
            <div className="border-t border-gray-800 py-4 px-2">
                <nav className="space-y-1">
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeView === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-gray-800 text-emerald-400'
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
