'use client'

import AgentModal from '@/components/AgentModal'
import CallLogsTable from '@/components/CallLogsTable'
import CampaignContactsModal from '@/components/CampaignContactsModal'
import CampaignModal from '@/components/CampaignModal'
import CampaignsTable from '@/components/CampaignsTable'
import ChatHistory from '@/components/ChatHistory'
import DashboardSidebar from '@/components/DashboardSidebar'
import VoiceAgentsTable from '@/components/VoiceAgentsTable'
import { useEffect, useState } from 'react'

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

    // Campaigns state
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [campaignsLoading, setCampaignsLoading] = useState(false)
    const [campaignModalOpen, setCampaignModalOpen] = useState(false)
    const [editingCampaign, setEditingCampaign] = useState<any | null>(null)
    const [campaignsRefreshKey, setCampaignsRefreshKey] = useState(0)
    const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null)
    const [contactsModalOpen, setContactsModalOpen] = useState(false)

    useEffect(() => {
        if (activeView === 'campaigns') {
            setCampaignsLoading(true)
            fetch('/api/campaigns')
                .then(res => res.json())
                .then(data => setCampaigns(data.data || []))
                .catch(() => setCampaigns([]))
                .finally(() => setCampaignsLoading(false))
        }
    }, [activeView, campaignsRefreshKey])

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

    // Campaign handlers
    const handleAddCampaign = () => {
        setEditingCampaign(null)
        setCampaignModalOpen(true)
    }

    const handleEditCampaign = (campaign: any) => {
        setEditingCampaign(campaign)
        setCampaignModalOpen(true)
    }

    const handleViewCampaign = (campaign: any) => {
        setViewingCampaignId(campaign._id)
        setContactsModalOpen(true)
    }

    const handleCampaignModalClose = () => {
        setCampaignModalOpen(false)
        setEditingCampaign(null)
    }

    const handleCampaignModalSuccess = () => {
        setCampaignsRefreshKey(prev => prev + 1)
    }

    const handleContactsModalClose = () => {
        setContactsModalOpen(false)
        setViewingCampaignId(null)
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

            case 'campaigns':
                return campaignsLoading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">Loading campaigns...</div>
                ) : (
                    <CampaignsTable
                        campaigns={campaigns}
                        onAddCampaign={handleAddCampaign}
                        onEditCampaign={handleEditCampaign}
                        onViewCampaign={handleViewCampaign}
                    />
                )

            case 'phone-number':
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

            <CampaignModal
                isOpen={campaignModalOpen}
                onClose={handleCampaignModalClose}
                campaign={editingCampaign}
                onSuccess={handleCampaignModalSuccess}
            />

            <CampaignContactsModal
                isOpen={contactsModalOpen}
                onClose={handleContactsModalClose}
                campaignId={viewingCampaignId}
            />

            <ChatHistory
                isOpen={showChatHistory}
                onClose={() => setShowChatHistory(false)}
                initialSessionId={selectedSessionId}
            />
        </div>
    )
}
