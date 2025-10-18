'use client';

import { X } from 'lucide-react';
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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (agent) {
            setTitle(agent.title);
            setPrompt(agent.prompt);
            setLlmModel(agent.llmModel || 'Gemini 1.5 Flash');
            setSttModel(agent.sttModel || 'AssemblyAI Universal');
            setTtsModel(agent.ttsModel || 'Sarvam Manisha');
        } else {
            setTitle('');
            setPrompt('');
            setLlmModel('Gemini 1.5 Flash');
            setSttModel('AssemblyAI Universal');
            setTtsModel('Sarvam Manisha');
        }
    }, [agent, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const method = agent ? 'PUT' : 'POST';
            const body = agent
                ? JSON.stringify({ id: agent.id, title, prompt, llmModel, sttModel, ttsModel })
                : JSON.stringify({ userId: 'mukul', title, prompt, llmModel, sttModel, ttsModel });

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
