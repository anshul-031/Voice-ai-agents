'use client';

import AgentModal from '@/components/AgentModal';
import CallLogsTable from '@/components/CallLogsTable';
import CampaignContactsModal from '@/components/CampaignContactsModal';
import CampaignModal from '@/components/CampaignModal';
import CampaignsTable from '@/components/CampaignsTable';
import ChatHistory from '@/components/ChatHistory';
import DashboardSidebar from '@/components/DashboardSidebar';
import PhoneNumberModal from '@/components/PhoneNumberModal';
import PhoneNumbersTable from '@/components/PhoneNumbersTable';
import VoiceAgentsTable from '@/components/VoiceAgentsTable';
import WhatsAppNumberModal from '@/components/WhatsAppNumberModal';
import WhatsAppNumbersTable from '@/components/WhatsAppNumbersTable';
import { useEffect, useState } from 'react';

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

interface Campaign {
    _id?: string;
    title: string;
    start_date: string;
    updated_at: string;
    status: 'running' | 'stopped' | 'completed';
    agent_id: string;
    user_id: string;
    total_contacts?: number;
    calls_completed?: number;
    calls_failed?: number;
    started_at?: string;
}

interface PhoneNumber {
    id: string;
    phoneNumber: string;
    provider: string;
    displayName: string;
    status: string;
    linkedAgentId?: string;
    webhookUrl?: string;
    websocketUrl?: string;
    exotelConfig?: {
        sid: string;
        domain: string;
        region: string;
    };
    lastUsed?: string;
}

interface WhatsAppNumber {
    id: string;
    phoneNumber: string;
    phoneNumberId?: string;
    displayName?: string;
    status: 'active' | 'inactive';
    linkedAgentId?: string;
    webhookUrl?: string;
    metaConfig?: {
        appId?: string;
        appSecret?: string;
        businessId?: string;
        accessToken?: string;
        graphApiVersion?: string;
    };
}

