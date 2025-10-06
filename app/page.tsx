'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, X, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MicButton from '@/components/MicButton';
import ChatBox from '@/components/ChatBox';
import TopModelBoxes from '@/components/TopModelBoxes';
import InitialPromptEditor from '@/components/InitialPromptEditor';
import AudioLevelIndicator from '@/components/AudioLevelIndicator';
import ConfirmDialog from '@/components/ConfirmDialog';
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
    console.log('[Home] Component mounted/re-rendered');

    // App state
    const [messages, setMessages] = useState<Message[]>([]);
    const [initialPrompt, setInitialPrompt] = useState('You are a helpful AI assistant. Respond concisely and naturally.');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);

    // Text chat state
    const [showTextInput, setShowTextInput] = useState(false);
    const [textMessage, setTextMessage] = useState('');
    const textInputRef = useRef<HTMLInputElement>(null);

    // Confirmation dialog state
    const [showRestartDialog, setShowRestartDialog] = useState(false);
    const [showEndDialog, setShowEndDialog] = useState(false);

    // Model configuration
    const [modelConfig] = useState<ModelConfig>({
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Deepgram Aura Luna',
    });

    // Check configuration status on mount
    useEffect(() => {
        console.log('[Home] Checking API configuration status...');
        fetch('/api/config-status')
            .then(res => {
                console.log('[Home] Config status response received:', res.status);
                return res.json();
            })
            .then(data => {
                console.log('[Home] Config status data:', data);
                setConfigStatus(data);
            })
            .catch(err => {
                console.error('[Home] Failed to check config:', err);
            });
    }, []);

    // Handle audio segment processing
    const handleAudioSegment = useCallback(async (audioBlob: Blob) => {
        console.log('[Home] handleAudioSegment called');
        console.log('[Home] Audio blob size:', audioBlob.size, 'bytes');
        console.log('[Home] Audio blob type:', audioBlob.type);

        try {
            setProcessingStep('Transcribing audio...');
            console.log('[Home] Step 1: Starting transcription...');

            // Step 1: Upload and transcribe audio
            const formData = new FormData();
            // Append with proper filename and type
            const filename = audioBlob.type.includes('webm') ? 'audio.webm' :
                audioBlob.type.includes('mp4') ? 'audio.mp4' :
                    audioBlob.type.includes('wav') ? 'audio.wav' : 'audio.webm';

            console.log('[Home] Using filename:', filename);
            formData.append('audio', audioBlob, filename);

            console.log('[Home] Sending audio to /api/upload-audio...');
            const transcriptionResponse = await fetch('/api/upload-audio', {
                method: 'POST',
                body: formData,
            });

            console.log('[Home] Transcription response status:', transcriptionResponse.status);

            if (!transcriptionResponse.ok) {
                const errorData = await transcriptionResponse.json();
                console.error('[Home] Transcription failed:', errorData);
                throw new Error(errorData.error || 'Transcription failed');
            }

            const transcriptionData: TranscriptionResponse = await transcriptionResponse.json();
            console.log('[Home] Transcription successful:', transcriptionData.text);

            if (!transcriptionData.text?.trim()) {
                console.log('[Home] No speech detected in audio, skipping...');
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
            console.log('[Home] Adding user message to chat:', userMessage);
            setMessages(prev => [...prev, userMessage]);

            setProcessingStep('Generating response...');
            console.log('[Home] Step 2: Requesting LLM response...');

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

            console.log('[Home] LLM response status:', llmResponse.status);

            if (!llmResponse.ok) {
                const errorData = await llmResponse.json();
                console.error('[Home] LLM request failed:', errorData);
                throw new Error(errorData.error || 'LLM request failed');
            }

            const llmData: LLMResponse = await llmResponse.json();
            console.log('[Home] LLM response received:', llmData.llmText);

            // Add assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: llmData.llmText,
                source: 'assistant',
                timestamp: new Date(),
            };
            console.log('[Home] Adding assistant message to chat:', assistantMessage);
            setMessages(prev => [...prev, assistantMessage]);

            setProcessingStep('Generating speech...');
            console.log('[Home] Step 3: Generating TTS audio...');

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

            console.log('[Home] TTS response status:', ttsResponse.status);

            if (!ttsResponse.ok) {
                const errorData = await ttsResponse.json();
                console.error('[Home] TTS request failed:', errorData);
                throw new Error(errorData.error || 'TTS request failed');
            }

            const ttsData: TTSResponse = await ttsResponse.json();

            if (ttsData.audioData) {
                console.log('[Home] TTS audio generated, size:', ttsData.audioData.length, 'bytes (base64)');
                console.log('[Home] Converting and playing audio...');
                // Convert base64 to audio and play
                const audioBytes = Uint8Array.from(atob(ttsData.audioData), c => c.charCodeAt(0));
                const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                const audio = new Audio(audioUrl);
                console.log('[Home] Starting audio playback...');
                audio.play().catch(err => console.error('[Home] Audio playback error:', err));

                // Clean up URL after playing
                audio.addEventListener('ended', () => {
                    console.log('[Home] Audio playback ended');
                    URL.revokeObjectURL(audioUrl);
                });
            }

            console.log('[Home] Audio segment processing completed successfully');

        } catch (error) {
            console.error('[Home] Audio processing error:', error);

            // Add error message with specific error details
            let errorText = 'Sorry, I encountered an error processing your request. Please try again.';

            if (error instanceof Error) {
                console.error('[Home] Error message:', error.message);
                console.error('[Home] Error stack:', error.stack);

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
            console.log('[Home] Adding error message to chat:', errorMessage);
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            console.log('[Home] Clearing processing step');
            setProcessingStep('');
        }
    }, [initialPrompt]);

    // Voice recorder hook with optimized settings
    const { isListening, isProcessing, audioLevel, startRecording, stopRecording } = useVoiceRecorder({
        onSegmentReady: handleAudioSegment,
        silenceTimeout: 750, // Increased from 350ms to allow for more natural pauses
        silenceThreshold: 0.005, // More sensitive threshold for better speech detection
    });

    // Handle mic button toggle
    const handleMicToggle = useCallback(async () => {
        console.log('[Home] handleMicToggle called, isChatOpen:', isChatOpen, 'isListening:', isListening);

        if (isChatOpen) {
            console.log('[Home] Closing chat and stopping recording...');
            setIsChatOpen(false);
            if (isListening) {
                stopRecording();
            }
        } else {
            console.log('[Home] Opening chat and starting recording...');
            setIsChatOpen(true);
            try {
                await startRecording();
                console.log('[Home] Recording started successfully');
            } catch (error) {
                console.error('[Home] Failed to start recording:', error);
                setIsChatOpen(false);
                alert('Failed to access microphone. Please check permissions and try again.');
            }
        }
    }, [isChatOpen, isListening, startRecording, stopRecording]);

    // Handle restart conversation
    const handleRestartConversation = useCallback(() => {
        console.log('[Home] Restart conversation requested');
        setShowRestartDialog(true);
    }, []);

    const confirmRestartConversation = useCallback(() => {
        console.log('[Home] Restarting conversation...');
        setMessages([]);
        setShowRestartDialog(false);
        console.log('[Home] Conversation cleared');
    }, []);

    // Handle end conversation
    const handleEndConversation = useCallback(() => {
        console.log('[Home] End conversation requested');
        setShowEndDialog(true);
    }, []);

    const confirmEndConversation = useCallback(() => {
        console.log('[Home] Ending conversation...');

        // Stop recording if active
        if (isListening) {
            stopRecording();
        }

        // Close chat
        setIsChatOpen(false);

        // Clear messages
        setMessages([]);

        setShowEndDialog(false);
        console.log('[Home] Conversation ended');
    }, [isListening, stopRecording]);

    // Handle text message sending
    const handleSendTextMessage = useCallback(async () => {
        if (!textMessage.trim() || isProcessing) return;

        console.log('[Home] Sending text message:', textMessage);

        // Open chat if not already open
        if (!isChatOpen) {
            setIsChatOpen(true);
        }

        const userMessageText = textMessage.trim();
        setTextMessage(''); // Clear input immediately

        try {
            // Add user message
            const userMessage: Message = {
                id: Date.now().toString(),
                text: userMessageText,
                source: 'user',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);

            setProcessingStep('Generating response...');

            // Step 2: Get LLM response (skip STT since we have text directly)
            const llmPayload = {
                prompt: initialPrompt,
                userText: userMessageText,
            };

            console.log('[Home] Sending request to LLM...');
            const llmResponse = await fetch('/api/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(llmPayload),
            });

            if (!llmResponse.ok) {
                const errorData = await llmResponse.json();
                console.error('[Home] LLM failed:', errorData);
                throw new Error(errorData.error || 'LLM processing failed');
            }

            const llmData: LLMResponse = await llmResponse.json();
            console.log('[Home] LLM response:', llmData.llmText);

            // Add assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: llmData.llmText,
                source: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            setProcessingStep('Generating speech...');

            // Step 3: Convert to speech (optional - you can skip this for text-only)
            const ttsResponse = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: llmData.llmText }),
            });

            if (!ttsResponse.ok) {
                console.warn('[Home] TTS failed, continuing without audio');
            } else {
                const ttsData: TTSResponse = await ttsResponse.json();

                if (ttsData.audioData) {
                    console.log('[Home] TTS audio generated, playing...');
                    const audioBytes = Uint8Array.from(atob(ttsData.audioData), c => c.charCodeAt(0));
                    const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    const audio = new Audio(audioUrl);
                    audio.play().catch(err => console.error('[Home] Audio playback error:', err));

                    audio.addEventListener('ended', () => {
                        URL.revokeObjectURL(audioUrl);
                    });
                }
            }

        } catch (error) {
            console.error('[Home] Text message processing error:', error);

            let errorText = 'Sorry, I encountered an error processing your message.';

            if (error instanceof Error) {
                if (error.message.includes('LLM service not configured')) {
                    errorText = 'Please configure your Gemini API key in .env.local to use AI responses.';
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
    }, [textMessage, isProcessing, isChatOpen, initialPrompt]);

    // Toggle text input visibility
    const toggleTextInput = useCallback(() => {
        setShowTextInput(prev => !prev);
        if (!showTextInput) {
            // Focus input when showing
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
                    <div className="p-3 border-b border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="text-base font-medium">Conversation</h3>

                                {/* Conversation Control Buttons */}
                                {messages.length > 0 && (
                                    <motion.div
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
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
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500' :
                                    isProcessing ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    }`}></div>
                                <span className="text-xs text-gray-400">
                                    {isListening ? 'Listening' : isProcessing ? 'Processing' : 'Ready'}
                                </span>

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
                                    isListening={isListening}
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

                        {/* Audio Level Indicator */}
                        {isListening && (
                            <AudioLevelIndicator level={audioLevel} isListening={isListening} />
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
        </div>
    );
}