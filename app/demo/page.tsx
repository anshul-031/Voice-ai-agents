/* eslint-disable no-console */
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
import { Clock, MessageSquare, Phone, PhoneOff, RotateCcw, Send } from 'lucide-react';
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
    // Console logs are allowed in this demo page for debugging UX

    // Session management
    const [sessionId, setSessionId] = useState<string>('');

    // App state
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatMessages, setChatMessages] = useState<Message[]>([]); // Separate state for text chat history
    const [isTextChatMode, setIsTextChatMode] = useState(false); // Track if we're in text chat mode vs call mode
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

    // Real-time speech recognition (Web Speech API) for immediate transcripts
    const {
        supported: _sttSupported,
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
                    setProcessingStep('');
                    setIsProcessing(false);
                    return;
                }
                
                // Clear processing state once TTS response is received
                setProcessingStep('');
                setIsProcessing(false);
                
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
        onAudioLevelChange: (_level) => {
            // Audio level monitoring for visual feedback
        },
    });

    // Send automatic greeting when call connects
    const sendGreetingMessage = useCallback(async () => {
        const greetingText = 'नमस्ते जी, मैं रिया बोल रही हूँ Punjab National Bank की तरफ़ से। क्या मेरी बात अभिजीत जी से हो रही है?';
        
        console.log('[Home] Sending automatic greeting message');
        
        // Add assistant greeting to messages
        const greetingMessage: Message = {
            id: `greeting-${Date.now()}`,
            text: greetingText,
            source: 'assistant',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, greetingMessage]);
        
        // Generate TTS for greeting
        try {
            setProcessingStep('Generating greeting...');
            setIsProcessing(true);
            
            const ttsResponse = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: greetingText }),
            });
            
            setProcessingStep('');
            setIsProcessing(false);
            
            if (!isCallActiveRef.current) {
                console.log('[Home] Call ended before greeting TTS completed');
                return;
            }
            
            if (ttsResponse.ok) {
                const ttsData = await ttsResponse.json();
                if (ttsData.audio && isCallActiveRef.current) {
                    const audio = new Audio(`data:audio/mpeg;base64,${ttsData.audio}`);
                    currentAudioRef.current = audio;
                    
                    audio.onended = () => {
                        console.log('[Home] Greeting audio playback ended');
                        currentAudioRef.current = null;
                    };
                    
                    await audio.play();
                    console.log('[Home] Playing greeting audio');
                }
            } else {
                console.warn('[Home] Greeting TTS failed');
            }
        } catch (error) {
            console.error('[Home] Error sending greeting:', error);
            setProcessingStep('');
            setIsProcessing(false);
        }
    }, []);

    // Handle call button toggle - simple start/end call (FRESH CALL EACH TIME)
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
            
            // Clear call messages (fresh call each time)
            setMessages([]);
            
            // Clear any processing state
            setProcessingStep('');
            setIsProcessing(false);
            
            // Generate new session ID for next call
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setSessionId(newSessionId);
            console.log('[Home] Generated new session ID for next call:', newSessionId);
            
            console.log('[Home] Call ended successfully');
        } else {
            console.log('[Home] Starting fresh call...');
            
            // Clear messages for fresh call
            setMessages([]);
            setIsTextChatMode(false); // This is a call, not text chat
            
            // Generate new session ID
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setSessionId(newSessionId);
            console.log('[Home] Generated new session ID for call:', newSessionId);
            
            setIsChatOpen(true);
            try {
                // Set flag to allow processing speech
                isCallActiveRef.current = true;
                
                // Start continuous call
                await startCall();
                
                // Start real-time STT
                sttStart();
                
                console.log('[Home] Call started successfully');
                
                // Send automatic greeting message
                sendGreetingMessage();
            } catch (error) {
                console.error('[Home] Failed to start call:', error);
                isCallActiveRef.current = false;
                setIsChatOpen(false);
                alert('Failed to access microphone. Please check permissions and try again.');
            }
        }
    }, [isCallActive, isChatOpen, startCall, endCall, sttStart, sttStop]);

    // Handle restart conversation (for TEXT CHAT mode only)
    const handleRestartConversation = useCallback(() => {
        console.log('[Home] Clear chat requested');
        
        // Clear both chat and display messages
        setMessages([]);
        setChatMessages([]);

        // Generate new session ID for the new chat
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log('[Home] Generated new session ID:', newSessionId);

        console.log('[Home] Chat cleared');
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

    // Handle text message sending (MAINTAINS HISTORY UNTIL REFRESH)
    const handleSendTextMessage = useCallback(async () => {
        if (!textMessage.trim() || isProcessing) return;

        console.log('[Home] Sending text message:', textMessage);

        // Open chat if not already open and set to text chat mode
        if (!isChatOpen) {
            setIsChatOpen(true);
            setIsTextChatMode(true); // This is text chat mode
        }

        const userMessageText = textMessage.trim();
        setTextMessage(''); // Clear input immediately
        setIsProcessing(true);

        try {
            // Add user message
            const userMessage: Message = {
                id: uid(),
                text: userMessageText,
                source: 'user',
                timestamp: new Date(),
            };

            // Update CHAT messages state (persists until refresh)
            const updatedMessages = [...chatMessages, userMessage];
            setChatMessages(updatedMessages);
            setMessages(updatedMessages);
            
            let currentMessages = updatedMessages;

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
            
            // Update chat messages state
            const finalMessages = [...currentMessages, assistantMessage];
            setChatMessages(finalMessages);
            setMessages(finalMessages);

            setProcessingStep('Generating speech...');

            // Step 3: Convert to speech (optional - you can skip this for text-only)
            const ttsResponse = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: llmData.llmText }),
            });

            // Clear processing state after TTS response
            setProcessingStep('');
            setIsProcessing(false);

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
                    audio.play().catch(err => console.error('[Home] Audio playback error]:', err));

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
            const errorMessages = [...chatMessages, errorMessage];
            setChatMessages(errorMessages);
            setMessages(errorMessages);
        } finally {
            setProcessingStep('');
            setIsProcessing(false);
        }
    }, [textMessage, isProcessing, isChatOpen, initialPrompt, sessionId, chatMessages, uid]);

    // Toggle text input visibility
    const toggleTextInput = useCallback(() => {
        const willShow = !showTextInput;
        setShowTextInput(willShow);
        
        if (willShow) {
            // When opening text chat, make sure we're in text chat mode
            if (!isChatOpen) {
                setIsChatOpen(true);
                setIsTextChatMode(true);
            }
            // Focus input when showing
            setTimeout(() => textInputRef.current?.focus(), 100);
        }
    }, [showTextInput, isChatOpen]);

    // Handle enter key in text input
    const handleTextInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendTextMessage();
        }
    }, [handleSendTextMessage]);

    return (
        <div className="min-h-screen text-white">
            {/* Modern Header */}
            <header className="glass-panel border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            AI Voice Assistant
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60">
                                v2.0
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    {/* Model Configuration */}
                    <TopModelBoxes config={modelConfig} />

                    {/* System Prompt */}
                    <InitialPromptEditor value={initialPrompt} onChange={setInitialPrompt} />

                    {/* Chat Interface - Modern Design */}
                    <div className="glass-panel rounded-2xl overflow-hidden h-[600px] flex flex-col animate-scale-in">
                    {/* Modern Chat Header */}
                    <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-semibold text-white/90">Conversation</h3>

                                {/* Control Buttons */}
                                <motion.div
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* History Button */}
                                    <motion.button
                                        onClick={() => setShowChatHistory(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/10"
                                        title="View chat history"
                                        disabled={isProcessing}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Clock size={13} />
                                        <span>History</span>
                                    </motion.button>

                                    {/* Clear Chat - Only for TEXT CHAT mode */}
                                    {isTextChatMode && messages.length > 0 && !isCallActive && (
                                        <motion.button
                                            onClick={handleRestartConversation}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/10"
                                            title="Clear chat messages"
                                            disabled={isProcessing}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <RotateCcw size={13} />
                                            <span>Clear</span>
                                        </motion.button>
                                    )}
                                </motion.div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Modern Status Indicator */}
                                {(() => {
                                    const statusConfig = isCallActive 
                                        ? { color: 'bg-green-500', glow: 'shadow-[0_0_12px_rgba(48,209,88,0.5)]', label: 'On Call', sublabel: sttIsListening ? 'Listening' : 'Active' }
                                        : isProcessing
                                        ? { color: 'bg-blue-500', glow: 'shadow-[0_0_12px_rgba(10,132,255,0.5)]', label: 'Processing', sublabel: '' }
                                        : { color: 'bg-white/20', glow: '', label: 'Ready', sublabel: '' };
                                    
                                    return (
                                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                            <div className={`w-2 h-2 rounded-full ${statusConfig.color} ${statusConfig.glow} ${isCallActive ? 'animate-pulse' : ''}`}></div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-white/90">{statusConfig.label}</span>
                                                {statusConfig.sublabel && (
                                                    <span className="text-[10px] text-white/50">{statusConfig.sublabel}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Text Chat Button */}
                                <motion.button
                                    onClick={toggleTextInput}
                                    className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all border ${
                                        showTextInput
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400/30 shadow-lg shadow-blue-500/25'
                                            : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                                    }`}
                                    title="Text chat mode"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <MessageSquare size={20} className="text-white" />
                                </motion.button>

                                {/* Call Button - Modern Design */}
                                <motion.button
                                    onClick={handleCallToggle}
                                    className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold transition-all border shadow-lg ${
                                        isCallActive
                                            ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-400/30 shadow-red-500/25 hover:shadow-red-500/40 text-white'
                                            : 'bg-gradient-to-br from-green-500 to-green-600 border-green-400/30 shadow-green-500/25 hover:shadow-green-500/40 text-white'
                                    }`}
                                    title={isCallActive ? "End Call" : "Start Call"}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    disabled={callState === 'connecting' || callState === 'ending'}
                                >
                                    {isCallActive ? (
                                        <>
                                            <PhoneOff size={19} strokeWidth={2.5} />
                                            <span className="text-sm">End Call</span>
                                        </>
                                    ) : (
                                        <>
                                            <Phone size={19} strokeWidth={2.5} />
                                            <span className="text-sm">Start Call</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        {/* Modern Text Input Area */}
                        <AnimatePresence>
                            {showTextInput && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                ref={textInputRef}
                                                type="text"
                                                value={textMessage}
                                                onChange={(e) => setTextMessage(e.target.value)}
                                                onKeyDown={handleTextInputKeyDown}
                                                placeholder="Type your message..."
                                                disabled={isProcessing}
                                                className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-white/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                                            />
                                        </div>
                                        <motion.button
                                            onClick={handleSendTextMessage}
                                            disabled={!textMessage.trim() || isProcessing}
                                            className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 border border-blue-400/30"
                                            title="Send message"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Send size={19} strokeWidth={2.5} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Modern Call Status */}
                        {isCallActive && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg"
                            >
                                <p className="text-xs font-medium text-green-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Call active - Speak naturally
                                </p>
                            </motion.div>
                        )}

                        {/* Split View: Transcription + Visualizer */}
                        {isCallActive && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {/* Left: Transcription Section */}
                                <div className="glass-panel rounded-2xl p-4 border border-white/10 min-h-[200px]">
                                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                        <span className="text-blue-400">💬</span>
                                        Live Transcription
                                    </h3>
                                    <div className="space-y-2">
                                        {sttIsListening && interimTranscript && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                                            >
                                                <p className="text-sm text-blue-300 italic">
                                                    {interimTranscript}
                                                </p>
                                            </motion.div>
                                        )}
                                        {!interimTranscript && (
                                            <p className="text-xs text-white/40 italic">
                                                Speak to see your words transcribed here...
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Audio Visualizer Section */}
                                <div className="glass-panel rounded-2xl p-4 border border-white/10">
                                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                        <span className="text-green-400">🎙️</span>
                                        Audio Visualizer
                                    </h3>
                                    <AudioLevelIndicator level={audioLevel} isListening={isCallActive} />
                                </div>
                            </motion.div>
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
            </main>

            {/* Confirmation Dialog for ending call */}
            <ConfirmDialog
                isOpen={showEndDialog}
                title="End Call"
                message="Are you sure you want to end the call? This will stop recording and clear all messages."
                confirmLabel="End Call"
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
