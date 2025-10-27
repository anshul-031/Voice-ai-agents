'use client';

import { Edit, MoreVertical, Plus, Trash2, User } from 'lucide-react';
import Link from 'next/link';
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

interface VoiceAgentsTableProps {
    onAddAgent: () => void
    onEditAgent: (agent: VoiceAgent) => void
}

export default function VoiceAgentsTable({ onAddAgent, onEditAgent }: VoiceAgentsTableProps) {
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/voice-agents?userId=mukul');
            if (res.ok) {
                const data = await res.json();
                // API returns { success, userId, agents, count }
                setAgents(data.agents || []);
            } else {
                setAgents([]);
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
            setAgents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (agentId: string) => {
        if (!confirm('Are you sure you want to delete this agent?')) return;

        try {
            const res = await fetch('/api/voice-agents', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: agentId }),
            });

            if (res.ok) {
                setAgents(agents.filter(a => a.id !== agentId));
                setOpenMenuId(null);
            }
        } catch (error) {
            console.error('Error deleting agent:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${year}\n${hours}:${minutes}`;
    };

    return (
        <div className="flex-1 bg-[#0a0e13] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-800 px-8 py-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">Voice Agents</h1>
                <button
                    onClick={onAddAgent}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-8 py-6">
                {loading ? (
                    <div className="text-gray-400 text-center py-8">Loading...</div>
                ) : agents.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
        No voice agents yet. Click "Add" to create one.
                    </div>
                ) : (
                    <div className="bg-[#0f1419] rounded-xl border border-gray-800/50 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-4 text-sm font-medium text-gray-400 bg-[#0a0e13] border-b border-gray-800/50">
                            <div className="px-6 py-3 border-r border-gray-800/30">Name</div>
                            <div className="px-6 py-3 border-r border-gray-800/30 flex items-center gap-1">
            Created
                                <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </div>
                            <div className="px-6 py-3 border-r border-gray-800/30">Status</div>
                            <div className="px-6 py-3">Actions</div>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-gray-800/30">
                            {agents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="grid grid-cols-4 px-6 py-4 border-b border-gray-800/30 even:bg-[#11161d] hover:bg-[#1a2332]/40 transition-all duration-150"
                                >
                                    {/* Name */}
                                    <div className="flex items-center gap-3 border-r border-gray-800/30 last:border-r-0">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/agents/${agent.id}`}
                                                className="text-white font-medium truncate hover:text-emerald-400 transition-colors cursor-pointer block"
                                            >
                                                {agent.title}
                                            </Link>
                                            <div className="text-sm text-gray-400 truncate">
                                                {agent.prompt.substring(0, 80)}...
                                            </div>
                                        </div>
                                    </div>

                                    {/* Created */}
                                    <div className="flex items-center text-sm text-gray-300 border-r border-gray-800/30 last:border-r-0">
                                        {formatDate(agent.createdAt)}
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  Active
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-center relative">
                                        <button
                                            onClick={() =>
                                                setOpenMenuId(openMenuId === agent.id ? null : agent.id)
                                            }
                                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </button>

                                        {openMenuId === agent.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setOpenMenuId(null)}
                                                />
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a2332] border border-gray-700 rounded-lg shadow-xl z-20">
                                                    <button
                                                        onClick={() => {
                                                            onEditAgent(agent);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(agent.id)}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors rounded-b-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
}
