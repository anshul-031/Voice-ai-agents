'use client';

import { useState, useEffect } from 'react';
import { X, Clock, User, Bot, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    systemPrompt?: string;
}

interface ChatSession {
    sessionId: string;
    userId: string;
    messageCount: number;
    firstMessage: string;
    lastMessage: string;
    lastTimestamp: string;
    firstTimestamp: string;
}

interface ChatHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    initialSessionId?: string;
}

export default function ChatHistory({ isOpen, onClose, initialSessionId }: ChatHistoryProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Hardcoded user for now
    const userId = 'mukul';

    useEffect(() => {
        if (isOpen) {
            fetchSessions();
            // If initialSessionId is provided, select it automatically
            if (initialSessionId) {
                setSelectedSession(initialSessionId);
            } else {
                setSelectedSession(null); // Reset selection when opening
                setMessages([]); // Clear messages
            }
        }
    }, [isOpen, initialSessionId]);

    // Fetch messages when selectedSession changes
    useEffect(() => {
        if (selectedSession) {
            fetchSessionMessages(selectedSession);
        }
    }, [selectedSession]);

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/chat/sessions?userId=${userId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch sessions');
            }

            const data = await response.json();

            console.log('[ChatHistory] Fetched sessions:', data.sessions);
            setSessions(data.sessions || []);
        } catch (err) {
            console.error('[ChatHistory] Error fetching sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionMessages = async (sessionId: string) => {
        setLoadingMessages(true);

        try {
            const response = await fetch(`/api/chat/history?sessionId=${sessionId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch session messages');
            }

            const data = await response.json();

            console.log('[ChatHistory] Fetched messages for session:', sessionId, data.chats);
            setMessages(data.chats || []);
        } catch (err) {
            console.error('[ChatHistory] Error fetching messages:', err);
            setError(err instanceof Error ? err.message : 'Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    const toggleSession = (sessionId: string) => {
        setSelectedSession(sessionId);
        fetchSessionMessages(sessionId);
    };

    const goBackToList = () => {
        setSelectedSession(null);
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    if (!isOpen) return null;

    const selectedSessionData = sessions.find(s => s.sessionId === selectedSession);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-800 rounded-lg border border-slate-700 shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            {selectedSession && (
                                <button
                                    onClick={goBackToList}
                                    className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Back to sessions"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                                </button>
                            )}
                            <Clock className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold text-white">
                                {selectedSession ? 'Session Details' : 'Chat History'}
                            </h2>
                            {!selectedSession && sessions.length > 0 && (
                                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                                    {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
                                <p className="font-semibold">Error loading chat history</p>
                                <p className="text-sm mt-1">{error}</p>
                                <button
                                    onClick={fetchSessions}
                                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {!loading && !error && sessions.length === 0 && (
                            <div className="text-center py-12">
                                <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No chat history yet</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Start a conversation to see it here
                                </p>
                            </div>
                        )}

                        {/* Session List View */}
                        {!loading && !error && !selectedSession && sessions.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-400 mb-4">
                                    Select a session to view its conversation history
                                </p>
                                {sessions.map((session) => (
                                    <motion.div
                                        key={session.sessionId}
                                        className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden hover:border-purple-500 transition-colors cursor-pointer"
                                        onClick={() => toggleSession(session.sessionId)}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium text-purple-400">
                                                    Session {session.sessionId.substring(0, 8)}...
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                                                {session.firstMessage}...
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-gray-500">
                                                    {formatTimestamp(session.lastTimestamp)}
                                                </p>
                                                <span className="text-xs text-purple-400">
                                                    Click to view →
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Individual Session Details View */}
                        {!loading && !error && selectedSession && selectedSessionData && (
                            <div className="space-y-3">
                                <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-400">
                                                Session: {selectedSessionData.sessionId.substring(0, 16)}...
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {selectedSessionData.messageCount} messages • {formatTimestamp(selectedSessionData.lastTimestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {loadingMessages && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                    </div>
                                )}

                                {!loadingMessages && messages.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        No messages found in this session
                                    </div>
                                )}

                                {!loadingMessages && messages.length > 0 && (
                                    <div className="space-y-3">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {message.role === 'assistant' && (
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                                        <Bot className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                <div
                                                    className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-slate-600 text-white'
                                                    }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>
                                                    <p className="text-xs opacity-70 mt-1">
                                                        {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                                {message.role === 'user' && (
                                                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            {selectedSession
                                ? `Viewing session ${selectedSessionData?.sessionId.substring(0, 8)}...`
                                : sessions.length > 0
                                    ? `${sessions.length} conversation${sessions.length !== 1 ? 's' : ''} available`
                                    : 'No conversations yet'
                            }
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
