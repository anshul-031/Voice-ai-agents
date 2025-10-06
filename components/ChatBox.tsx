'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import { User, Bot, Mic } from 'lucide-react';

interface ChatBoxProps {
    messages: Message[];
    isOpen: boolean;
    isListening: boolean;
    isProcessing: boolean;
    processingStep?: string;
}

export default function ChatBox({
    messages,
    isOpen,
    isListening,
    isProcessing,
    processingStep
}: ChatBoxProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="h-full flex flex-col relative">
            {/* Status indicators when not chatting */}
            {!isOpen && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="mb-6">
                            <div className="w-20 h-20 mx-auto bg-slate-800 rounded-lg flex items-center justify-center">
                                <Mic className="h-8 w-8 text-white" />
                            </div>
                        </div>

                        <h3 className="text-xl font-medium text-white mb-2">Ready to Start</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Click the microphone button to begin your conversation.
                        </p>
                    </div>
                </div>
            )}

            {/* Chat messages when active */}
            {isOpen && (
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-white mb-2">Listening...</h3>
                            <p className="text-gray-400">
                                Speak naturally and clearly.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.source === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[90%] relative ${message.source === 'user' ? 'ml-4' : 'mr-4'
                                    }`}>
                                    {/* Message bubble */}
                                    <div className={`px-4 py-3 rounded-lg ${message.source === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 text-white'
                                        }`}>
                                        {/* Message header */}
                                        <div className="flex items-center justify-between mb-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${message.source === 'user'
                                                    ? 'bg-blue-500'
                                                    : 'bg-slate-600'
                                                    }`}>
                                                    {message.source === 'user' ? (
                                                        <User size={12} />
                                                    ) : (
                                                        <Bot size={12} />
                                                    )}
                                                </div>
                                                <span className="font-medium">
                                                    {message.source === 'user' ? 'You' : 'AI Assistant'}
                                                </span>
                                            </div>
                                            <span className="text-xs opacity-70">
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Message content */}
                                        <div className="text-sm">
                                            <p className="whitespace-pre-wrap">{message.text}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Processing indicator */}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="max-w-[85%] mr-4">
                                <div className="px-4 py-3 rounded-lg bg-slate-700 text-white">
                                    <div className="flex items-center justify-between mb-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
                                                <Bot size={12} />
                                            </div>
                                            <span className="font-medium">AI Assistant</span>
                                        </div>
                                        <span className="text-xs opacity-70">
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-4 h-4 border-2 border-t-transparent border-slate-400 rounded-full animate-spin"></div>
                                        <div className="text-gray-300">{processingStep || 'Processing your request...'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}