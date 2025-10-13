'use client';

import AudioLevelIndicator from '@/components/AudioLevelIndicator';
import ChatBox from '@/components/ChatBox';
import ChatHistory from '@/components/ChatHistory';
import ConfirmDialog from '@/components/ConfirmDialog';
import InitialPromptEditor from '@/components/InitialPromptEditor';
import MicButton from '@/components/MicButton';
import TopModelBoxes from '@/components/TopModelBoxes';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { LLMResponse, Message, ModelConfig, TranscriptionResponse, TTSResponse } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Clock, MessageSquare, RotateCcw, Send, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ConfigStatus {
    services: {
        stt: boolean;
        llm: boolean;
        tts: boolean;
    };
    allConfigured: boolean;
    message: string;
}

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

    console.log('[AgentPage] Component mounted/re-rendered, agentId:', agentId);

    // Agent data state
    const [agent, setAgent] = useState<VoiceAgent | null>(null);
    const [loading, setLoading] = useState(true);

    // Session management
    const [sessionId, setSessionId] = useState<string>('');

    // App state
    const [messages, setMessages] = useState<Message[]>([]);
    const [initialPrompt, setInitialPrompt] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [_configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);

    // Text chat state
    const [showTextInput, setShowTextInput] = useState(false);
    const [textMessage, setTextMessage] = useState('');
    const textInputRef = useRef<HTMLInputElement>(null);

    // Confirmation dialog state
    const [showRestartDialog, setShowRestartDialog] = useState(false);
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [showChatHistory, setShowChatHistory] = useState(false);

    // Model configuration - will be populated from agent data
    const [modelConfig, setModelConfig] = useState<ModelConfig>({
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Sarvam Voice Manisha',
    });

    // Fetch agent data on mount
    useEffect(() => {
        const fetchAgent = async () => {
            try {
                console.log('[AgentPage] Fetching agent data for ID:', agentId);
                const res = await fetch(`/api/voice-agents/${agentId}`);
                
                if (!res.ok) {
                    console.error('[AgentPage] Failed to fetch agent:', res.status);
                    // Redirect to home if agent not found
                    router.push('/');
                    return;
                }

                const data = await res.json();
                console.log('[AgentPage] Agent data received:', data);

                if (data.success && data.agent) {
                    setAgent(data.agent);
                    setInitialPrompt(data.agent.prompt);
                    setModelConfig({
                        llmModel: data.agent.llmModel,
                        sttModel: data.agent.sttModel,
                        ttsModel: data.agent.ttsModel,
                    });
                } else {
                    console.error('[AgentPage] Invalid agent data:', data);
                    router.push('/');
                }
            } catch (error) {
                console.error('[AgentPage] Error fetching agent:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchAgent();
    }, [agentId, router]);

    // Check configuration status on mount
    useEffect(() => {
        console.log('[AgentPage] Checking API configuration status...');

        // Generate session ID on component mount
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log('[AgentPage] Generated session ID:', newSessionId);

        fetch('/api/config-status')
            .then(res => {
                console.log('[AgentPage] Config status response received:', res.status);
                return res.json();
            })
            .then(data => {
                console.log('[AgentPage] Config status data:', data);
                setConfigStatus(data);
            })
            .catch(err => {
                console.error('[AgentPage] Failed to check config:', err);
            });
    }, []);

    // Unique ID generator for stable keys
    const uid = useCallback(() => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, []);

    // Handle audio segment processing
    const handleAudioSegment = useCallback(async (audioBlob: Blob) => {
        console.log('[AgentPage] handleAudioSegment called');
        console.log('[AgentPage] Audio blob size:', audioBlob.size, 'bytes');
        console.log('[AgentPage] Audio blob type:', audioBlob.type);

        try {
            setProcessingStep('Transcribing audio...');
            console.log('[AgentPage] Step 1: Starting transcription...');

            // Step 1: Upload and transcribe audio
            const formData = new FormData();
            const filename = audioBlob.type.includes('webm') ? 'audio.webm' :
                audioBlob.type.includes('mp4') ? 'audio.mp4' :
                    audioBlob.type.includes('wav') ? 'audio.wav' : 'audio.webm';

            console.log('[AgentPage] Using filename:', filename);
            formData.append('audio', audioBlob, filename);

            console.log('[AgentPage] Sending audio to /api/upload-audio...');
            const transcriptionResponse = await fetch('/api/upload-audio', {
                method: 'POST',
                body: formData,
            });

            console.log('[AgentPage] Transcription response status:', transcriptionResponse.status);

            if (!transcriptionResponse.ok) {
                const errorData = await transcriptionResponse.json();
                console.error('[AgentPage] Transcription failed:', errorData);
                throw new Error(errorData.error || 'Transcription failed');
            }

            const transcriptionData: TranscriptionResponse = await transcriptionResponse.json();
            console.log('[AgentPage] Transcription successful:', transcriptionData.text);

            if (!transcriptionData.text?.trim()) {
                console.log('[AgentPage] No speech detected in audio, skipping...');
                setProcessingStep('');
                return;
            }

            // Add user message
            const userMessage: Message = {
                id: uid(),
                text: transcriptionData.text,
                source: 'user',
                timestamp: new Date(),
            };
            console.log('[AgentPage] Adding user message to chat:', userMessage);

            // Update messages state and capture current conversation history
            let currentMessages: Message[] = [];
            setMessages(prev => {
                currentMessages = [...prev, userMessage];
                return currentMessages;
            });

            setProcessingStep('Generating response...');
            console.log('[AgentPage] Step 2: Requesting LLM response with conversation history...');

            // Step 2: Get LLM response with conversation history
            const llmResponse = await fetch('/api/llm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: initialPrompt,
                    userText: transcriptionData.text,
                    sessionId: sessionId,
                    conversationHistory: currentMessages.slice(0, -1).map(m => ({
                        text: m.text,
                        source: m.source
                    })),
                }),
            });

            console.log('[AgentPage] LLM response status:', llmResponse.status);

            if (!llmResponse.ok) {
                const errorData = await llmResponse.json();
                console.error('[AgentPage] LLM request failed:', errorData);
                throw new Error(errorData.error || 'LLM request failed');
            }

            const llmData: LLMResponse = await llmResponse.json();
            console.log('[AgentPage] LLM response received:', llmData.llmText);

            // Add assistant message
            const assistantMessage: Message = {
                id: uid(),
                text: llmData.llmText,
                source: 'assistant',
                timestamp: new Date(),
            };
            console.log('[AgentPage] Adding assistant message to chat:', assistantMessage);
            setMessages(prev => [...prev, assistantMessage]);

            setProcessingStep('Generating speech...');
            console.log('[AgentPage] Step 3: Generating TTS audio...');

            // Step 3: Generate and play TTS
            const ttsResponse = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: llmData.llmText,
                }),
            });

            console.log('[AgentPage] TTS response status:', ttsResponse.status);

            if (!ttsResponse.ok) {
                const errorData = await ttsResponse.json();
                console.error('[AgentPage] TTS request failed:', errorData);
                throw new Error(errorData.error || 'TTS request failed');
            }

            const ttsData: TTSResponse = await ttsResponse.json();

            if (ttsData.audioData) {
                console.log('[AgentPage] TTS audio generated, size:', ttsData.audioData.length, 'bytes (base64)');
                console.log('[AgentPage] Converting and playing audio...');
                const audioBytes = Uint8Array.from(atob(ttsData.audioData), c => c.charCodeAt(0));
                const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                const audio = new Audio(audioUrl);
                console.log('[AgentPage] Starting audio playback...');
                audio.play().catch(err => console.error('[AgentPage] Audio playback error:', err));

                audio.addEventListener('ended', () => {
                    console.log('[AgentPage] Audio playback ended');
                    URL.revokeObjectURL(audioUrl);
                });
            }

            console.log('[AgentPage] Audio segment processing completed successfully');

        } catch (error) {
            console.error('[AgentPage] Audio processing error:', error);

            let errorText = 'Sorry, I encountered an error processing your request. Please try again.';

            if (error instanceof Error) {
                console.error('[AgentPage] Error message:', error.message);
                console.error('[AgentPage] Error stack:', error.stack);

                if (error.message.includes('Speech-to-text service not configured')) {
                    errorText = 'Please configure your AssemblyAI API key in .env.local to use speech recognition.';
                } else if (error.message.includes('LLM service not configured')) {
                    errorText = 'Please configure your Gemini API key in .env.local to use AI responses.';
                } else if (error.message.includes('TTS service not configured')) {
                    errorText = 'Please configure your Sarvam API key in .env.local to use text-to-speech.';
                } else if (error.message.includes('service not configured')) {
                    errorText = 'Please configure your API keys in .env.local to use all features.';
                }
            }

            const errorMessage: Message = {
                id: uid(),
                text: errorText,
                source: 'assistant',
                timestamp: new Date(),
            };
            console.log('[AgentPage] Adding error message to chat:', errorMessage);
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            console.log('[AgentPage] Clearing processing step');
            setProcessingStep('');
        }
    }, [initialPrompt, uid, sessionId]);

    // Real-time speech recognition (Web Speech API) for immediate transcripts
    const {
        supported: sttSupported,
        isListening: sttIsListening,
        interimTranscript,
        startListening: sttStart,
        stopListening: sttStop,
        pause: sttPause,
        resume: sttResume,
    } = useSpeechRecognition({
        onFinal: async (finalText) => {
            if (!finalText?.trim()) return;
            try {
                setProcessingStep('Generating response...');

                const userMessage: Message = {
                    id: uid(),
                    text: finalText,
                    source: 'user',
                    timestamp: new Date(),
                };

                let currentMessages: Message[] = [];
                setMessages(prev => {
                    currentMessages = [...prev, userMessage];
                    return currentMessages;
                });

                const llmResponse = await fetch('/api/llm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: initialPrompt,
                        userText: finalText,
                        conversationHistory: currentMessages.slice(0, -1).map(m => ({
                            text: m.text,
                            source: m.source
                        })),
                        sessionId: sessionId
                    }),
                });
                if (!llmResponse.ok) {
                    const err = await llmResponse.json();
                    throw new Error(err.error || 'LLM request failed');
                }
                const llmData: LLMResponse = await llmResponse.json();

                const assistantMessage: Message = {
                    id: uid(),
                    text: llmData.llmText,
                    source: 'assistant',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);

                setProcessingStep('Generating speech...');

                sttPause();
                const ttsResponse = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: llmData.llmText }),
                });
                if (ttsResponse.ok) {
                    const ttsData: TTSResponse = await ttsResponse.json();
                    if (ttsData.audioData) {
                        const audioBytes = Uint8Array.from(atob(ttsData.audioData), c => c.charCodeAt(0));
                        const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play().catch(err => console.error('[AgentPage] Audio playback error:', err));
                        audio.addEventListener('ended', () => {
                            URL.revokeObjectURL(audioUrl);
                            sttResume();
                        });
                    } else {
                        sttResume();
                    }
                } else {
                    sttResume();
                }
            } catch (error) {
                console.error('[AgentPage] Real-time STT flow error:', error);
                const errorMessage: Message = {
                    id: uid(),
                    text: 'Error processing speech. Please try again.',
                    source: 'assistant',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setProcessingStep('');
            }
        },
    });

    // Voice recorder hook with optimized settings
    const { isListening, isProcessing, audioLevel, startRecording, stopRecording } = useVoiceRecorder({
        onSegmentReady: handleAudioSegment,
        silenceTimeout: 750,
        silenceThreshold: 0.005,
    });

    // Handle mic button toggle
    const handleMicToggle = useCallback(async () => {
        console.log('[AgentPage] handleMicToggle called, isChatOpen:', isChatOpen, 'isListening:', isListening);

        if (isChatOpen) {
            console.log('[AgentPage] Closing chat and stopping recording...');
            setIsChatOpen(false);
            if (sttSupported) sttStop();
            if (isListening) stopRecording();
        } else {
            console.log('[AgentPage] Opening chat and starting recording...');
            setIsChatOpen(true);
            try {
                if (sttSupported) {
                    sttStart();
                    console.log('[AgentPage] Real-time STT started successfully');
                } else {
                    await startRecording();
                    console.log('[AgentPage] Segment recorder started successfully');
                }
            } catch (error) {
                console.error('[AgentPage] Failed to start recording:', error);
                setIsChatOpen(false);
                alert('Failed to access microphone. Please check permissions and try again.');
            }
        }
    }, [isChatOpen, isListening, sttSupported, sttStart, sttStop, startRecording, stopRecording]);

    // Handle restart conversation
    const handleRestartConversation = useCallback(() => {
        console.log('[AgentPage] Restart conversation requested');
        setShowRestartDialog(true);
    }, []);

    const confirmRestartConversation = useCallback(() => {
        console.log('[AgentPage] Restarting conversation...');
        setMessages([]);

        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log('[AgentPage] Generated new session ID:', newSessionId);

        setShowRestartDialog(false);
        console.log('[AgentPage] Conversation cleared');
    }, []);

    // Handle end conversation
    const handleEndConversation = useCallback(() => {
        console.log('[AgentPage] End conversation requested');
        setShowEndDialog(true);
    }, []);

    const confirmEndConversation = useCallback(() => {
        console.log('[AgentPage] Ending conversation...');

        if (sttSupported) sttStop();
        if (isListening) stopRecording();

        setIsChatOpen(false);
        setMessages([]);

        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log('[AgentPage] Generated new session ID for next conversation:', newSessionId);

        setShowEndDialog(false);
        console.log('[AgentPage] Conversation ended');
    }, [isListening, stopRecording, sttSupported, sttStop]);

    // Handle text message sending
    const handleSendTextMessage = useCallback(async () => {
        if (!textMessage.trim() || isProcessing) return;

        console.log('[AgentPage] Sending text message:', textMessage);

        if (!isChatOpen) {
            setIsChatOpen(true);
        }

        const userMessageText = textMessage.trim();
        setTextMessage('');

        try {
            const userMessage: Message = {
                id: uid(),
                text: userMessageText,
                source: 'user',
                timestamp: new Date(),
            };

            let currentMessages: Message[] = [];
            setMessages(prev => {
                currentMessages = [...prev, userMessage];
                return currentMessages;
            });

            setProcessingStep('Generating response...');

            const llmPayload = {
                prompt: initialPrompt,
                userText: userMessageText,
                sessionId: sessionId,
                conversationHistory: currentMessages.slice(0, -1).map(m => ({
                    text: m.text,
                    source: m.source
                })),
            };

            console.log('[AgentPage] Sending request to LLM with conversation history...');
            const llmResponse = await fetch('/api/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(llmPayload),
            });

            if (!llmResponse.ok) {
                const errorData = await llmResponse.json();
                console.error('[AgentPage] LLM failed:', errorData);
                throw new Error(errorData.error || 'LLM processing failed');
            }

            const llmData: LLMResponse = await llmResponse.json();
            console.log('[AgentPage] LLM response:', llmData.llmText);

            const assistantMessage: Message = {
                id: uid(),
                text: llmData.llmText,
                source: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            setProcessingStep('Generating speech...');

            const ttsResponse = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: llmData.llmText }),
            });

            if (!ttsResponse.ok) {
                console.warn('[AgentPage] TTS failed, continuing without audio');
            } else {
                const ttsData: TTSResponse = await ttsResponse.json();

                if (ttsData.audioData) {
                    console.log('[AgentPage] TTS audio generated, playing...');
                    const audioBytes = Uint8Array.from(atob(ttsData.audioData), c => c.charCodeAt(0));
                    const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    const audio = new Audio(audioUrl);
                    audio.play().catch(err => console.error('[AgentPage] Audio playback error:', err));

                    audio.addEventListener('ended', () => {
                        URL.revokeObjectURL(audioUrl);
                    });
                }
            }

        } catch (error) {
            console.error('[AgentPage] Text message processing error:', error);

            let errorText = 'Sorry, I encountered an error processing your message.';

            if (error instanceof Error) {
                if (error.message.includes('LLM service not configured')) {
                    errorText = 'Please configure your Gemini API key in .env.local to use AI responses.';
                }
            }

            const errorMessage: Message = {
                id: uid(),
                text: errorText,
                source: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setProcessingStep('');
        }
    }, [textMessage, isProcessing, isChatOpen, initialPrompt, uid, sessionId]);

    // Toggle text input visibility
    const toggleTextInput = useCallback(() => {
        setShowTextInput(prev => !prev);
        if (!showTextInput) {
            setTimeout(() => textInputRef.current?.focus(), 100);
        }
    }, [showTextInput]);

    // Handle enter key in text input
    const handleTextInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendTextMessage();
        }
    }, [handleSendTextMessage]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading agent...</p>
                </div>
            </div>
        );
    }

    // Show error if agent not found
    if (!agent) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Agent not found</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Back to agents"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-medium text-white">{agent.title}</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-4">
                {/* Model Configuration */}
                <TopModelBoxes config={modelConfig} />

                {/* System Prompt */}
                <InitialPromptEditor value={initialPrompt} onChange={setInitialPrompt} />

                {/* Chat Interface */}
                <div className="bg-slate-800 rounded-md border border-slate-700 h-[500px] flex flex-col">
                    {/* Chat Header */}
                    <div className="p-3 border-b border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="text-base font-medium">Conversation</h3>

                                {/* Conversation Control Buttons */}
                                <motion.div
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <motion.button
                                        onClick={() => setShowChatHistory(true)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="View chat history"
                                        disabled={isProcessing}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Clock size={12} />
                                        <span>History</span>
                                    </motion.button>

                                    {messages.length > 0 && (
                                        <>
                                            <motion.button
                                                onClick={handleRestartConversation}
                                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Restart conversation (clear messages)"
                                                disabled={isProcessing}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <RotateCcw size={12} />
                                                <span>Restart</span>
                                            </motion.button>
                                            <motion.button
                                                onClick={handleEndConversation}
                                                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="End conversation (stop and clear)"
                                                disabled={isProcessing}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <X size={12} />
                                                <span>End</span>
                                            </motion.button>
                                        </>
                                    )}
                                </motion.div>
                            </div>

                            <div className="flex items-center gap-3">
                                {(() => {
                                    const activeListening = sttSupported ? sttIsListening : isListening;
                                    const color = activeListening ? 'bg-red-500' : (isProcessing ? 'bg-yellow-500' : 'bg-green-500');
                                    const label = activeListening ? 'Listening' : (isProcessing ? 'Processing' : 'Ready');
                                    return (
                                        <>
                                            <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                            <span className="text-xs text-gray-400">{label}</span>
                                        </>
                                    );
                                })()}

                                {/* Text Chat Button */}
                                <motion.button
                                    onClick={toggleTextInput}
                                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${showTextInput
                                        ? 'bg-purple-600 hover:bg-purple-700'
                                        : 'bg-slate-700 hover:bg-slate-600'
                                        }`}
                                    title="Toggle text chat"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <MessageSquare size={20} className="text-white" />
                                </motion.button>

                                <MicButton
                                    isListening={sttSupported ? sttIsListening : isListening}
                                    isOpen={isChatOpen}
                                    onToggle={handleMicToggle}
                                />
                            </div>
                        </div>

                        {/* Text Input Area */}
                        <AnimatePresence>
                            {showTextInput && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-center gap-2 pt-3">
                                        <input
                                            ref={textInputRef}
                                            type="text"
                                            value={textMessage}
                                            onChange={(e) => setTextMessage(e.target.value)}
                                            onKeyDown={handleTextInputKeyDown}
                                            placeholder="Type your message here..."
                                            disabled={isProcessing}
                                            className="flex-1 px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <motion.button
                                            onClick={handleSendTextMessage}
                                            disabled={!textMessage.trim() || isProcessing}
                                            className="flex items-center justify-center w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Send message"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Send size={18} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Conversation Tips */}
                        {isListening && (
                            <p className="text-xs text-green-400">
                                Speak clearly and at a normal volume for best results
                            </p>
                        )}

                        {/* Audio Level Indicator or interim text */}
                        {sttSupported ? (
                            sttIsListening && interimTranscript ? (
                                <p className="text-xs text-gray-300">{interimTranscript}</p>
                            ) : null
                        ) : (
                            isListening && (
                                <AudioLevelIndicator level={audioLevel} isListening={isListening} />
                            )
                        )}
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 min-h-0">
                        <ChatBox
                            messages={messages}
                            isOpen={isChatOpen}
                            isListening={isListening}
                            isProcessing={isProcessing}
                            processingStep={processingStep}
                        />
                    </div>
                </div>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                isOpen={showRestartDialog}
                title="Restart Conversation"
                message="Are you sure you want to restart the conversation? This will clear all messages but keep the microphone active."
                confirmLabel="Restart"
                cancelLabel="Cancel"
                confirmColor="blue"
                onConfirm={confirmRestartConversation}
                onCancel={() => setShowRestartDialog(false)}
            />

            <ConfirmDialog
                isOpen={showEndDialog}
                title="End Conversation"
                message="Are you sure you want to end the conversation? This will stop recording and clear all messages."
                confirmLabel="End Conversation"
                cancelLabel="Cancel"
                confirmColor="red"
                onConfirm={confirmEndConversation}
                onCancel={() => setShowEndDialog(false)}
            />

            {/* Chat History Dialog */}
            <ChatHistory
                isOpen={showChatHistory}
                onClose={() => setShowChatHistory(false)}
            />
        </div>
    );
}
