'use client';

import { useState, useCallback, useEffect } from 'react';
import MicButton from '@/components/MicButton';
import ChatBox from '@/components/ChatBox';
import TopModelBoxes from '@/components/TopModelBoxes';
import InitialPromptEditor from '@/components/InitialPromptEditor';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Message, ModelConfig, TranscriptionResponse, LLMResponse, TTSResponse } from '@/types';

interface ConfigStatus {
    services: {
        stt: boolean;
        llm: boolean;
        tts: boolean;
    };
    allConfigured: boolean;
    message: string;
}

export default function Home() {
    // App state
    const [messages, setMessages] = useState<Message[]>([]);
    const [initialPrompt, setInitialPrompt] = useState('You are a helpful AI assistant. Respond concisely and naturally.');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);

    // Model configuration
    const [modelConfig] = useState<ModelConfig>({
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Deepgram Aura Luna',
    });

    // Check configuration status on mount
    useEffect(() => {
        fetch('/api/config-status')
            .then(res => res.json())
            .then(data => setConfigStatus(data))
            .catch(err => console.error('Failed to check config:', err));
    }, []);

    // Handle audio segment processing
    const handleAudioSegment = useCallback(async (audioBlob: Blob) => {
        try {
            setProcessingStep('Transcribing audio...');

            // Step 1: Upload and transcribe audio
            const formData = new FormData();
            // Append with proper filename and type
            const filename = audioBlob.type.includes('webm') ? 'audio.webm' :
                audioBlob.type.includes('mp4') ? 'audio.mp4' :
                    audioBlob.type.includes('wav') ? 'audio.wav' : 'audio.webm';
            formData.append('audio', audioBlob, filename);

            const transcriptionResponse = await fetch('/api/upload-audio', {
                method: 'POST',
                body: formData,
            });

            if (!transcriptionResponse.ok) {
                const errorData = await transcriptionResponse.json();
                throw new Error(errorData.error || 'Transcription failed');
            }

            const transcriptionData: TranscriptionResponse = await transcriptionResponse.json();

            if (!transcriptionData.text?.trim()) {
                setProcessingStep('');
                return; // No speech detected, skip
            }

            // Add user message
            const userMessage: Message = {
                id: Date.now().toString(),
                text: transcriptionData.text,
                source: 'user',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);

            setProcessingStep('Generating response...');

            // Step 2: Get LLM response
            const llmResponse = await fetch('/api/llm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: initialPrompt,
                    userText: transcriptionData.text,
                }),
            });

            if (!llmResponse.ok) {
                const errorData = await llmResponse.json();
                throw new Error(errorData.error || 'LLM request failed');
            }

            const llmData: LLMResponse = await llmResponse.json();

            // Add assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: llmData.llmText,
                source: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            setProcessingStep('Generating speech...');

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

            if (!ttsResponse.ok) {
                const errorData = await ttsResponse.json();
                throw new Error(errorData.error || 'TTS request failed');
            }

            const ttsData: TTSResponse = await ttsResponse.json();

            if (ttsData.audioData) {
                // Convert base64 to audio and play
                const audioBytes = Uint8Array.from(atob(ttsData.audioData), c => c.charCodeAt(0));
                const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                const audio = new Audio(audioUrl);
                audio.play().catch(console.error);

                // Clean up URL after playing
                audio.addEventListener('ended', () => {
                    URL.revokeObjectURL(audioUrl);
                });
            }

        } catch (error) {
            console.error('Audio processing error:', error);

            // Add error message with specific error details
            let errorText = 'Sorry, I encountered an error processing your request. Please try again.';

            if (error instanceof Error) {
                if (error.message.includes('Speech-to-text service not configured')) {
                    errorText = 'Please configure your AssemblyAI API key in .env.local to use speech recognition.';
                } else if (error.message.includes('LLM service not configured')) {
                    errorText = 'Please configure your Gemini API key in .env.local to use AI responses.';
                } else if (error.message.includes('TTS service not configured')) {
                    errorText = 'Please configure your Deepgram API key in .env.local to use text-to-speech.';
                } else if (error.message.includes('service not configured')) {
                    errorText = 'Please configure your API keys in .env.local to use all features.';
                }
            }

            const errorMessage: Message = {
                id: Date.now().toString(),
                text: errorText,
                source: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setProcessingStep('');
        }
    }, [initialPrompt]);

    // Voice recorder hook
    const { isListening, isProcessing, startRecording, stopRecording } = useVoiceRecorder({
        onSegmentReady: handleAudioSegment,
        silenceTimeout: 350,
    });

    // Handle mic button toggle
    const handleMicToggle = useCallback(async () => {
        if (isChatOpen) {
            setIsChatOpen(false);
            if (isListening) {
                stopRecording();
            }
        } else {
            setIsChatOpen(true);
            try {
                await startRecording();
            } catch (error) {
                console.error('Failed to start recording:', error);
                setIsChatOpen(false);
                alert('Failed to access microphone. Please check permissions and try again.');
            }
        }
    }, [isChatOpen, isListening, startRecording, stopRecording]);

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl font-medium text-white">AI Voice Assistant</h1>
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
                    <div className="flex items-center justify-between p-3 border-b border-slate-700">
                        <div>
                            <h3 className="text-base font-medium">Conversation</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500' :
                                    isProcessing ? 'bg-yellow-500' :
                                        'bg-green-500'
                                }`}></div>
                            <span className="text-xs text-gray-400">
                                {isListening ? 'Listening' : isProcessing ? 'Processing' : 'Ready'}
                            </span>
                            <MicButton
                                isListening={isListening}
                                isOpen={isChatOpen}
                                onToggle={handleMicToggle}
                            />
                        </div>
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
        </div>
    );
}


