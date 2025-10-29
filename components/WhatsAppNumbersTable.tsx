'use client';

import { Copy, Edit2, MessageCircle, Plus, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
    linkedAgentTitle?: string;
    webhookUrl?: string;
    status: 'active' | 'inactive';
    lastInteractionAt?: string;
    settings?: Record<string, unknown> & { isMock?: boolean };
    metaConfig?: WhatsAppMetaConfig;
    createdAt: string;
    updatedAt: string;
}

interface WhatsAppNumbersTableProps {
    onAddWhatsApp: () => void;
    onEditWhatsApp: (number: WhatsAppNumber) => void;
}

export default function WhatsAppNumbersTable({ onAddWhatsApp, onEditWhatsApp }: WhatsAppNumbersTableProps) {
    const [whatsAppNumbers, setWhatsAppNumbers] = useState<WhatsAppNumber[]>([]);
    const [agents, setAgents] = useState<Array<{ id: string; title: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [deploymentOrigin, setDeploymentOrigin] = useState('');

    useEffect(() => {
        fetchWhatsAppNumbers();
        fetchAgents();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDeploymentOrigin(window.location.origin);
        }
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/voice-agents?userId=mukul');
            if (res.ok) {
                const data = await res.json();
                setAgents(data.agents || []);
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
    };

    const fetchWhatsAppNumbers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/whatsapp-numbers?userId=mukul');
            if (res.ok) {
                const data = await res.json();
                setWhatsAppNumbers(data.whatsappNumbers || []);
            } else {
                console.error('Failed to fetch WhatsApp numbers');
            }
        } catch (error) {
            console.error('Error fetching WhatsApp numbers:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAgentTitle = (agentId?: string) => {
        if (!agentId) return 'Not linked';
        const agent = agents.find(a => a.id === agentId);
        return agent?.title || `Agent ${agentId.slice(0, 8)}...`;
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this WhatsApp number configuration?')) return;

        try {
            const res = await fetch(`/api/whatsapp-numbers?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchWhatsAppNumbers();
            } else {
                alert('Failed to delete WhatsApp number');
            }
        } catch (error) {
            console.error('Error deleting WhatsApp number:', error);
            alert('Failed to delete WhatsApp number');
        }
    };

    const resolvedBaseUrl = useMemo(() => {
        if (deploymentOrigin) {
            return deploymentOrigin.replace(/\/$/, '');
        }
        if (process.env.NEXT_PUBLIC_APP_URL) {
            return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
        }
        return '';
    }, [deploymentOrigin]);

    const buildAbsoluteUrl = (value?: string) => {
        if (!value) {
            return undefined;
        }
        if (value.startsWith('/')) {
            return resolvedBaseUrl ? `${resolvedBaseUrl}${value}` : value;
        }
        return value;
    };

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(`${key}-${text}`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const renderMetaValue = (value?: string) => {
        return value ? <span className="font-mono text-xs text-gray-300">{value}</span> : <span className="text-xs text-gray-500">—</span>;
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-[#0a0e13] via-[#0d1117] to-[#0a0e13] flex flex-col">
            <div className="border-b border-gray-800/50 backdrop-blur-sm bg-[#0a0e13]/80 sticky top-0 z-10">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                WhatsApp Numbers
                            </h1>
                            <p className="text-sm text-gray-400">Connect Meta WhatsApp numbers with your voice agents</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchWhatsAppNumbers}
                                className="flex items-center gap-2 px-4 py-2 bg-[#141b24] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 hover:scale-105"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="text-sm font-medium">Refresh</span>
                            </button>
                            <button
                                onClick={onAddWhatsApp}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-emerald-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm font-medium">Add WhatsApp Number</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-8 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
                            <MessageCircle className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-gray-400 mt-4 text-sm">Loading WhatsApp numbers...</p>
                    </div>
                ) : whatsAppNumbers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No WhatsApp numbers yet</h3>
                        <p className="text-gray-400 text-sm text-center max-w-md mb-4">
                            Add a WhatsApp business number to route inbound messages through your configured voice agents.
                        </p>
                        <button
                            onClick={onAddWhatsApp}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Add WhatsApp Number</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {whatsAppNumbers.map((item) => {
                            const isMock = Boolean(item.settings?.isMock);
                            return (
                                <div
                                    key={item.id}
                                    className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                                <MessageCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                    {item.displayName || 'WhatsApp Number'}
                                                    {isMock && (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                            <ShieldAlert className="w-3 h-3" />
                                                            Mock
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-gray-400">{item.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                                                item.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}>
                                                {item.status}
                                            </span>
                                            <button
                                                onClick={() => onEditWhatsApp(item)}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4 text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4 text-sm">
                                        {item.phoneNumberId && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Phone Number ID</span>
                                                <span className="text-white font-mono text-xs">{item.phoneNumberId}</span>
                                            </div>
                                        )}
                                        {item.metaConfig && (
                                            <div className="grid grid-cols-2 gap-3 bg-[#0a0e13] border border-gray-700/40 rounded-lg p-3">
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="block text-xs uppercase text-gray-500">App ID</span>
                                                        {renderMetaValue(item.metaConfig.appId)}
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs uppercase text-gray-500">App Secret</span>
                                                        {renderMetaValue(item.metaConfig.appSecret)}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="block text-xs uppercase text-gray-500">Business ID</span>
                                                        {renderMetaValue(item.metaConfig.businessId)}
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs uppercase text-gray-500">Access Token</span>
                                                        {renderMetaValue(item.metaConfig.accessToken)}
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="block text-xs uppercase text-gray-500">Graph API Version</span>
                                                    {renderMetaValue(item.metaConfig.graphApiVersion)}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Linked Agent</span>
                                            <span className={`text-xs font-medium ${item.linkedAgentId ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                {getAgentTitle(item.linkedAgentId)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Connection Status</span>
                                            <span className={`text-xs font-medium flex items-center gap-1.5 ${
                                                item.linkedAgentId && item.status === 'active'
                                                    ? 'text-emerald-400'
                                                    : 'text-yellow-400'
                                            }`}>
                                                <span className={`w-2 h-2 rounded-full ${
                                                    item.linkedAgentId && item.status === 'active'
                                                        ? 'bg-emerald-400 animate-pulse'
                                                        : 'bg-yellow-400'
                                                }`} />
                                                {item.linkedAgentId && item.status === 'active'
                                                    ? 'Connected & Ready'
                                                    : item.linkedAgentId
                                                        ? 'Agent Linked (Inactive)'
                                                        : 'No Agent Linked'
                                                }
                                            </span>
                                        </div>

                                        {item.lastInteractionAt && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Last Interaction</span>
                                                <span className="text-white text-xs">
                                                    {new Date(item.lastInteractionAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {item.webhookUrl && (() => {
                                        const absoluteWebhook = buildAbsoluteUrl(item.webhookUrl);
                                        const clipboardValue = absoluteWebhook ?? item.webhookUrl;

                                        return (
                                            <div className="border-t border-gray-700/50 pt-4 space-y-2">
                                                <div className="text-xs font-medium text-gray-400">Webhook URL</div>
                                                <div className="bg-[#0a0e13] rounded-lg p-3 border border-gray-700/50">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-gray-400">Meta Webhook</span>
                                                        <button
                                                            onClick={() => copyToClipboard(clipboardValue, 'webhook')}
                                                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                            {copiedKey === `webhook-${clipboardValue}` ? 'Copied!' : 'Copy'}
                                                        </button>
                                                    </div>
                                                    <code className="text-xs text-gray-300 break-all">{absoluteWebhook ?? item.webhookUrl}</code>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
