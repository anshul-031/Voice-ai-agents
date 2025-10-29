'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { parseTriggerPhrases, sanitizeHeaders, sanitizeParameters } from '@/lib/agentToolsForm';

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

interface AgentToolHeader {
    key: string;
    value: string;
}

interface AgentToolParameter {
    name: string;
    description?: string;
    type?: string;
    required?: boolean;
}

interface AgentTool {
    _id: string;
    userId: string;
    agentId?: string;
    name: string;
    description?: string;
    webhookUrl: string;
    method: 'GET' | 'POST';
    headers?: AgentToolHeader[];
    parameters?: AgentToolParameter[];
    triggerPhrases?: string[];
    successMessage?: string;
    failureMessage?: string;
    runAfterCall?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface ToolFormState {
    name: string;
    description: string;
    webhookUrl: string;
    method: 'GET' | 'POST';
    triggerPhrases: string;
    successMessage: string;
    failureMessage: string;
    runAfterCall: boolean;
    headers: AgentToolHeader[];
    parameters: AgentToolParameter[];
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
    const [tools, setTools] = useState<AgentTool[]>([]);
    const [toolsLoading, setToolsLoading] = useState(false);
    const [toolsError, setToolsError] = useState<string | null>(null);
    const [toolFormOpen, setToolFormOpen] = useState(false);
    const [toolSaving, setToolSaving] = useState(false);
    const [editingTool, setEditingTool] = useState<AgentTool | null>(null);
    const [toolForm, setToolForm] = useState<ToolFormState>({
        name: '',
        description: '',
        webhookUrl: '',
        method: 'POST',
        triggerPhrases: '',
        successMessage: '',
        failureMessage: '',
        runAfterCall: false,
        headers: [],
        parameters: [],
    });

    const fileInputId = useMemo(() => `knowledge-upload-${Math.random().toString(36).slice(2)}`, []);

    const createItemId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const resetToolForm = () => {
        setToolForm({
            name: '',
            description: '',
            webhookUrl: '',
            method: 'POST',
            triggerPhrases: '',
            successMessage: '',
            failureMessage: '',
            runAfterCall: false,
            headers: [],
            parameters: [],
        });
    };

    const fetchAgentTools = async (agentId: string) => {
        setToolsLoading(true);
        setToolsError(null);
        try {
            const response = await fetch(`/api/agent-tools?agentId=${agentId}`);
            if (!response.ok) {
                throw new Error('Failed to load tools');
            }
            const data = await response.json();
            setTools(Array.isArray(data.tools) ? data.tools : []);
        } catch (error) {
            console.error('Error fetching agent tools:', error);
            setToolsError('Unable to load tools for this agent.');
            setTools([]);
        } finally {
            setToolsLoading(false);
        }
    };

    const handleOpenToolForm = (tool?: AgentTool) => {
        if (tool) {
            setEditingTool(tool);
            setToolForm({
                name: tool.name || '',
                description: tool.description || '',
                webhookUrl: tool.webhookUrl || '',
                method: (tool.method as 'GET' | 'POST') || 'POST',
                triggerPhrases: (tool.triggerPhrases || []).join(', '),
                successMessage: tool.successMessage || '',
                failureMessage: tool.failureMessage || '',
                runAfterCall: Boolean(tool.runAfterCall),
                headers: (tool.headers || []).map((header) => ({
                    key: header?.key?.toString?.() || '',
                    value: header?.value?.toString?.() || '',
                })),
                parameters: (tool.parameters || []).map((parameter) => ({
                    name: parameter?.name?.toString?.() || '',
                    description: parameter?.description?.toString?.() || '',
                    type: parameter?.type?.toString?.().toLowerCase() || 'string',
                    required: Boolean(parameter?.required),
                })),
            });
        } else {
            setEditingTool(null);
            resetToolForm();
        }
        setToolFormOpen(true);
    };

    const handleCancelToolForm = () => {
        setToolFormOpen(false);
        setEditingTool(null);
        resetToolForm();
    };

    const addHeaderRow = () => {
        setToolForm(prev => ({
            ...prev,
            headers: [...prev.headers, { key: '', value: '' }],
        }));
    };

    const updateHeaderRow = (index: number, field: 'key' | 'value', value: string) => {
        setToolForm(prev => ({
            ...prev,
            headers: prev.headers.map((header, headerIndex) =>
                headerIndex === index ? { ...header, [field]: value } : header,
            ),
        }));
    };

    const removeHeaderRow = (index: number) => {
        setToolForm(prev => ({
            ...prev,
            headers: prev.headers.filter((_, headerIndex) => headerIndex !== index),
        }));
    };

    const addParameterRow = () => {
        setToolForm(prev => ({
            ...prev,
            parameters: [
                ...prev.parameters,
                { name: '', description: '', type: 'string', required: false },
            ],
        }));
    };

    const updateParameterTextField = (index: number, field: 'name' | 'description' | 'type', value: string) => {
        setToolForm(prev => ({
            ...prev,
            parameters: prev.parameters.map((parameter, parameterIndex) =>
                parameterIndex === index ? { ...parameter, [field]: value } : parameter,
            ),
        }));
    };

    const updateParameterRequired = (index: number, required: boolean) => {
        setToolForm(prev => ({
            ...prev,
            parameters: prev.parameters.map((parameter, parameterIndex) =>
                parameterIndex === index ? { ...parameter, required } : parameter,
            ),
        }));
    };

    const removeParameterRow = (index: number) => {
        setToolForm(prev => ({
            ...prev,
            parameters: prev.parameters.filter((_, parameterIndex) => parameterIndex !== index),
        }));
    };

    const handleToolSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!agent?.id) {
            alert('Save the agent before adding tools.');
            return;
        }

