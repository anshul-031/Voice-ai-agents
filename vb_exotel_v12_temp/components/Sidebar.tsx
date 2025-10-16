'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone,
    Bot,
    Plus,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Edit,
    Save,
    X
} from 'lucide-react';

interface VoiceAgent {
    id: string;
    userId: string;
    title: string;
    prompt: string;
    lastUpdated: string;
    createdAt: string;
}

interface ChatSession {
    sessionId: string;
    userId: string;
    messageCount: number;
    firstMessage: string;
    lastMessage: string;
    lastTimestamp: string;
    firstTimestamp: string;
}

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onSelectAgent: (prompt: string) => void;
    onViewSession: (sessionId: string) => void;
}

type ActiveTab = 'call-log' | 'voice-agents';

export default function Sidebar({ isOpen, onToggle, onSelectAgent, onViewSession }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>('call-log');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Voice agent form state
    const [showAgentForm, setShowAgentForm] = useState(false);
    const [editingAgent, setEditingAgent] = useState<VoiceAgent | null>(null);
    const [agentTitle, setAgentTitle] = useState('');
    const [agentPrompt, setAgentPrompt] = useState('');

    const userId = 'mukul'; // Hardcoded for now

    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'call-log') {
                fetchSessions();
            } else {
                fetchAgents();
            }
        }
    }, [isOpen, activeTab]);

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/chat/sessions?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch sessions');
            const data = await response.json();
            setSessions(data.sessions || []);
        } catch (err) {
            console.error('[Sidebar] Error fetching sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    const fetchAgents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/voice-agents?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch agents');
            const data = await response.json();
            setAgents(data.agents || []);
        } catch (err) {
            console.error('[Sidebar] Error fetching agents:', err);
            setError(err instanceof Error ? err.message : 'Failed to load voice agents');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAgent = async () => {
        if (!agentTitle.trim() || !agentPrompt.trim()) {
            alert('Please fill in both title and prompt');
            return;
        }

        try {
            const response = await fetch('/api/voice-agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    title: agentTitle.trim(),
                    prompt: agentPrompt.trim(),
                }),
            });

            if (!response.ok) throw new Error('Failed to create agent');

            setAgentTitle('');
            setAgentPrompt('');
            setShowAgentForm(false);
            fetchAgents();
        } catch (err) {
            console.error('[Sidebar] Error creating agent:', err);
            alert('Failed to create voice agent');
        }
    };

    const handleUpdateAgent = async () => {
        if (!editingAgent || !agentTitle.trim() || !agentPrompt.trim()) return;

        try {
            const response = await fetch('/api/voice-agents', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingAgent.id,
                    title: agentTitle.trim(),
                    prompt: agentPrompt.trim(),
                }),
            });

            if (!response.ok) throw new Error('Failed to update agent');

            setEditingAgent(null);
            setAgentTitle('');
            setAgentPrompt('');
            fetchAgents();
        } catch (err) {
            console.error('[Sidebar] Error updating agent:', err);
            alert('Failed to update voice agent');
        }
    };

    const handleDeleteAgent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this voice agent?')) return;

        try {
            const response = await fetch(`/api/voice-agents?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete agent');

            fetchAgents();
        } catch (err) {
            console.error('[Sidebar] Error deleting agent:', err);
            alert('Failed to delete voice agent');
        }
    };

    const startEditAgent = (agent: VoiceAgent) => {
        setEditingAgent(agent);
        setAgentTitle(agent.title);
        setAgentPrompt(agent.prompt);
        setShowAgentForm(true);
    };

    const cancelForm = () => {
        setShowAgentForm(false);
        setEditingAgent(null);
        setAgentTitle('');
        setAgentPrompt('');
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <>
            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{ width: isOpen ? 320 : 0 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900 border-r border-slate-700 overflow-hidden flex flex-col h-full"
            >
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col h-full w-80"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-white">Menu</h2>
                                    <button
                                        onClick={onToggle}
                                        className="p-1 hover:bg-slate-800 rounded transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveTab('call-log')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${activeTab === 'call-log'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-800 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span className="text-sm font-medium">Call Log</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('voice-agents')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${activeTab === 'voice-agents'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-800 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <Bot className="w-4 h-4" />
                                        <span className="text-sm font-medium">Agents</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {loading && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Call Log Tab */}
                                {!loading && !error && activeTab === 'call-log' && (
                                    <div className="space-y-2">
                                        {sessions.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                No call history yet
                                            </div>
                                        ) : (
                                            sessions.map((session) => (
                                                <motion.div
                                                    key={session.sessionId}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => onViewSession(session.sessionId)}
                                                    className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 cursor-pointer transition-colors border border-slate-700"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <Phone className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-300 truncate">
                                                                {session.firstMessage.substring(0, 40)}...
                                                            </p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    {session.messageCount} messages
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatTimestamp(session.lastTimestamp)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Voice Agents Tab */}
                                {!loading && !error && activeTab === 'voice-agents' && (
                                    <div className="space-y-3">
                                        {/* Add New Agent Button */}
                                        {!showAgentForm && (
                                            <button
                                                onClick={() => setShowAgentForm(true)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span className="text-sm font-medium">New Agent</span>
                                            </button>
                                        )}

                                        {/* Agent Form */}
                                        {showAgentForm && (
                                            <div className="bg-slate-800 rounded-lg p-4 space-y-3 border border-purple-500">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-white">
                                                        {editingAgent ? 'Edit Agent' : 'New Agent'}
                                                    </h3>
                                                    <button
                                                        onClick={cancelForm}
                                                        className="p-1 hover:bg-slate-700 rounded"
                                                    >
                                                        <X className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Agent Title"
                                                    value={agentTitle}
                                                    onChange={(e) => setAgentTitle(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                                                />
                                                <textarea
                                                    placeholder="System Prompt"
                                                    value={agentPrompt}
                                                    onChange={(e) => setAgentPrompt(e.target.value)}
                                                    rows={6}
                                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm resize-none"
                                                />
                                                <button
                                                    onClick={editingAgent ? handleUpdateAgent : handleCreateAgent}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {editingAgent ? 'Update' : 'Create'}
                                                    </span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Agent List */}
                                        <div className="space-y-2">
                                            {agents.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500 text-sm">
                                                    No voice agents yet
                                                </div>
                                            ) : (
                                                agents.map((agent) => (
                                                    <div
                                                        key={agent.id}
                                                        className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div
                                                                className="flex-1 min-w-0 cursor-pointer"
                                                                onClick={() => onSelectAgent(agent.prompt)}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Bot className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                                                    <h4 className="text-sm font-medium text-white truncate">
                                                                        {agent.title}
                                                                    </h4>
                                                                </div>
                                                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                                    {agent.prompt.substring(0, 80)}...
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {formatTimestamp(agent.lastUpdated)}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => startEditAgent(agent)}
                                                                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5 text-blue-400" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAgent(agent.id)}
                                                                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Toggle Button (when sidebar is closed) */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="fixed left-0 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-r-lg shadow-lg transition-colors z-40"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </>
    );
}