export default function DashboardPage() {
    const [activeView, setActiveView] = useState('voice-agents');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<VoiceAgent | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showChatHistory, setShowChatHistory] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');

    // Campaigns state
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [campaignsLoading, setCampaignsLoading] = useState(false);
    const [campaignModalOpen, setCampaignModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [campaignsRefreshKey, setCampaignsRefreshKey] = useState(0);
    const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);
    const [contactsModalOpen, setContactsModalOpen] = useState(false);

    // Phone Numbers state
    const [phoneNumberModalOpen, setPhoneNumberModalOpen] = useState(false);
    const [editingPhoneNumber, setEditingPhoneNumber] = useState<PhoneNumber | undefined>(undefined);
    const [phoneNumbersRefreshKey, setPhoneNumbersRefreshKey] = useState(0);
    const [whatsAppNumberModalOpen, setWhatsAppNumberModalOpen] = useState(false);
    const [editingWhatsAppNumber, setEditingWhatsAppNumber] = useState<WhatsAppNumber | undefined>(undefined);
    const [whatsAppNumbersRefreshKey, setWhatsAppNumbersRefreshKey] = useState(0);

    useEffect(() => {
        if (activeView === 'campaigns') {
            setCampaignsLoading(true);
            fetch('/api/campaigns')
                .then(res => res.json())
                .then(data => setCampaigns(data.data || []))
                .catch(() => setCampaigns([]))
                .finally(() => setCampaignsLoading(false));
        }
    }, [activeView, campaignsRefreshKey]);

    const handleAddAgent = () => {
        setEditingAgent(null);
        setIsModalOpen(true);
    };

    const handleEditAgent = (agent: VoiceAgent) => {
        setEditingAgent(agent);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingAgent(null);
    };

    const handleModalSuccess = () => {
        setRefreshKey(prev => prev + 1); // Force refresh of the table
    };

    const handleViewCallDetails = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setShowChatHistory(true);
    };

    // Campaign handlers
    const handleAddCampaign = () => {
        setEditingCampaign(null);
        setCampaignModalOpen(true);
    };

    const handleEditCampaign = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setCampaignModalOpen(true);
    };

    const handleViewCampaign = (campaign: Campaign) => {
        if (campaign._id) {
            setViewingCampaignId(campaign._id);
            setContactsModalOpen(true);
        }
    };

    const handleCampaignModalClose = () => {
        setCampaignModalOpen(false);
        setEditingCampaign(null);
    };

    const handleCampaignModalSuccess = () => {
        setCampaignsRefreshKey(prev => prev + 1);
    };

    const handleContactsModalClose = () => {
        setContactsModalOpen(false);
        setViewingCampaignId(null);
    };

    const handleStartCampaign = async (campaign: Campaign) => {
        if (!confirm(`Are you sure you want to start campaign "${campaign.title}"? This will trigger calls to all contacts in the campaign.`)) {
            return;
        }

        try {
            const response = await fetch('/api/campaigns/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ campaign_id: campaign._id }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Campaign started successfully! Calling ${data.data.total_contacts} contacts.`);
                setCampaignsRefreshKey(prev => prev + 1); // Refresh campaigns list
            } else {
                alert(`Failed to start campaign: ${data.error || 'Unknown error'}`);
            }
        } catch (error: unknown) {
            console.error('Error starting campaign:', error);
            alert('An error occurred while starting the campaign.');
        }
    };

    // Phone Number handlers
    const handleAddPhoneNumber = () => {
        setEditingPhoneNumber(undefined);
        setPhoneNumberModalOpen(true);
    };

    const handleEditPhoneNumber = (phone: PhoneNumber) => {
        setEditingPhoneNumber(phone);
        setPhoneNumberModalOpen(true);
    };

    const handlePhoneNumberModalClose = () => {
        setPhoneNumberModalOpen(false);
        setEditingPhoneNumber(undefined);
    };

    const handlePhoneNumberModalSuccess = () => {
        setPhoneNumbersRefreshKey(prev => prev + 1);
    };

    const handleAddWhatsAppNumber = () => {
        setEditingWhatsAppNumber(undefined);
        setWhatsAppNumberModalOpen(true);
    };

    const handleEditWhatsAppNumber = (number: WhatsAppNumber) => {
        setEditingWhatsAppNumber(number);
        setWhatsAppNumberModalOpen(true);
    };

    const handleWhatsAppNumberModalClose = () => {
        setWhatsAppNumberModalOpen(false);
        setEditingWhatsAppNumber(undefined);
    };

    const handleWhatsAppNumberModalSuccess = () => {
        setWhatsAppNumbersRefreshKey(prev => prev + 1);
    };

    const renderContent = () => {
        switch (activeView) {
        case 'voice-agents':
            return (
                <VoiceAgentsTable
                    key={refreshKey}
                    onAddAgent={handleAddAgent}
                    onEditAgent={handleEditAgent}
                />
            );

        case 'call-logs':
            return (
                <CallLogsTable
                    onViewCallDetails={handleViewCallDetails}
                />
            );

        case 'campaigns':
            return campaignsLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">Loading campaigns...</div>
            ) : (
                <CampaignsTable
                    campaigns={campaigns}
                    onAddCampaign={handleAddCampaign}
                    onEditCampaign={handleEditCampaign}
                    onViewCampaign={handleViewCampaign}
                    onStartCampaign={handleStartCampaign}
                />
            );

        case 'phone-number':
            return (
                <PhoneNumbersTable
                    key={phoneNumbersRefreshKey}
                    onAddPhone={handleAddPhoneNumber}
                    onEditPhone={handleEditPhoneNumber}
                />
            );

        case 'whatsapp-number':
            return (
                <WhatsAppNumbersTable
                    key={whatsAppNumbersRefreshKey}
                    onAddWhatsApp={handleAddWhatsAppNumber}
                    onEditWhatsApp={handleEditWhatsAppNumber}
                />
            );

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
            );

        default:
            return (
                <div className="flex-1 bg-[#0a0e13] flex items-center justify-center">
                    <p className="text-gray-400">Select a view from the sidebar</p>
                </div>
            );
        }
    };

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

            <PhoneNumberModal
                isOpen={phoneNumberModalOpen}
                onClose={handlePhoneNumberModalClose}
                phoneNumber={editingPhoneNumber}
                onSuccess={handlePhoneNumberModalSuccess}
            />

            <WhatsAppNumberModal
                isOpen={whatsAppNumberModalOpen}
                onClose={handleWhatsAppNumberModalClose}
                whatsAppNumber={editingWhatsAppNumber}
                onSuccess={handleWhatsAppNumberModalSuccess}
            />

            <ChatHistory
                isOpen={showChatHistory}
                onClose={() => setShowChatHistory(false)}
                initialSessionId={selectedSessionId}
            />
        </div>
    );
}
