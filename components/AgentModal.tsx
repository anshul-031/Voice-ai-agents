'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EnabledTool {
    toolName: string;
    enabled: boolean;
    config?: Record<string, any>;
}

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
    enabledTools?: EnabledTool[]
}

interface AgentModalProps {
    isOpen: boolean
    onClose: () => void
    agent?: VoiceAgent | null
    onSuccess: () => void
}

const AVAILABLE_TOOLS = [
    { name: 'pdf_maker', label: 'PDF Maker', icon: '📄', description: 'Create professional PDF documents', color: '#EF4444' },
    { name: 'word_creator', label: 'Word Creator', icon: '📝', description: 'Generate DOCX files', color: '#3B82F6' },
    { name: 'spreadsheet_creator', label: 'Spreadsheet Creator', icon: '📊', description: 'Create Excel/CSV files', color: '#10B981' },
    { name: 'file_reader', label: 'File Reader', icon: '📖', description: 'Read uploaded documents', color: '#8B5CF6' },
    { name: 'document_summarizer', label: 'Document Summarizer', icon: '📋', description: 'Summarize documents', color: '#F59E0B' },
    { name: 'pdf_editor', label: 'PDF Editor', icon: '✏️', description: 'Merge & edit PDFs', color: '#EC4899' },
];

export default function AgentModal({ isOpen, onClose, agent, onSuccess }: AgentModalProps) {
    const [title, setTitle] = useState('');
    const [prompt, setPrompt] = useState('');
    const [llmModel, setLlmModel] = useState('Gemini 1.5 Flash');
    const [sttModel, setSttModel] = useState('AssemblyAI Universal');
    const [ttsModel, setTtsModel] = useState('Sarvam Manisha');
    const [enabledTools, setEnabledTools] = useState<EnabledTool[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (agent) {
            setTitle(agent.title);
            setPrompt(agent.prompt);
            setLlmModel(agent.llmModel || 'Gemini 1.5 Flash');
            setSttModel(agent.sttModel || 'AssemblyAI Universal');
            setTtsModel(agent.ttsModel || 'Sarvam Manisha');
            setEnabledTools(agent.enabledTools || []);
        } else {
            setTitle('');
            setPrompt('');
            setLlmModel('Gemini 1.5 Flash');
            setSttModel('AssemblyAI Universal');
            setTtsModel('Sarvam Manisha');
            setEnabledTools([]);
        }
    }, [agent, isOpen]);

    const handleToggleTool = (toolName: string) => {
        setEnabledTools(prev => {
            const existing = prev.find(t => t.toolName === toolName);
            if (existing) {
                // Toggle existing tool
                return prev.map(t => 
                    t.toolName === toolName ? { ...t, enabled: !t.enabled } : t
                );
            } else {
                // Add new tool
                return [...prev, { toolName, enabled: true, config: {} }];
            }
        });
    };

    const isToolEnabled = (toolName: string) => {
        const tool = enabledTools.find(t => t.toolName === toolName);
        return tool?.enabled || false;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const method = agent ? 'PUT' : 'POST';
            const body = agent
                ? JSON.stringify({ id: agent.id, title, prompt, llmModel, sttModel, ttsModel, enabledTools })
                : JSON.stringify({ userId: 'mukul', title, prompt, llmModel, sttModel, ttsModel, enabledTools });

            const res = await fetch('/api/voice-agents', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body,
            });

            if (res.ok) {
                onSuccess();
                onClose();
                setTitle('');
                setPrompt('');
                setLlmModel('Gemini 1.5 Flash');
                setSttModel('AssemblyAI Universal');
                setTtsModel('Sarvam Manisha');
                setEnabledTools([]);
            }
        } catch (error) {
            console.error('Error saving agent:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#141b24] border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">
                        {agent ? 'Edit Voice Agent' : 'Add Voice Agent'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title Field */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                            Agent Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., EMI Reminder, Customer Support"
                            required
                            className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Model Selection Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="llmModel" className="block text-sm font-medium text-gray-300 mb-2">
                                LLM Model
                            </label>
                            <select
                                id="llmModel"
                                value={llmModel}
                                onChange={(e) => setLlmModel(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="Gemini 1.5 Flash">Gemini 1.5 Flash</option>
                                <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                                <option value="GPT-4">GPT-4</option>
                                <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="sttModel" className="block text-sm font-medium text-gray-300 mb-2">
                                STT Model
                            </label>
                            <select
                                id="sttModel"
                                value={sttModel}
                                onChange={(e) => setSttModel(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="AssemblyAI Universal">AssemblyAI Universal</option>
                                <option value="Whisper">Whisper</option>
                                <option value="Google Speech-to-Text">Google Speech-to-Text</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="ttsModel" className="block text-sm font-medium text-gray-300 mb-2">
                                TTS Model
                            </label>
                            <select
                                id="ttsModel"
                                value={ttsModel}
                                onChange={(e) => setTtsModel(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="Sarvam Manisha">Sarvam Manisha</option>
                                <option value="Sarvam Meera">Sarvam Meera</option>
                                <option value="Sarvam Arvind">Sarvam Arvind</option>
                            </select>
                        </div>
                    </div>

                    {/* Tools Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Document & File Tools
                        </label>
                        <div className="bg-[#0a0e13] border border-gray-700 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-4">
                                Enable tools that your agent can use to create, read, and edit documents automatically.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {AVAILABLE_TOOLS.map((tool) => {
                                    const enabled = isToolEnabled(tool.name);
                                    return (
                                        <div
                                            key={tool.name}
                                            onClick={() => handleToggleTool(tool.name)}
                                            className={`
                                                flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all
                                                ${enabled 
                                                    ? 'border-emerald-500 bg-emerald-500/10' 
                                                    : 'border-gray-700 hover:border-gray-600 bg-[#141b24]'
                                                }
                                            `}
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-2xl mr-3">
                                                {tool.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-medium text-white truncate">
                                                        {tool.label}
                                                    </h4>
                                                    <div
                                                        className={`
                                                            flex-shrink-0 w-10 h-5 rounded-full transition-colors relative
                                                            ${enabled ? 'bg-emerald-500' : 'bg-gray-700'}
                                                        `}
                                                    >
                                                        <div
                                                            className={`
                                                                absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform
                                                                ${enabled ? 'translate-x-5' : 'translate-x-0.5'}
                                                            `}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {tool.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {enabledTools.filter(t => t.enabled).length > 0 && (
                                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <p className="text-xs text-emerald-400">
                                        ✓ {enabledTools.filter(t => t.enabled).length} tool{enabledTools.filter(t => t.enabled).length > 1 ? 's' : ''} enabled for this agent
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prompt Field */}
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                            System Prompt
                        </label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter the system prompt that defines the agent's behavior and personality..."
                            required
                            rows={12}
                            className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none font-mono text-sm"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Define the agent's role, personality, and instructions for handling conversations.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : agent ? 'Save Changes' : 'Create Agent'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
