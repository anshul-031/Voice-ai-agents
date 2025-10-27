'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface KnowledgeItem {
    itemId: string;
    name: string;
    type: 'text' | 'csv';
    size: number;
    content: string;
    preview?: string;
    createdAt: string;
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
    knowledgeItems?: KnowledgeItem[]
}

interface AgentModalProps {
    isOpen: boolean
    onClose: () => void
    agent?: VoiceAgent | null
    onSuccess: () => void
}

export default function AgentModal({ isOpen, onClose, agent, onSuccess }: AgentModalProps) {
    const [title, setTitle] = useState('');
    const [prompt, setPrompt] = useState('');
    const [llmModel, setLlmModel] = useState('Gemini 1.5 Flash');
    const [sttModel, setSttModel] = useState('AssemblyAI Universal');
    const [ttsModel, setTtsModel] = useState('Sarvam Manisha');
    const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
    const [manualKnowledge, setManualKnowledge] = useState('');
    const [loading, setLoading] = useState(false);

    const fileInputId = useMemo(() => `knowledge-upload-${Math.random().toString(36).slice(2)}`, []);

    const createItemId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    useEffect(() => {
        if (agent) {
            setTitle(agent.title);
            setPrompt(agent.prompt);
            setLlmModel(agent.llmModel || 'Gemini 1.5 Flash');
            setSttModel(agent.sttModel || 'AssemblyAI Universal');
            setTtsModel(agent.ttsModel || 'Sarvam Manisha');
            setKnowledgeItems(
                (agent.knowledgeItems || []).map(item => ({
                    ...item,
                    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
                    preview: item.preview || (item.content ? item.content.slice(0, 240) : undefined),
                })),
            );
            setManualKnowledge('');
        } else {
            setTitle('');
            setPrompt('');
            setLlmModel('Gemini 1.5 Flash');
            setSttModel('AssemblyAI Universal');
            setTtsModel('Sarvam Manisha');
            setKnowledgeItems([]);
            setManualKnowledge('');
        }
    }, [agent, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const method = agent ? 'PUT' : 'POST';
            const formattedKnowledge = knowledgeItems.map(item => ({
                ...item,
                preview: item.preview || (item.content ? item.content.slice(0, 240) : undefined),
            }));

            const body = agent
                ? JSON.stringify({ id: agent.id, title, prompt, llmModel, sttModel, ttsModel, knowledgeItems: formattedKnowledge })
                : JSON.stringify({ userId: 'mukul', title, prompt, llmModel, sttModel, ttsModel, knowledgeItems: formattedKnowledge });

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
                setKnowledgeItems([]);
                setManualKnowledge('');
            }
        } catch (error) {
            console.error('Error saving agent:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !['csv', 'txt'].includes(extension)) {
            alert('Only CSV and TXT files are supported.');
            event.target.value = '';
            return;
        }

        const maxFileSize = 1024 * 1024 * 2; // 2 MB
        if (file.size > maxFileSize) {
            alert('File size exceeds 2 MB limit.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
                alert('Unable to read file content.');
                return;
            }

            const content = result;
            const newItem: KnowledgeItem = {
                itemId: createItemId(),
                name: file.name,
                type: extension === 'csv' ? 'csv' : 'text',
                size: file.size,
                content,
                preview: content.slice(0, 240),
                createdAt: new Date().toISOString(),
            };

            setKnowledgeItems(prev => [...prev, newItem]);
        };

        reader.onerror = () => {
            alert('Failed to read the file. Please try again.');
        };

        reader.readAsText(file);
        event.target.value = '';
    };

    const handleManualKnowledgeAdd = () => {
        const trimmed = manualKnowledge.trim();
        if (!trimmed) return;

        const newItem: KnowledgeItem = {
            itemId: createItemId(),
            name: `Manual Note ${knowledgeItems.length + 1}`,
            type: 'text',
            size: new Blob([trimmed]).size,
            content: trimmed,
            preview: trimmed.slice(0, 240),
            createdAt: new Date().toISOString(),
        };

        setKnowledgeItems(prev => [...prev, newItem]);
        setManualKnowledge('');
    };

    const handleRemoveKnowledge = (itemId: string) => {
        setKnowledgeItems(prev => prev.filter(item => item.itemId !== itemId));
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(2)} MB`;
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

                    {/* Knowledge Base */}
                    <div className="bg-[#0f1419] border border-gray-700/70 rounded-xl p-5 space-y-5">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-semibold text-white">Knowledge Base</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Upload CSV or TXT files, or add custom notes to give the agent more context. The content will be appended
                                to the agent's knowledge base and can be referenced during conversations.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="flex flex-col gap-2">
                                <label htmlFor={fileInputId} className="text-xs font-medium text-gray-300">
                                    Upload file (CSV or TXT)
                                </label>
                                <div className="relative flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-600 bg-[#0a0e13] px-4 py-5 text-center text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
                                    <input
                                        id={fileInputId}
                                        type="file"
                                        accept=".csv,.txt,text/plain"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    />
                                    <span className="text-sm font-medium">Drop a file or click to browse</span>
                                    <span className="text-[11px] text-gray-500">Up to 2 MB • CSV or TXT only</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="manual-knowledge" className="text-xs font-medium text-gray-300">
                                    Add quick note
                                </label>
                                <textarea
                                    id="manual-knowledge"
                                    value={manualKnowledge}
                                    onChange={(event) => setManualKnowledge(event.target.value)}
                                    rows={5}
                                    placeholder="Paste important FAQs, policy snippets, or canned responses..."
                                    className="w-full rounded-lg border border-gray-700 bg-[#0a0e13] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                />
                                <div className="flex items-center justify-between text-[11px] text-gray-500">
                                    <span>{manualKnowledge.trim().length} characters</span>
                                    <button
                                        type="button"
                                        onClick={handleManualKnowledgeAdd}
                                        disabled={!manualKnowledge.trim()}
                                        className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Add to knowledge
                                    </button>
                                </div>
                            </div>
                        </div>

                        {knowledgeItems.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Knowledge entries ({knowledgeItems.length})
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                        Total size: {formatFileSize(knowledgeItems.reduce((sum, item) => sum + (item.size || 0), 0))}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {knowledgeItems.map(item => (
                                        <div
                                            key={item.itemId}
                                            className="rounded-lg border border-gray-700 bg-[#0a0e13] p-3 text-sm text-gray-300 shadow-sm"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white">{item.name}</span>
                                                    <span className="text-[11px] text-gray-500">
                                                        {item.type.toUpperCase()} • {formatFileSize(item.size)} • Added {new Date(item.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveKnowledge(item.itemId)}
                                                    className="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            {item.preview && (
                                                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-[#111924] px-3 py-2 text-xs text-gray-400">
                                                    {item.preview}
                                                    {item.content.length > (item.preview?.length || 0) && '…'}
                                                </pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">
                                No knowledge entries yet. Upload a CSV/TXT file or add a quick note to give the agent more context.
                            </p>
                        )}
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
