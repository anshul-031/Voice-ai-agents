/* eslint-disable no-console */
'use client';

import { AgentToolDefinition, AgentToolHeader, AgentToolParameter } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface AgentToolManagerProps {
    agentId?: string;
}

interface ToolFormState {
    name: string;
    description: string;
    webhookUrl: string;
    method: 'GET' | 'POST';
    triggerPhraseInput: string;
    successMessage: string;
    failureMessage: string;
    runAfterCall: boolean;
    headers: AgentToolHeader[];
    parameters: AgentToolParameter[];
}

const defaultFormState: ToolFormState = {
    name: '',
    description: '',
    webhookUrl: '',
    method: 'POST',
    triggerPhraseInput: '',
    successMessage: '',
    failureMessage: '',
    runAfterCall: false,
    headers: [],
    parameters: [],
};

export default function AgentToolManager({ agentId }: AgentToolManagerProps) {
    const [tools, setTools] = useState<AgentToolDefinition[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formState, setFormState] = useState<ToolFormState>(defaultFormState);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        console.log('[AgentToolManager] Mounted with agentId:', agentId ?? 'none');
    }, [agentId]);

    const triggerPhrases = useMemo(() => {
        return formState.triggerPhraseInput
            .split(',')
            .map(phrase => phrase.trim())
            .filter(Boolean);
    }, [formState.triggerPhraseInput]);

    useEffect(() => {
        if (!agentId) {
            setTools([]);
            return;
        }

        const fetchTools = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/agent-tools?agentId=${encodeURIComponent(agentId)}`);
                if (!res.ok) {
                    throw new Error('Failed to load tools');
                }
                const data = await res.json();
                setTools(data.tools || []);
            } catch (err) {
                console.error('[AgentToolManager] Failed to fetch tools:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch tools');
            } finally {
                setLoading(false);
            }
        };

        fetchTools();
    }, [agentId]);

    const handleAddHeader = () => {
        setFormState(prev => ({
            ...prev,
            headers: [...prev.headers, { key: '', value: '' }],
        }));
    };

    const handleHeaderChange = (index: number, key: keyof AgentToolHeader, value: string) => {
        setFormState(prev => {
            const headers = [...prev.headers];
            headers[index] = { ...headers[index], [key]: value };
            return { ...prev, headers };
        });
    };

    const handleRemoveHeader = (index: number) => {
        setFormState(prev => ({
            ...prev,
            headers: prev.headers.filter((_, i) => i !== index),
        }));
    };

    const handleAddParameter = () => {
        setFormState(prev => ({
            ...prev,
            parameters: [...prev.parameters, { name: '', description: '', type: 'string', required: false }],
        }));
    };

    const handleParameterChange = (index: number, key: keyof AgentToolParameter, value: string | boolean) => {
        setFormState(prev => {
            const parameters = [...prev.parameters];
            parameters[index] = { ...parameters[index], [key]: value };
            return { ...prev, parameters };
        });
    };

    const handleRemoveParameter = (index: number) => {
        setFormState(prev => ({
            ...prev,
            parameters: prev.parameters.filter((_, i) => i !== index),
        }));
    };

    const resetForm = () => {
        setFormState(defaultFormState);
        setShowForm(false);
    };

    const handleCreateTool = async () => {
        if (!agentId) {
            setError('Save the agent before adding tools.');
            return;
        }

        if (!formState.name.trim() || !formState.webhookUrl.trim()) {
            setError('Tool name and webhook URL are required.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/agent-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    name: formState.name.trim(),
                    description: formState.description.trim() || undefined,
                    webhookUrl: formState.webhookUrl.trim(),
                    method: formState.method,
                    triggerPhrases,
                    successMessage: formState.successMessage.trim() || undefined,
                    failureMessage: formState.failureMessage.trim() || undefined,
                    runAfterCall: formState.runAfterCall,
                    headers: formState.headers.filter(h => h.key && h.value).map(h => ({ key: h.key.trim(), value: h.value })),
                    parameters: formState.parameters.filter(p => p.name).map(p => ({
                        name: p.name.trim(),
                        description: p.description?.trim() || undefined,
                        type: p.type || 'string',
                        required: Boolean(p.required),
                    })),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to create tool');
            }

            const data = await res.json();
            setTools(prev => [data.tool, ...prev]);
            resetForm();
        } catch (err) {
            console.error('[AgentToolManager] Failed to create tool:', err);
            setError(err instanceof Error ? err.message : 'Failed to create tool');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTool = async (toolId?: string) => {
        if (!toolId) return;
        setDeletingId(toolId);
        setError(null);
        try {
            const res = await fetch(`/api/agent-tools/${toolId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete tool');
            }
            setTools(prev => prev.filter(tool => tool._id !== toolId));
        } catch (err) {
            console.error('[AgentToolManager] Failed to delete tool:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete tool');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="glass-panel rounded-2xl p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white/90">Tools & Webhooks</h2>
                    <p className="text-sm text-white/60">
                        Connect external systems so the agent can act on user intents.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-sm text-white/80"
                    disabled={saving}
                >
                    <Plus size={16} />
                    <span>{showForm ? 'Dismiss' : 'Add Tool'}</span>
                </button>
            </header>

            {!agentId && (
                <div className="p-4 border border-yellow-500/40 bg-yellow-500/10 rounded-xl text-sm text-yellow-200">
                    Save this agent to enable webhook tools.
                </div>
            )}

            {error && (
                <div className="p-3 border border-red-500/40 bg-red-500/10 rounded-xl text-sm text-red-200">
                    {error}
                </div>
            )}

            {showForm && agentId && (
                <div className="space-y-5 border border-white/10 rounded-xl p-5 bg-black/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-2 text-sm text-white/70">
                            Tool Name
                            <input
                                type="text"
                                value={formState.name}
                                onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
                                placeholder="e.g. send_payment_link"
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-white/70">
                            Webhook URL
                            <input
                                type="url"
                                value={formState.webhookUrl}
                                onChange={e => setFormState(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
                                placeholder="https://api.example.com/payment-link"
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-white/70">
                            Method
                            <select
                                value={formState.method}
                                onChange={e => setFormState(prev => ({ ...prev, method: e.target.value as 'GET' | 'POST' }))}
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
                            >
                                <option value="POST">POST</option>
                                <option value="GET">GET</option>
                            </select>
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-white/70">
                            Trigger Phrases
                            <input
                                type="text"
                                value={formState.triggerPhraseInput}
                                onChange={e => setFormState(prev => ({ ...prev, triggerPhraseInput: e.target.value }))}
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
                                placeholder="Comma separated, e.g. payment link, pay now"
                            />
                        </label>
                    </div>

                    <label className="flex flex-col gap-2 text-sm text-white/70">
                        Description
                        <textarea
                            value={formState.description}
                            onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
                            placeholder="Explain what the tool does so the LLM knows when to call it"
                            rows={3}
                        />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-2 text-sm text-white/70">
                            Success Message
                            <input
                                type="text"
                                value={formState.successMessage}
                                onChange={e => setFormState(prev => ({ ...prev, successMessage: e.target.value }))}
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
                                placeholder="Message to append when webhook succeeds"
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-white/70">
                            Failure Message
                            <input
                                type="text"
                                value={formState.failureMessage}
                                onChange={e => setFormState(prev => ({ ...prev, failureMessage: e.target.value }))}
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40"
                                placeholder="Message to show if webhook fails"
                            />
                        </label>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-white/70">
                        <input
                            type="checkbox"
                            checked={formState.runAfterCall}
                            onChange={e => setFormState(prev => ({ ...prev, runAfterCall: e.target.checked }))}
                            className="w-4 h-4 rounded border border-white/30 bg-black/40"
                        />
                        Run only after call ends
                    </label>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-white/80">Headers</h3>
                            <button
                                type="button"
                                onClick={handleAddHeader}
                                className="text-xs px-2 py-1 rounded bg-white/10 border border-white/15 text-white/70"
                            >
                                Add Header
                            </button>
                        </div>
                        {formState.headers.length === 0 && (
                            <p className="text-xs text-white/40">No headers configured.</p>
                        )}
                        <div className="space-y-2">
                            {formState.headers.map((header, idx) => (
                                <div key={`header-${idx}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                    <input
                                        type="text"
                                        value={header.key}
                                        onChange={e => handleHeaderChange(idx, 'key', e.target.value)}
                                        placeholder="Header key"
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        onChange={e => handleHeaderChange(idx, 'value', e.target.value)}
                                        placeholder="Header value"
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveHeader(idx)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20"
                                        aria-label="Remove header"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-white/80">Parameters</h3>
                            <button
                                type="button"
                                onClick={handleAddParameter}
                                className="text-xs px-2 py-1 rounded bg-white/10 border border-white/15 text-white/70"
                            >
                                Add Parameter
                            </button>
                        </div>
                        {formState.parameters.length === 0 && (
                            <p className="text-xs text-white/40">No parameters required. The LLM can still call the webhook without payload.</p>
                        )}
                        <div className="space-y-2">
                            {formState.parameters.map((param, idx) => (
                                <div key={`param-${idx}`} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_0.8fr_auto] gap-2 items-center">
                                    <input
                                        type="text"
                                        value={param.name}
                                        onChange={e => handleParameterChange(idx, 'name', e.target.value)}
                                        placeholder="Parameter name"
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                    <input
                                        type="text"
                                        value={param.description || ''}
                                        onChange={e => handleParameterChange(idx, 'description', e.target.value)}
                                        placeholder="Description"
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                    <input
                                        type="text"
                                        value={param.type || 'string'}
                                        onChange={e => handleParameterChange(idx, 'type', e.target.value)}
                                        placeholder="Type (string, number, etc.)"
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                    <label className="flex items-center gap-2 text-xs text-white/70">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(param.required)}
                                            onChange={e => handleParameterChange(idx, 'required', e.target.checked)}
                                            className="w-4 h-4 rounded border border-white/30 bg-black/40"
                                        />
                                        Required
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveParameter(idx)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20"
                                        aria-label="Remove parameter"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 rounded-lg border border-white/15 text-sm text-white/70 hover:text-white/90"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateTool}
                            className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-semibold text-white"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Create Tool'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {loading && <p className="text-sm text-white/60">Loading tools...</p>}
                {!loading && tools.length === 0 && (
                    <p className="text-sm text-white/50">No tools connected yet.</p>
                )}
                {tools.map(tool => (
                    <div key={tool._id} className="border border-white/10 rounded-xl p-4 bg-black/20 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-white/90 font-semibold text-sm">{tool.name}</h3>
                                {tool.description && (
                                    <p className="text-xs text-white/60 mt-1">{tool.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDeleteTool(tool._id)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20"
                                disabled={deletingId === tool._id}
                            >
                                {deletingId === tool._id ? 'Deleting...' : <Trash2 size={16} />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-white/60">
                            <div>
                                <span className="font-medium text-white/70">Webhook:</span> {tool.method} {tool.webhookUrl}
                            </div>
                            {tool.triggerPhrases?.length > 0 && (
                                <div>
                                    <span className="font-medium text-white/70">Triggers:</span> {tool.triggerPhrases.join(', ')}
                                </div>
                            )}
                            {tool.successMessage && (
                                <div>
                                    <span className="font-medium text-white/70">Success message:</span> {tool.successMessage}
                                </div>
                            )}
                            {tool.failureMessage && (
                                <div>
                                    <span className="font-medium text-white/70">Failure message:</span> {tool.failureMessage}
                                </div>
                            )}
                            {tool.parameters?.length > 0 && (
                                <div className="md:col-span-2">
                                    <span className="font-medium text-white/70">Parameters:</span>
                                    <ul className="mt-1 space-y-1">
                                        {tool.parameters.map(param => (
                                            <li key={`${tool._id}-${param.name}`} className="flex items-center gap-2">
                                                <code className="bg-white/10 px-2 py-0.5 rounded text-white/80">{param.name}</code>
                                                <span>{param.description}</span>
                                                {param.required && <span className="text-emerald-300">(required)</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
