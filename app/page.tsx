'use client';

import AudioLevelIndicator from '@/components/AudioLevelIndicator';
import ChatBox from '@/components/ChatBox';
import ChatHistory from '@/components/ChatHistory';
import ConfirmDialog from '@/components/ConfirmDialog';
import InitialPromptEditor from '@/components/InitialPromptEditor';
import TopModelBoxes from '@/components/TopModelBoxes';
import { useContinuousCall } from '@/hooks/useContinuousCall';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { LLMResponse, Message, ModelConfig, TTSResponse } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, MessageSquare, Phone, PhoneOff, RotateCcw, Send, X } from 'lucide-react';
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

export default function Home() {
    console.log('[Home] Component mounted/re-rendered');

    // Session management
    const [sessionId, setSessionId] = useState<string>('');

    // App state
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [initialPrompt, setInitialPrompt] = useState(`# Role: You are Riya for collecting overdue EMI payments from customers of Punjab National Bank

## Profile
author: LangGPT
version: 1.0
language: Hinglish (mix of Hindi in Devanagari and English in a natural conversational way)
description: You are expert in banking collections and recovery, and you are good at firmly reminding and persuading customers to clear overdue EMIs using a strict, professional Hinglish tone.

## Skills
1. Overdue EMI collection communication in Hinglish
2. Handling excuses and objections with firmness
3. Persuading customers to make immediate payment and guiding them to channels of payment

## Background:
1. You are having a voice-to-voice conversation with a user. Always pretend you are a real human. Do not avoid or decline to answer questions because you are not human.
2. Remember that this conversation is being had on the phone. So the messages you receive will include transcription errors, your responses should be short, direct, and firm since it is being synthesized into audio, and there may be some interruptions.
3. You are calling on behalf of Punjab National Bank to **collect overdue EMI payments**. The customer has already missed their due date.
4. Always use Hinglish (Hindi in Devanagari script + English), but keep the tone **strict, firm, and professional**. Do not sound too casual or overly friendly.

## Goals:
Your goal is to firmly remind the customer about their overdue EMI, mention the overdue amount and due date, and strongly persuade them to pay immediately to avoid penalties, late fees, or negative impact on credit score. If the customer resists, handle objections firmly but politely. If the customer promises to pay, confirm the commitment clearly.

## Style and tone 
1. Always keep a strict, authoritative, and no-nonsense tone. 
2. Start sentences with words such as 'listen', 'देखिए', 'ok', 'please note', to show firmness. 
3. Keep your language short, direct, and commanding, with minimal fillers.
4. Use Hinglish: Hindi words in Devanagari for authority and seriousness, English for clarity. Example: "अभिजीत जी, आपका EMI तीन हज़ार रुपये का बीस तारीख को due था और अब तक clear नहीं हुआ है। आपको तुरंत payment करना होगा।"
5. Sound like a professional bank recovery officer.

## Rules
1. Do not accept vague answers like "देखेंगे" or "सोचेंगे". Push politely but firmly for a commitment of date/time of payment.
2. NEVER type out a number or symbol, instead ALWAYS type it in word form. And always split up abbreviations.
Here are some examples:
$130,000 should be "one hundred and thirty thousand dollars"
– 50% should be "fifty percent"
– "API" should be "A P I"
3. Always confirm customer's name before sharing EMI details.
4. Do not get emotional or apologetic. Maintain firm, professional authority.

## Forbidden content:
1. Do not use any form of profanity or vulgar language.
2. Do not use any form of sexually explicit language.
3. Do not use any form of misleading or deceptive content.
4. Forbidden words: fuck, shit, etc.
5. Do not request sensitive personal details like OTP, PIN, Aadhaar full number, or passwords.

## Workflows
1. Start by verifying customer identity: "नमस्ते जी, क्या मेरी बात अभिजीत जी से हो रही है?"
2. State firmly: "अभिजीत जी, आपका EMI तीन हज़ार रुपये का बीस तारीख को due था और अभी तक clear नहीं हुआ है।"
3. Push for payment: "Please note, अगर आप भुगतान तुरंत नहीं करते हैं तो late charges और penalty लगेगी, और आपके credit score पर भी negative impact होगा।"
4. If customer gives excuse → handle strictly: "देखिए अभिजीत जी, यह amount immediately clear करना ज़रूरी है। Kindly बताइए आप कब तक payment करेंगे?"
5. If customer commits → confirm clearly: "Ok, मैं confirm कर रही हूँ कि आप कल तक payment करेंगे। धन्यवाद।"
6. If customer refuses → stay strict: "Please note, refusal से आपके account पर severe action हो सकता है। मैं strongly recommend करती हूँ कि आप immediately payment करें।"

## Init
"नमस्ते जी, मैं रिया बोल रही हूँ Punjab National Bank की तरफ़ से। क्या मेरी बात अभिजीत जी से हो रही है?"`);
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

    // Audio playback tracking
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const isCallActiveRef = useRef<boolean>(false);

    // Model configuration
    const [modelConfig] = useState<ModelConfig>({
        llmModel: 'Gemini 1.5 Flash',
        sttModel: 'AssemblyAI Universal',
        ttsModel: 'Deepgram Aura Luna',
    });

    // Check configuration status on mount
    useEffect(() => {
        console.log('[Home] Checking API configuration status...');

        // Generate session ID on component mount
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log('[Home] Generated session ID:', newSessionId);

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

    // Unique ID generator for stable keys
    const uid = useCallback(() => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, []);

    // Note: Removed handleAudioSegment - now using continuous call mode with real-time STT

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
            // Check if call is still active before processing
            if (!isCallActiveRef.current) {
                console.log('[Home] Call ended, ignoring speech input');
                return;
            }

            // Mimic the same flow as handleAudioSegment but with direct text
            if (!finalText?.trim()) return;
            
            console.log('[Home] Processing speech:', finalText);
            setIsProcessing(true);
            
            try {
                setProcessingStep('Generating response...');

                const userMessage: Message = {
                    id: uid(),
                    text: finalText,
                    source: 'user',
                    timestamp: new Date(),
                };

                // Update messages state and capture current conversation history
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
                
                // Check again if call is still active
                if (!isCallActiveRef.current) {
                    console.log('[Home] Call ended during LLM processing, aborting');
                    return;
                }
                
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

                // Pause mic while bot speaks to avoid feedback
                sttPause();
                const ttsResponse = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: llmData.llmText }),
                });
                
                // Check again if call is still active before playing audio
                if (!isCallActiveRef.current) {
                    console.log('[Home] Call ended during TTS generation, aborting');
                    return;
                }
                
                if (ttsResponse.ok) {
                    const ttsData: TTSResponse = await ttsResponse.json();
                    if (ttsData.audioData && isCallActiveRef.current) {
                        const audioBytes = Uint8Array.from(atob(ttsData.audioData), c => c.charCodeAt(0));
                        const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        
                        // Track current audio for cleanup
                        currentAudioRef.current = audio;
                        
                        audio.play().catch(err => console.error('[Home] Audio playback error:', err));
                        audio.addEventListener('ended', () => {
                            URL.revokeObjectURL(audioUrl);
                            currentAudioRef.current = null;
                            // Resume listening after bot finishes (only if call still active)
                            if (isCallActiveRef.current) {
                                sttResume();
                            }
                        });
                    } else {
                        if (isCallActiveRef.current) {
                            sttResume();
                        }
                    }
                } else {
                    if (isCallActiveRef.current) {
                        sttResume();
                    }
                }
            } catch (error) {
                console.error('[Home] Real-time STT flow error:', error);
                const errorMessage: Message = {
                    id: uid(),
                    text: 'Error processing speech. Please try again.',
                    source: 'assistant',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setProcessingStep('');
                setIsProcessing(false);
            }
        },
    });

    // Continuous call hook for phone-like behavior
    const { callState, audioLevel, startCall, endCall, isCallActive } = useContinuousCall({
        onAudioLevelChange: (level) => {
            // Audio level monitoring for visual feedback
        },
    });

    // Handle call button toggle - simple start/end call
    const handleCallToggle = useCallback(async () => {
        console.log('[Home] handleCallToggle called, isCallActive:', isCallActive, 'isChatOpen:', isChatOpen);

        if (isCallActive || isChatOpen) {
            console.log('[Home] Ending call...');
            
            // Set flag to stop processing new speech
            isCallActiveRef.current = false;
            
            // Stop any currently playing audio
            if (currentAudioRef.current) {
                console.log('[Home] Stopping audio playback');
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
                currentAudioRef.current = null;
            }
            
            // Stop STT first to prevent new transcriptions
            sttStop();
            
            // End the call (stops microphone)
            endCall();
            
            // Close chat UI
            setIsChatOpen(false);
            
            // Clear any processing state
            setProcessingStep('');
            setIsProcessing(false);
            
            console.log('[Home] Call ended successfully');
        } else {
            console.log('[Home] Starting call...');
            setIsChatOpen(true);
            try {
                // Set flag to allow processing speech
                isCallActiveRef.current = true;
                
                // Start continuous call
                await startCall();
                
                // Start real-time STT
                sttStart();
                
                console.log('[Home] Call started successfully');
            } catch (error) {
                console.error('[Home] Failed to start call:', error);
                isCallActiveRef.current = false;
                setIsChatOpen(false);
                alert('Failed to access microphone. Please check permissions and try again.');
            }
        }
    }, [isCallActive, isChatOpen, startCall, endCall, sttStart, sttStop]);

    // Handle restart conversation
    const handleRestartConversation = useCallback(() => {
        console.log('[Home] Restart conversation requested');
        setShowRestartDialog(true);
    }, []);

    const confirmRestartConversation = useCallback(() => {
        console.log('[Home] Restarting conversation...');
        setMessages([]);

        // Generate new session ID for the new conversation
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log('[Home] Generated new session ID:', newSessionId);

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

        // Set flag to stop processing new speech
        isCallActiveRef.current = false;
        
        // Stop any currently playing audio
        if (currentAudioRef.current) {
            console.log('[Home] Stopping audio playback');
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
            currentAudioRef.current = null;
        }

        // Stop STT and call
        sttStop();
        endCall();

        // Close chat
        setIsChatOpen(false);

        // Clear messages
        setMessages([]);
        
        // Clear processing state
        setProcessingStep('');
        setIsProcessing(false);

        // Generate new session ID for next conversation
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log('[Home] Generated new session ID for next conversation:', newSessionId);

        setShowEndDialog(false);
        console.log('[Home] Conversation ended');
    }, [endCall, sttStop]);

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
                id: uid(),
                text: userMessageText,
                source: 'user',
                timestamp: new Date(),
            };

            // Update messages state and capture current conversation history
            let currentMessages: Message[] = [];
            setMessages(prev => {
                currentMessages = [...prev, userMessage];
                return currentMessages;
            });

            setProcessingStep('Generating response...');

            // Step 2: Get LLM response (skip STT since we have text directly)
            const llmPayload = {
                prompt: initialPrompt,
                userText: userMessageText,
                sessionId: sessionId,
                conversationHistory: currentMessages.slice(0, -1).map(m => ({
                    text: m.text,
                    source: m.source
                })),
            };

            console.log('[Home] Sending request to LLM with conversation history...');
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
                id: uid(),
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
                id: uid(),
                text: errorText,
                source: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setProcessingStep('');
        }
    }, [textMessage, isProcessing, isChatOpen, initialPrompt, uid]);

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
                                <motion.div
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* History Button - Always Visible */}
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

                                    {/* Restart and End buttons - Only when messages exist */}
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
                                {/* Call Status Indicator */}
                                {(() => {
                                    const color = isCallActive ? 'bg-green-500' : (isProcessing ? 'bg-yellow-500' : 'bg-gray-500');
                                    const label = isCallActive ? `Call Active ${sttIsListening ? '(Listening)' : ''}` : (isProcessing ? 'Processing' : 'Ready');
                                    return (
                                        <>
                                            <div className={`w-2 h-2 rounded-full ${color} ${isCallActive ? 'animate-pulse' : ''}`}></div>
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

                                {/* Call Button - Start/End Call */}
                                <motion.button
                                    onClick={handleCallToggle}
                                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isCallActive || isChatOpen
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    title={isCallActive || isChatOpen ? "End Call" : "Start Call"}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={callState === 'connecting' || callState === 'ending'}
                                >
                                    {isCallActive || isChatOpen ? (
                                        <>
                                            <PhoneOff size={18} />
                                            <span>End Call</span>
                                        </>
                                    ) : (
                                        <>
                                            <Phone size={18} />
                                            <span>Start Call</span>
                                        </>
                                    )}
                                </motion.button>
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

                        {/* Call Tips */}
                        {isCallActive && (
                            <p className="text-xs text-green-400">
                                📞 Call active - speak naturally, end call anytime
                            </p>
                        )}

                        {/* Audio Level Indicator and Interim Transcript */}
                        {isCallActive && (
                            <div className="space-y-2">
                                {/* Show interim transcript if available */}
                                {sttIsListening && interimTranscript && (
                                    <p className="text-xs text-gray-300 italic">💬 {interimTranscript}</p>
                                )}
                                {/* Show audio level */}
                                <AudioLevelIndicator level={audioLevel} isListening={isCallActive} />
                            </div>
                        )}
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 min-h-0">
                        <ChatBox
                            messages={messages}
                            isOpen={isChatOpen}
                            isListening={isCallActive}
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