'use client'

import AgentModal from '@/components/AgentModal'
import CallLogsTable from '@/components/CallLogsTable'
import ChatHistory from '@/components/ChatHistory'
import DashboardSidebar from '@/components/DashboardSidebar'
import VoiceAgentsTable from '@/components/VoiceAgentsTable'
import { useState } from 'react'

interface VoiceAgent {
    id: string
    title: string
    prompt: string
    llmModel: string
    sttModel: string
    ttsModel: string
    userId: string
    lastUpdated: string
    createdAt: string
}

export default function DashboardPage() {
    const [activeView, setActiveView] = useState('voice-agents')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAgent, setEditingAgent] = useState<VoiceAgent | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [showChatHistory, setShowChatHistory] = useState(false)
    const [selectedSessionId, setSelectedSessionId] = useState<string>('')

    const handleAddAgent = () => {
        setEditingAgent(null)
        setIsModalOpen(true)
    }

    const handleEditAgent = (agent: VoiceAgent) => {
        setEditingAgent(agent)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setEditingAgent(null)
    }

    const handleModalSuccess = () => {
        setRefreshKey(prev => prev + 1) // Force refresh of the table
    }

    const handleViewCallDetails = (sessionId: string) => {
        setSelectedSessionId(sessionId)
        setShowChatHistory(true)
    }

    const renderContent = () => {
        switch (activeView) {
            case 'voice-agents':
                return (
                    <VoiceAgentsTable
                        key={refreshKey}
                        onAddAgent={handleAddAgent}
                        onEditAgent={handleEditAgent}
                    />
                )

            case 'call-logs':
                return (
                    <CallLogsTable
                        onViewCallDetails={handleViewCallDetails}
                    />
                )

            case 'phone-number':
            case 'campaigns':
            case 'agent-knowledge':
            case 'api-keys':
            case 'credentials':
            case 'billing':
            case 'transactions':
            case 'documentation':
            case 'whats-new':
                return (
                    <div className="flex-1 bg-[#0a0e13] flex flex-col">
                        <div className="border-b border-gray-800 px-8 py-6">
                            <h1 className="text-2xl font-semibold text-white capitalize">
                                {activeView.replace('-', ' ')}
                            </h1>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-gray-400">This feature is coming soon...</p>
                        </div>
                    </div>
                )

            default:
                return (
                    <div className="flex-1 bg-[#0a0e13] flex items-center justify-center">
                        <p className="text-gray-400">Select a view from the sidebar</p>
                    </div>
                )
        }
    }

    return (
        <div className="flex h-screen bg-[#0a0e13] overflow-hidden">
            <DashboardSidebar
                activeView={activeView}
                onNavigate={setActiveView}
            />

            {renderContent()}

            <AgentModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                agent={editingAgent}
                onSuccess={handleModalSuccess}
            />

            <ChatHistory
                isOpen={showChatHistory}
                onClose={() => setShowChatHistory(false)}
                initialSessionId={selectedSessionId}
            />
        </div>
    )
}
