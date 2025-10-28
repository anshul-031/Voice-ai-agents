'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface VoiceAgent {
    id: string;
    title: string;
}

interface WhatsAppMetaConfig {
    appId?: string;
    appSecret?: string;
    businessId?: string;
    accessToken?: string;
    graphApiVersion?: string;
}

interface WhatsAppNumber {
    id: string;
    phoneNumber: string;
    phoneNumberId?: string;
    displayName?: string;
    linkedAgentId?: string;
    status: 'active' | 'inactive';
    metaConfig?: WhatsAppMetaConfig;
}

interface WhatsAppNumberModalProps {
    isOpen: boolean;
    onClose: () => void;
    whatsAppNumber?: WhatsAppNumber;
    onSuccess: () => void;
}

const DEFAULT_GRAPH_VERSION = 'v20.0';

export default function WhatsAppNumberModal({ isOpen, onClose, whatsAppNumber, onSuccess }: WhatsAppNumberModalProps) {
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingAgents, setLoadingAgents] = useState(false);
    const [formData, setFormData] = useState({
        phoneNumber: '',
        displayName: '',
        phoneNumberId: '',
        linkedAgentId: '',
        status: 'active' as 'active' | 'inactive',
        metaAppId: '',
        metaAppSecret: '',
        metaBusinessId: '',
        metaAccessToken: '',
        graphApiVersion: DEFAULT_GRAPH_VERSION,
    });

    const isEditMode = Boolean(whatsAppNumber);

    useEffect(() => {
        if (isOpen) {
            // Load agents
            setLoadingAgents(true);
            fetch('/api/voice-agents?userId=mukul')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch agents');
                    return res.json();
                })
                .then(data => {
                    console.log('Loaded agents:', data.agents?.length || 0);
                    setAgents(data.agents || []);
                })
                .catch((error) => {
                    console.error('Error loading agents:', error);
                    setAgents([]);
                })
                .finally(() => setLoadingAgents(false));

            if (whatsAppNumber) {
                setFormData({
                    phoneNumber: whatsAppNumber.phoneNumber || '',
                    displayName: whatsAppNumber.displayName || '',
                    phoneNumberId: whatsAppNumber.phoneNumberId || '',
                    linkedAgentId: whatsAppNumber.linkedAgentId || '',
                    status: whatsAppNumber.status || 'active',
                    metaAppId: '',
                    metaAppSecret: '',
                    metaBusinessId: '',
                    metaAccessToken: '',
                    graphApiVersion: whatsAppNumber.metaConfig?.graphApiVersion || DEFAULT_GRAPH_VERSION,
                });
            } else {
                setFormData({
                    phoneNumber: '',
                    displayName: '',
                    phoneNumberId: '',
                    linkedAgentId: '',
                    status: 'active',
                    metaAppId: '',
                    metaAppSecret: '',
                    metaBusinessId: '',
                    metaAccessToken: '',
                    graphApiVersion: DEFAULT_GRAPH_VERSION,
                });
            }
        }
    }, [isOpen, whatsAppNumber]);

    const metaFieldsProvided = useMemo(() => {
        return Boolean(
            formData.metaAppId.trim() ||
            formData.metaAppSecret.trim() ||
            formData.metaBusinessId.trim() ||
            formData.metaAccessToken.trim() ||
            formData.graphApiVersion.trim(),
        );
    }, [formData]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const payload: Record<string, unknown> = {
                phoneNumber: formData.phoneNumber.trim(),
                displayName: formData.displayName.trim(),
                phoneNumberId: formData.phoneNumberId.trim(),
                linkedAgentId: formData.linkedAgentId.trim() || undefined,
                status: formData.status,
            };

            const metaConfig = {
                appId: formData.metaAppId.trim(),
                appSecret: formData.metaAppSecret.trim(),
                businessId: formData.metaBusinessId.trim(),
                accessToken: formData.metaAccessToken.trim(),
                graphApiVersion: formData.graphApiVersion.trim() || DEFAULT_GRAPH_VERSION,
            };

            if (!isEditMode || metaFieldsProvided) {
                payload.metaConfig = metaConfig;
            }

            const url = '/api/whatsapp-numbers';
            const method = isEditMode ? 'PUT' : 'POST';
            const body = isEditMode ? { ...payload, id: whatsAppNumber?.id } : payload;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save WhatsApp number');
            }
        } catch (error) {
            console.error('Error saving WhatsApp number:', error);
            alert('Failed to save WhatsApp number');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">
                        {isEditMode ? 'Edit WhatsApp Number' : 'Add WhatsApp Number'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp Number *</label>
                            <input
                                type="text"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="+91-98730 16484"
                                required={!isEditMode}
                                disabled={isEditMode}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Display Name *</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                placeholder="e.g., Support WhatsApp"
                                required
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number ID *</label>
                                <input
                                    type="text"
                                    value={formData.phoneNumberId}
                                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                                    placeholder="Enter WhatsApp Phone Number ID"
                                    required
                                    className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                    className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Link to Agent (Optional)
                                {loadingAgents && <span className="ml-2 text-xs text-gray-500">Loading agents...</span>}
                            </label>
                            <select
                                value={formData.linkedAgentId}
                                onChange={(e) => setFormData({ ...formData, linkedAgentId: e.target.value })}
                                disabled={loadingAgents}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                            >
                                <option value="">-- No Agent Linked --</option>
                                {agents.length === 0 && !loadingAgents && (
                                    <option value="" disabled>No agents available (create one first)</option>
                                )}
                                {agents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Associate inbound WhatsApp messages with a specific voice agent.
                                {agents.length === 0 && !loadingAgents && (
                                    <span className="text-yellow-500"> (No agents found - create an agent first in Voice Agents section)</span>
                                )}
                            </p>
                        </div>

                        <div className="border border-gray-700 rounded-lg p-4 space-y-4 bg-[#0a0e13]">
                            <h3 className="text-sm font-semibold text-white mb-2">Meta Credentials</h3>
                            <p className="text-xs text-gray-500">
                                Provide the Meta app credentials associated with this WhatsApp number. These are required to send outbound responses.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">App ID *</label>
                                    <input
                                        type="text"
                                        value={formData.metaAppId}
                                        onChange={(e) => setFormData({ ...formData, metaAppId: e.target.value })}
                                        placeholder="Meta App ID"
                                        required={!isEditMode}
                                        className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">App Secret *</label>
                                    <input
                                        type="password"
                                        value={formData.metaAppSecret}
                                        onChange={(e) => setFormData({ ...formData, metaAppSecret: e.target.value })}
                                        placeholder="Meta App Secret"
                                        required={!isEditMode}
                                        className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Business ID *</label>
                                    <input
                                        type="text"
                                        value={formData.metaBusinessId}
                                        onChange={(e) => setFormData({ ...formData, metaBusinessId: e.target.value })}
                                        placeholder="Meta Business ID"
                                        required={!isEditMode}
                                        className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Access Token *</label>
                                    <input
                                        type="password"
                                        value={formData.metaAccessToken}
                                        onChange={(e) => setFormData({ ...formData, metaAccessToken: e.target.value })}
                                        placeholder="Meta Access Token"
                                        required={!isEditMode}
                                        className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Graph API Version</label>
                                <input
                                    type="text"
                                    value={formData.graphApiVersion}
                                    onChange={(e) => setFormData({ ...formData, graphApiVersion: e.target.value })}
                                    placeholder="v20.0"
                                    className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                            <strong className="font-semibold">Tip:</strong> Configure the Meta webhook URL shown on the WhatsApp numbers list page. Ensure this app is subscribed to the messages event for the given phone number.
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : isEditMode ? 'Update WhatsApp Number' : 'Add WhatsApp Number'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
