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
import { useCampaignPolling } from '@/hooks/useCampaignPolling';
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
    knowledgeItems?: Array<{
        itemId: string;
        name: string;
        type: 'text' | 'csv';
        size: number;
        content: string;
        preview?: string;
        createdAt: string;
    }>
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
    const [startingCampaignId, setStartingCampaignId] = useState<string | null>(null);
    const [retriggeringCampaignId, setRetriggeringCampaignId] = useState<string | null>(null);
    const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
    const [pollingCampaignId, setPollingCampaignId] = useState<string | null>(null);

    // Phone Numbers state
    const [phoneNumberModalOpen, setPhoneNumberModalOpen] = useState(false);
    const [editingPhoneNumber, setEditingPhoneNumber] = useState<PhoneNumber | undefined>(undefined);
    const [phoneNumbersRefreshKey, setPhoneNumbersRefreshKey] = useState(0);
    const [whatsAppNumberModalOpen, setWhatsAppNumberModalOpen] = useState(false);
    const [editingWhatsAppNumber, setEditingWhatsAppNumber] = useState<WhatsAppNumber | undefined>(undefined);
    const [whatsAppNumbersRefreshKey, setWhatsAppNumbersRefreshKey] = useState(0);

    // Set up campaign polling for real-time progress updates
    useCampaignPolling({
        campaignId: pollingCampaignId,
        enabled: pollingCampaignId !== null,
        onUpdate: (updatedCampaign) => {
            setCampaigns(prevCampaigns =>
                prevCampaigns.map(campaign =>
                    campaign._id === updatedCampaign._id
                        ? { ...campaign, ...updatedCampaign }
                        : campaign,
                ),
            );
        },
        onComplete: () => {
            // Stop polling when campaign is completed
            setPollingCampaignId(null);
            setStartingCampaignId(null);
            setRetriggeringCampaignId(null);
        },
        onError: (error) => {
            console.error('Polling error:', error);
        },
    });

    useEffect(() => {
        if (activeView === 'campaigns') {
            setCampaignsLoading(true);
            fetch('/api/campaigns')
                .then(res => res.json())
                /* istanbul ignore next */
                .then(data => setCampaigns(data.data || []))
                /* istanbul ignore next */
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
        /* istanbul ignore next */
        if (!campaign?._id) {
            return;
        }

        if (campaign.status === 'running') {
            alert('Campaign is already running.');
            return;
        }

        const confirmed = window.confirm(`Start campaign "${campaign.title}"?`);
        if (!confirmed) {
            return;
        }

        try {
            setStartingCampaignId(campaign._id);
            const response = await fetch('/api/campaigns/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ campaign_id: campaign._id }),
            });

            const data = await response.json();
            /* istanbul ignore next */
            if (!response.ok || !data?.success) {
                /* istanbul ignore next */
                throw new Error(data?.error || 'Failed to start campaign');
            }

            alert('Campaign starting. Calls are being placed.');

            // Start polling for this campaign
            setPollingCampaignId(campaign._id);

            setCampaignsRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error starting campaign:', error);
            /* istanbul ignore next */
            alert(error instanceof Error ? error.message : 'Failed to start campaign');
            setStartingCampaignId(null);
        }
    };

    const handleRetriggerCampaign = async (campaign: Campaign) => {
        /* istanbul ignore next */
        if (!campaign?._id) {
            return;
        }

        const confirmed = window.confirm(`Retrigger campaign "${campaign.title}"?`);
        if (!confirmed) {
            return;
        }

        try {
            setRetriggeringCampaignId(campaign._id);
            const response = await fetch(`/api/campaigns/${campaign._id}/retrigger`, {
                method: 'POST',
            });

            const data = await response.json();
            /* istanbul ignore next */
            if (!response.ok || !data?.success) {
                /* istanbul ignore next */
                throw new Error(data?.error || 'Failed to retrigger campaign');
            }

            alert('Campaign retriggered successfully.');

            // Start polling for this campaign
            setPollingCampaignId(campaign._id);

            setCampaignsRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error retriggering campaign:', error);
            /* istanbul ignore next */
            alert(error instanceof Error ? error.message : 'Failed to retrigger campaign');
            setRetriggeringCampaignId(null);
        }
    };

    const handleDeleteCampaign = async (campaign: Campaign) => {
        /* istanbul ignore next */
        if (!campaign?._id) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete campaign "${campaign.title}"? This action cannot be undone.`,
        );
        if (!confirmed) {
            return;
        }

        try {
            setDeletingCampaignId(campaign._id);
            const response = await fetch(`/api/campaigns?id=${campaign._id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            /* istanbul ignore next */
            if (!response.ok || !data?.success) {
                /* istanbul ignore next */
                throw new Error(data?.error || 'Failed to delete campaign');
            }

            alert('Campaign deleted successfully.');
            setCampaignsRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error deleting campaign:', error);
            /* istanbul ignore next */
            alert(error instanceof Error ? error.message : 'Failed to delete campaign');
        } finally {
            setDeletingCampaignId(null);
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
                    onRetriggerCampaign={handleRetriggerCampaign}
                    onDeleteCampaign={handleDeleteCampaign}
                    startingId={startingCampaignId}
                    retriggeringId={retriggeringCampaignId}
                    deletingId={deletingCampaignId}
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
