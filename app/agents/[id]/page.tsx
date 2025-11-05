'use client';

import DashboardSidebar from '@/components/DashboardSidebar';
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

    const handleNavigate = (view: string) => {
        if (view === 'voice-agents') {
            router.push('/dashboard');
        } else {
            router.push(`/dashboard?view=${view}`);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-[#0a0e13] overflow-hidden">
                <DashboardSidebar activeView="voice-agents" onNavigate={handleNavigate} />
                <div className='flex-1 bg-[#0a0e13] text-white flex items-center justify-center'>
                    <div className='text-center space-y-4'>
                        <div className='relative'>
                            <div className='animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-emerald-500 mx-auto'></div>
                            <div className='absolute inset-0 rounded-full h-16 w-16 border-4 border-emerald-500/20 blur-lg mx-auto'></div>
                        </div>
                        <div className='space-y-1'>
                            <p className='text-lg font-medium text-white/90'>Loading agent...</p>
                            <p className='text-sm text-white/50'>Please wait while we fetch your agent</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex h-screen bg-[#0a0e13] overflow-hidden">
                <DashboardSidebar activeView="voice-agents" onNavigate={handleNavigate} />
                <div className='flex-1 bg-[#0a0e13] text-white flex items-center justify-center'>
                    <div className='text-center space-y-6 max-w-md mx-auto px-6'>
                        <div className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-2'>
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className='space-y-2'>
                            <h2 className='text-2xl font-semibold text-white/90'>Agent Not Found</h2>
                            <p className='text-white/60'>The agent you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 border border-emerald-400/30'
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back to Dashboard</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0a0e13] overflow-hidden">
            <DashboardSidebar activeView="voice-agents" onNavigate={handleNavigate} />
            <div className="flex-1 overflow-auto bg-[#0a0e13]">
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
            </div>
        </div>
    );
}
