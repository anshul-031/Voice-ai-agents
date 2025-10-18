'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VoiceAgent {
    id: string;
    title: string;
    prompt: string;
    llmModel: string;
    sttModel: string;
    ttsModel: string;
    userId: string;
    lastUpdated: string;
    createdAt: string;
}

interface PhoneNumber {
    id: string;
    phoneNumber: string;
    provider: string;
    displayName: string;
    status: string;
    linkedAgentId?: string;
    exotelConfig?: {
        sid: string;
        appId?: string;
        domain: string;
        region: string;
    };
}

interface PhoneNumberModalProps {
    isOpen: boolean
    onClose: () => void
    phoneNumber?: PhoneNumber
    onSuccess: () => void
}

export default function PhoneNumberModal({ isOpen, onClose, phoneNumber, onSuccess }: PhoneNumberModalProps) {
    const [formData, setFormData] = useState({
        phoneNumber: '',
        displayName: '',
        provider: 'exotel',
        exotelApiKey: '',
        exotelApiToken: '',
        exotelSid: '',
        exotelAppId: '',
        exotelDomain: 'api.in.exotel.com',
        exotelRegion: 'in',
        linkedAgentId: '',
    });
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<VoiceAgent[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Fetch agents for linking
            fetch('/api/voice-agents?userId=mukul')
                .then(res => res.json())
                .then(data => setAgents(data.agents || []))
                .catch(() => setAgents([]));

            // Populate form if editing
            if (phoneNumber) {
                setFormData({
                    phoneNumber: phoneNumber.phoneNumber || '',
                    displayName: phoneNumber.displayName || '',
                    provider: phoneNumber.provider || 'exotel',
                    exotelApiKey: '',
                    exotelApiToken: '',
                    exotelSid: phoneNumber.exotelConfig?.sid || '',
                    exotelAppId: phoneNumber.exotelConfig?.appId || '',
                    exotelDomain: phoneNumber.exotelConfig?.domain || 'api.in.exotel.com',
                    exotelRegion: phoneNumber.exotelConfig?.region || 'in',
                    linkedAgentId: phoneNumber.linkedAgentId || '',
                });
            } else {
                // Reset form for new phone number
                setFormData({
                    phoneNumber: '',
                    displayName: '',
                    provider: 'exotel',
                    exotelApiKey: '',
                    exotelApiToken: '',
                    exotelSid: '',
                    exotelAppId: '',
                    exotelDomain: 'api.in.exotel.com',
                    exotelRegion: 'in',
                    linkedAgentId: '',
                });
            }
        }
    }, [isOpen, phoneNumber]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: Partial<Omit<PhoneNumber, 'id' | 'userId' | 'status'> & { exotelConfig?: Record<string, unknown> }> = {
                phoneNumber: formData.phoneNumber,
                displayName: formData.displayName,
                provider: formData.provider,
                linkedAgentId: formData.linkedAgentId || undefined,
            };

            if (formData.provider === 'exotel') {
                payload.exotelConfig = {
                    apiKey: formData.exotelApiKey,
                    apiToken: formData.exotelApiToken,
                    sid: formData.exotelSid,
                    appId: formData.exotelAppId || undefined,
                    domain: formData.exotelDomain,
                    region: formData.exotelRegion,
                };
            }

            const url = phoneNumber
                ? '/api/phone-numbers'
                : '/api/phone-numbers';

            const res = await fetch(url, {
                method: phoneNumber ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(phoneNumber ? { ...payload, id: phoneNumber.id } : payload),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save phone number');
            }
        } catch (error) {
            console.error('Error saving phone number:', error);
            alert('Failed to save phone number');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">
                        {phoneNumber ? 'Edit Phone Number' : 'Import Phone Number'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="space-y-4">
                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="text"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="+919876543210"
                                required
                                disabled={!!phoneNumber}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                            />
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Display Name *
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                placeholder="e.g., Support Line, Sales Number"
                                required
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Provider */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Provider
                            </label>
                            <select
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="exotel">Exotel</option>
                                <option value="twilio">Twilio</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Exotel Configuration */}
                        {formData.provider === 'exotel' && (
                            <div className="border border-gray-700 rounded-lg p-4 space-y-4 bg-[#0a0e13]">
                                <h3 className="text-sm font-semibold text-white mb-2">Exotel Configuration</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            API Key *
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.exotelApiKey}
                                            onChange={(e) => setFormData({ ...formData, exotelApiKey: e.target.value })}
                                            placeholder="Enter Exotel API Key"
                                            required={!phoneNumber}
                                            className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            API Token *
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.exotelApiToken}
                                            onChange={(e) => setFormData({ ...formData, exotelApiToken: e.target.value })}
                                            placeholder="Enter Exotel API Token"
                                            required={!phoneNumber}
                                            className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        SID (Account SID) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.exotelSid}
                                        onChange={(e) => setFormData({ ...formData, exotelSid: e.target.value })}
                                        placeholder="Enter Exotel SID"
                                        required={!phoneNumber}
                                        className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        App ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.exotelAppId}
                                        onChange={(e) => setFormData({ ...formData, exotelAppId: e.target.value })}
                                        placeholder="Enter Exotel App ID"
                                        className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Domain
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.exotelDomain}
                                            onChange={(e) => setFormData({ ...formData, exotelDomain: e.target.value })}
                                            placeholder="api.in.exotel.com"
                                            className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Region
                                        </label>
                                        <select
                                            value={formData.exotelRegion}
                                            onChange={(e) => setFormData({ ...formData, exotelRegion: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="in">India (in)</option>
                                            <option value="us">USA (us)</option>
                                            <option value="sg">Singapore (sg)</option>
                                            <option value="ae">UAE (ae)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Link to Agent */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Link to Agent (Optional)
                            </label>
                            <select
                                value={formData.linkedAgentId}
                                onChange={(e) => setFormData({ ...formData, linkedAgentId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">-- No Agent Linked --</option>
                                {agents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Link this phone number to a specific agent to handle incoming calls
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <p className="text-sm text-blue-300">
                                <strong>Note:</strong> After saving, you'll receive webhook URLs that need to be configured in your Exotel portal.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
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
                            {loading ? 'Saving...' : phoneNumber ? 'Update Phone Number' : 'Import Phone Number'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
