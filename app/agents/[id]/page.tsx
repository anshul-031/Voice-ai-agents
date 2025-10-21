'use client';

import VoiceAIAgent from '@/components/VoiceAIAgent';
import type { ModelConfig } from '@/types';
import { useParams, useRouter } from 'next/navigation';
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

export default function AgentPage() {
    const params = useParams();
    const router = useRouter();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<VoiceAgent | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [modelConfig, setModelConfig] = useState<ModelConfig>({
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Sarvam Manisha',
    });

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const res = await fetch(`/api/voice-agents/${agentId}`);

                if (!res.ok) {
                    router.push('/dashboard');
                    return;
                }

                const data = await res.json();

                if (data.success && data.agent) {
                    setAgent(data.agent);
                    setModelConfig({
                        llmModel: data.agent.llmModel,
                        sttModel: data.agent.sttModel,
                        ttsModel: data.agent.ttsModel,
                    });
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Error fetching agent:', error);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchAgent();
    }, [agentId, router]);

    const handleDelete = async () => {
        if (!agent) return;

        if (!confirm(`Are you sure you want to delete "${agent.title}"? This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            const res = await fetch(`/api/voice-agents?id=${agent.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                const data = await res.json();
                alert(`Failed to delete agent: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting agent:', error);
            alert('Failed to delete agent. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-slate-900 text-white flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4'></div>
                    <p className='text-gray-400'>Loading agent...</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className='min-h-screen bg-slate-900 text-white flex items-center justify-center'>
                <div className='text-center'>
                    <p className='text-red-400 mb-4'>Agent not found</p>
                    <button
                        onClick={() => router.push('/')}
                        className='px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors'
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <VoiceAIAgent
            agentId={agent.id}
            agentTitle={agent.title}
            defaultPrompt={agent.prompt}
            defaultModelConfig={modelConfig}
            showHeader={true}
            headerTitle={agent.title}
            onBack={() => router.push('/dashboard')}
            onDelete={handleDelete}
            isDeleting={deleting}
        />
    );
}