        if (!toolForm.name.trim() || !toolForm.webhookUrl.trim()) {
            alert('Tool name and webhook URL are required.');
            return;
        }

        setToolSaving(true);

        const payload = {
            agentId: agent.id,
            userId: agent.userId || 'mukul',
            name: toolForm.name.trim(),
            description: toolForm.description.trim() || undefined,
            webhookUrl: toolForm.webhookUrl.trim(),
            method: toolForm.method,
            headers: sanitizeHeaders(toolForm.headers),
            parameters: sanitizeParameters(toolForm.parameters),
            triggerPhrases: parseTriggerPhrases(toolForm.triggerPhrases),
            successMessage: toolForm.successMessage.trim() || undefined,
            failureMessage: toolForm.failureMessage.trim() || undefined,
            runAfterCall: Boolean(toolForm.runAfterCall),
        };

        try {
            let response: Response;

            if (editingTool?._id) {
                response = await fetch(`/api/agent-tools/${editingTool._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                response = await fetch('/api/agent-tools', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || 'Failed to save tool');
            }

            await fetchAgentTools(agent.id);
            handleCancelToolForm();
        } catch (error) {
            console.error('Error saving agent tool:', error);
            alert(error instanceof Error ? error.message : 'Failed to save tool');
        } finally {
            setToolSaving(false);
        }
    };

    const handleDeleteTool = async (tool: AgentTool) => {
        if (!agent?.id || !tool?._id) return;
        const confirmed = window.confirm(`Delete tool "${tool.name}"?`);
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/agent-tools/${tool._id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || 'Failed to delete tool');
            }
            await fetchAgentTools(agent.id);
        } catch (error) {
            console.error('Error deleting agent tool:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete tool');
        }
    };

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
            setToolFormOpen(false);
            setEditingTool(null);
            resetToolForm();
            if (agent.id) {
                fetchAgentTools(agent.id);
            } else {
                setTools([]);
                setToolsError(null);
            }
        } else {
            setTitle('');
            setPrompt('');
            setLlmModel('Gemini 1.5 Flash');
            setSttModel('AssemblyAI Universal');
            setTtsModel('Sarvam Manisha');
            setKnowledgeItems([]);
            setManualKnowledge('');
            setTools([]);
            setToolsError(null);
            setToolFormOpen(false);
            setEditingTool(null);
            resetToolForm();
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
            <div className="bg-[#141b24] border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
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
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
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

                    {/* Tools & Webhooks */}
                    <div className="bg-[#0f1419] border border-gray-700/70 rounded-xl p-5 space-y-5">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-semibold text-white">Tools &amp; Webhooks</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Configure outbound webhook tools that the agent can invoke during a conversation. Each tool needs a
                                name and an HTTPS endpoint. Trigger phrases help the agent identify when to call the tool.
                            </p>
                        </div>

                        {!agent?.id ? (
                            <p className="text-xs text-gray-500">
                                Save the agent first to add tools and webhook configurations.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        {tools.length} configured tool{tools.length === 1 ? '' : 's'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenToolForm()}
                                            className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                                        >
                                            Add Tool
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => fetchAgentTools(agent.id)}
                                            className="inline-flex items-center rounded-md border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-800"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                {toolsError && (
                                    <p className="text-xs text-red-400">{toolsError}</p>
                                )}

                                {toolFormOpen && (
                                    <div className="space-y-4 rounded-lg border border-gray-700 bg-[#0a0e13] p-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-medium text-gray-300 mb-2 block">Tool Name *</label>
                                                <input
                                                    type="text"
                                                    value={toolForm.name}
                                                    onChange={(event) => setToolForm(prev => ({ ...prev, name: event.target.value }))}
                                                    required
                                                    className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    placeholder="e.g., Create Ticket"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-300 mb-2 block">Webhook Method</label>
                                                <select
                                                    value={toolForm.method}
                                                    onChange={(event) => setToolForm(prev => ({ ...prev, method: event.target.value as 'GET' | 'POST' }))}
                                                    className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                >
                                                    <option value="POST">POST</option>
                                                    <option value="GET">GET</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-gray-300 mb-2 block">Webhook URL *</label>
                                            <input
                                                type="url"
                                                value={toolForm.webhookUrl}
                                                onChange={(event) => setToolForm(prev => ({ ...prev, webhookUrl: event.target.value }))}
                                                required
                                                className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                placeholder="https://example.com/api/action"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-gray-300 mb-2 block">Description</label>
                                            <textarea
                                                value={toolForm.description}
                                                onChange={(event) => setToolForm(prev => ({ ...prev, description: event.target.value }))}
                                                rows={3}
                                                className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                                placeholder="Describe what this tool does so the agent knows when to use it"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-gray-300 mb-2 block">Trigger Phrases</label>
                                            <textarea
                                                value={toolForm.triggerPhrases}
                                                onChange={(event) => setToolForm(prev => ({ ...prev, triggerPhrases: event.target.value }))}
                                                rows={2}
                                                className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                                placeholder="Comma or newline separated phrases that should invoke the tool"
                                            />
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-medium text-gray-300 mb-2 block">Success Message</label>
                                                <input
                                                    type="text"
                                                    value={toolForm.successMessage}
                                                    onChange={(event) => setToolForm(prev => ({ ...prev, successMessage: event.target.value }))}
                                                    className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    placeholder="What should the agent say when the call succeeds?"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-300 mb-2 block">Failure Message</label>
                                                <input
                                                    type="text"
                                                    value={toolForm.failureMessage}
                                                    onChange={(event) => setToolForm(prev => ({ ...prev, failureMessage: event.target.value }))}
                                                    className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    placeholder="Fallback message if the webhook fails"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-medium text-gray-300">HTTP Headers</span>
                                                <button
                                                    type="button"
                                                    onClick={addHeaderRow}
                                                    className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                                                >
                                                    Add Header
                                                </button>
                                            </div>
                                            {toolForm.headers.length === 0 ? (
                                                <p className="text-xs text-gray-500">
                                                    No headers added yet. Include Authorization or custom keys if your webhook requires them.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {toolForm.headers.map((header, index) => (
                                                        <div key={`header-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                                                            <input
                                                                type="text"
                                                                value={header.key}
                                                                onChange={(event) => updateHeaderRow(index, 'key', event.target.value)}
                                                                placeholder="Header name (e.g., Authorization)"
                                                                className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={header.value}
                                                                onChange={(event) => updateHeaderRow(index, 'value', event.target.value)}
                                                                placeholder="Header value"
                                                                className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeHeaderRow(index)}
                                                                className="self-center rounded-md border border-red-500/40 px-3 py-2 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-medium text-gray-300">Parameters</span>
                                                <button
                                                    type="button"
                                                    onClick={addParameterRow}
                                                    className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                                                >
                                                    Add Parameter
                                                </button>
                                            </div>
                                            {toolForm.parameters.length === 0 ? (
                                                <p className="text-xs text-gray-500">
                                                    No parameters defined. Add inputs the agent should collect before invoking this webhook.
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {toolForm.parameters.map((parameter, index) => (
                                                        <div key={`parameter-${index}`} className="space-y-2 rounded-lg border border-gray-700 bg-[#111924] p-3">
                                                            <div className="grid gap-2 md:grid-cols-[1fr_160px_auto]">
                                                                <div>
                                                                    <label className="text-[11px] font-medium text-gray-300 mb-1 block">Name *</label>
                                                                    <input
                                                                        type="text"
                                                                        value={parameter.name}
                                                                        onChange={(event) => updateParameterTextField(index, 'name', event.target.value)}
                                                                        placeholder="e.g., ticketId"
                                                                        className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-medium text-gray-300 mb-1 block">Type</label>
                                                                    <select
                                                                        value={(parameter.type || 'string').toString()}
                                                                        onChange={(event) => updateParameterTextField(index, 'type', event.target.value)}
                                                                        className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                                    >
                                                                        <option value="string">Text</option>
                                                                        <option value="number">Number</option>
                                                                        <option value="boolean">Boolean</option>
                                                                    </select>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeParameterRow(index)}
                                                                    className="self-center rounded-md border border-red-500/40 px-3 py-2 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                                                                <div>
                                                                    <label className="text-[11px] font-medium text-gray-300 mb-1 block">Description</label>
                                                                    <input
                                                                        type="text"
                                                                        value={parameter.description || ''}
                                                                        onChange={(event) => updateParameterTextField(index, 'description', event.target.value)}
                                                                        placeholder="Explain what value the agent should capture"
                                                                        className="w-full rounded-lg border border-gray-700 bg-[#141b24] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                                    />
                                                                </div>
                                                                <label className="flex items-center justify-end gap-2 text-xs text-gray-300">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Boolean(parameter.required)}
                                                                        onChange={(event) => updateParameterRequired(index, event.target.checked)}
                                                                        className="h-4 w-4 rounded border-gray-600 bg-[#141b24] text-emerald-500 focus:ring-emerald-500"
                                                                    />
                                                                    Required
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <label className="inline-flex items-center gap-2 text-xs text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={toolForm.runAfterCall}
                                                onChange={(event) => setToolForm(prev => ({ ...prev, runAfterCall: event.target.checked }))}
                                                className="h-4 w-4 rounded border-gray-600 bg-[#141b24] text-emerald-500 focus:ring-emerald-500"
                                            />
                                            Run automatically after the call ends
                                        </label>

                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={handleCancelToolForm}
                                                className="px-4 py-2 text-xs font-medium text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleToolSubmit}
                                                disabled={toolSaving}
                                                className="px-4 py-2 text-xs font-semibold text-white rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {toolSaving ? 'Saving...' : editingTool ? 'Update Tool' : 'Create Tool'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {toolsLoading ? (
                                    <p className="text-xs text-gray-500">Loading tools...</p>
                                ) : tools.length === 0 ? (
                                    <p className="text-xs text-gray-500">
                                        No tools added yet. Use the Add Tool button to connect webhooks for this agent.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {tools.map((tool) => (
                                            <div key={tool._id} className="rounded-lg border border-gray-700 bg-[#0a0e13] p-3 text-sm text-gray-300 shadow-sm">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-medium truncate">{tool.name}</span>
                                                            <span className="text-[11px] rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                                                                {tool.method || 'POST'}
                                                            </span>
                                                        </div>
                                                        {tool.description && (
                                                            <p className="mt-1 text-xs text-gray-400 break-words">{tool.description}</p>
                                                        )}
                                                        <code className="mt-2 block break-all text-[11px] text-emerald-300">
                                                            {tool.webhookUrl}
                                                        </code>
                                                        {tool.triggerPhrases?.length ? (
                                                            <p className="mt-2 text-[11px] text-gray-400">
                                                                Triggers: {tool.triggerPhrases.join(', ')}
                                                            </p>
                                                        ) : null}
                                                        {tool.runAfterCall && (
                                                            <p className="mt-1 text-[11px] text-gray-400">Runs automatically after the call</p>
                                                        )}
                                                        {tool.headers?.length ? (
                                                            <div className="mt-2 space-y-1">
                                                                <p className="text-[11px] font-medium text-gray-300">Headers</p>
                                                                {tool.headers.map((header, headerIndex) => (
                                                                    <p key={`${tool._id}-header-${headerIndex}`} className="text-[11px] text-gray-400">
                                                                        <span className="text-gray-500">{header.key}:</span> {header.value}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                        {tool.parameters?.length ? (
                                                            <div className="mt-2 space-y-1">
                                                                <p className="text-[11px] font-medium text-gray-300">Parameters</p>
                                                                {tool.parameters.map((parameter, parameterIndex) => (
                                                                    <p key={`${tool._id}-parameter-${parameterIndex}`} className="text-[11px] text-gray-400">
                                                                        <span className="text-gray-300 font-medium">{parameter.name}</span>
                                                                        {parameter.type ? ` (${parameter.type.charAt(0).toUpperCase()}${parameter.type.slice(1)})` : ' (String)'}
                                                                        {parameter.required ? ' · Required' : ' · Optional'}
                                                                        {parameter.description ? ` — ${parameter.description}` : ''}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenToolForm(tool)}
                                                            className="px-3 py-1.5 text-xs font-medium text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTool(tool)}
                                                            className="px-3 py-1.5 text-xs font-medium text-red-400 rounded-lg border border-red-500/40 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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
