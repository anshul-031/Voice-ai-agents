// 'use client';

// import { useEffect, useRef } from 'react';
// import { Message } from '@/types';
// import { User, Bot, Mic } from 'lucide-react';

// interface ChatBoxProps {
//     messages: Message[];
//     isOpen: boolean;
//     isListening: boolean;
//     isProcessing: boolean;
//     processingStep?: string;
// }

// export default function ChatBox({
//     messages,
//     isOpen,
//     isListening,
//     isProcessing,
//     processingStep
// }: ChatBoxProps) {
//     const scrollRef = useRef<HTMLDivElement | null>(null);

//     useEffect(() => {
//         if (scrollRef.current) {
//             scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//         }
//     }, [messages]);

//     return (
//         <div className="h-full flex flex-col relative">
//             {/* Status indicators when not chatting */}
//             {!isOpen && (
//                 <div className="flex-1 flex items-center justify-center p-8">
//                     <div className="text-center max-w-md">
//                         <div className="mb-6">
//                             <div className="w-20 h-20 mx-auto bg-slate-800 rounded-lg flex items-center justify-center">
//                                 <Mic className="h-8 w-8 text-white" />
//                             </div>
//                         </div>

//                         <h3 className="text-xl font-medium text-white mb-2">Ready to Start</h3>
//                         <p className="text-gray-400 leading-relaxed">
//                             Click the microphone button to begin your conversation.
//                         </p>
//                     </div>
//                 </div>
//             )}

//             {/* Chat messages when active */}
//             {isOpen && (
//                 <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
//                     {messages.length === 0 ? (
//                         <div className="text-center py-12">
//                             <h3 className="text-lg font-medium text-white mb-2">Listening...</h3>
//                             <p className="text-gray-400">
//                                 Speak naturally and clearly.
//                             </p>
//                         </div>
//                     ) : (
//                         messages.map((message) => (
//                             <div
//                                 key={message.id}
//                                 className={`flex ${message.source === 'user' ? 'justify-end' : 'justify-start'}`}
//                             >
//                                 <div className={`max-w-[90%] relative ${message.source === 'user' ? 'ml-4' : 'mr-4'
//                                     }`}>
//                                     {/* Message bubble */}
//                                     <div className={`px-4 py-3 rounded-lg ${message.source === 'user'
//                                         ? 'bg-blue-600 text-white'
//                                         : 'bg-slate-700 text-white'
//                                         }`}>
//                                         {/* Message header */}
//                                         <div className="flex items-center justify-between mb-2 text-xs">
//                                             <div className="flex items-center gap-2">
//                                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center ${message.source === 'user'
//                                                     ? 'bg-blue-500'
//                                                     : 'bg-slate-600'
//                                                     }`}>
//                                                     {message.source === 'user' ? (
//                                                         <User size={12} />
//                                                     ) : (
//                                                         <Bot size={12} />
//                                                     )}
//                                                 </div>
//                                                 <span className="font-medium">
//                                                     {message.source === 'user' ? 'You' : 'AI Assistant'}
//                                                 </span>
//                                             </div>
//                                             <span className="text-xs opacity-70">
//                                                 {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                             </span>
//                                         </div>

//                                         {/* Message content */}
//                                         <div className="text-sm">
//                                             <p className="whitespace-pre-wrap">{message.text}</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))
//                     )}

//                     {/* Processing indicator */}
//                     {isProcessing && (
//                         <div className="flex justify-start">
//                             <div className="max-w-[85%] mr-4">
//                                 <div className="px-4 py-3 rounded-lg bg-slate-700 text-white">
//                                     <div className="flex items-center justify-between mb-2 text-xs">
//                                         <div className="flex items-center gap-2">
//                                             <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
//                                                 <Bot size={12} />
//                                             </div>
//                                             <span className="font-medium">AI Assistant</span>
//                                         </div>
//                                         <span className="text-xs opacity-70">
//                                             {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                         </span>
//                                     </div>
//                                     <div className="flex items-center gap-3 text-sm">
//                                         <div className="w-4 h-4 border-2 border-t-transparent border-slate-400 rounded-full animate-spin"></div>
//                                         <div className="text-gray-300">{processingStep || 'Processing your request...'}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// }

import { motion } from 'framer-motion';
import { Bot, Mic, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Message } from '../types';

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
    isListening: _isListening,
    isProcessing,
    processingStep
}: ChatBoxProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            if (typeof scrollRef.current.scrollTo === 'function') {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages]);

    return (
        <div className="h-full flex flex-col relative">
            {!isOpen && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center max-w-md"
                    >
                        <div className="mb-6">
                            <motion.div
                                className="w-24 h-24 mx-auto glass-button rounded-3xl flex items-center justify-center glow-blue"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Mic className="h-12 w-12 text-blue-300 drop-shadow-lg" />
                            </motion.div>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3 text-gradient-blue">Ready to Start</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Click the microphone button to begin your conversation with the AI assistant.
                        </p>
                    </motion.div>
                </div>
            )}

            {isOpen && (
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <motion.div
                                className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-card mb-4 border border-red-400/30"
                                animate={{
                                    boxShadow: [
                                        '0 0 20px rgba(239, 68, 68, 0.3)',
                                        '0 0 40px rgba(239, 68, 68, 0.5)',
                                        '0 0 20px rgba(239, 68, 68, 0.3)'
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-lg"></div>
                            </motion.div>
                            <h3 className="text-lg font-semibold text-white mb-2">🎤 Listening...</h3>
                            <p className="text-gray-400">
                                Speak naturally and clearly.
                            </p>
                        </motion.div>
                    ) : (
                        messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex ${message.source === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] ${message.source === 'user' ? 'ml-4' : 'mr-4'}`}>
                                    <div className={`px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 hover:shadow-2xl ${message.source === 'user'
                                        ? 'bg-gradient-to-br from-blue-600/90 to-blue-500/90 border-blue-400/30 text-white'
                                        : 'glass-card border-slate-600/30 text-white'
                                        }`}>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md ${message.source === 'user'
                                                ? 'bg-blue-400'
                                                : 'bg-gradient-to-br from-slate-600 to-slate-700'
                                                }`}>
                                                {message.source === 'user' ? (
                                                    <User size={14} className="text-white drop-shadow" />
                                                ) : (
                                                    <Bot size={14} className="text-blue-300 drop-shadow" />
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold opacity-90">
                                                {message.source === 'user' ? 'You' : 'AI Assistant'}
                                            </span>
                                            <span className="text-xs opacity-60 ml-auto font-mono">
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="text-sm leading-relaxed">
                                            <p className="whitespace-pre-wrap">{message.text}</p>
                                        </div>

                                        {/* Glass shine effect */}
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}

                    {isProcessing && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="max-w-[85%] mr-4">
                                <div className="relative px-5 py-3.5 rounded-2xl glass-card border border-blue-400/20 text-white shadow-xl">
                                    <div className="flex items-center gap-2.5 mb-2.5">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md">
                                            <Bot size={14} className="text-blue-300 drop-shadow" />
                                        </div>
                                        <span className="text-xs font-semibold opacity-90">AI Assistant</span>
                                        <span className="text-xs opacity-60 ml-auto font-mono">
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        {/* Animated dots */}
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 rounded-full bg-blue-400"
                                                    animate={{
                                                        scale: [1, 1.3, 1],
                                                        opacity: [0.5, 1, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        delay: i * 0.2
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="text-gray-300 font-medium">{processingStep || 'Processing your request...'}</div>
                                    </div>

                                    {/* Glass shine */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
