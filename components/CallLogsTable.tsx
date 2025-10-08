'use client'

import { useState, useEffect } from 'react'
import { SlidersHorizontal, ExternalLink } from 'lucide-react'

interface ChatSession {
    sessionId: string
    userId: string
    messageCount: number
    firstMessage: string
    lastMessage: string
    firstTimestamp: string
    lastTimestamp: string
}

interface CallLogsTableProps {
    onViewCallDetails?: (sessionId: string) => void
}

export default function CallLogsTable({ onViewCallDetails }: CallLogsTableProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/chat/sessions?userId=mukul')
            if (res.ok) {
                const data = await res.json()
                // API returns { success, userId, sessions, count }
                setSessions(data.sessions || [])
            } else {
                setSessions([])
            }
        } catch (error) {
            console.error('Error fetching sessions:', error)
            setSessions([])
        } finally {
            setLoading(false)
        }
    }

    const formatDuration = (start: string, end: string) => {
        const startTime = new Date(start).getTime()
        const endTime = new Date(end).getTime()
        const durationMs = endTime - startTime
        const seconds = Math.floor(durationMs / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60

        if (minutes > 0) {
            return `${minutes}m`
        } else {
            return `${remainingSeconds}s`
        }
    }

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
    }

    const calculateCost = (messageCount: number) => {
        // Mock cost calculation: $0.002 per message
        const cost = messageCount * 0.002
        return `$${cost.toFixed(4)}`
    }

    return (
        <div className="flex-1 bg-[#0a0e13] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-800 px-8 py-6">
                <h1 className="text-2xl font-semibold text-white">Call Logs</h1>
            </div>

            {/* Filters Bar */}
            <div className="px-8 py-4 border-b border-gray-800">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#141b24] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-8 py-6">
                {loading ? (
                    <div className="text-gray-400 text-center py-8">Loading call logs...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">No call logs found.</div>
                ) : (
                    <div className="bg-[#141b24] rounded-lg border border-gray-800 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr,0.8fr,1fr,1.8fr] gap-4 px-6 py-3 bg-[#0f1419] border-b border-gray-800">
                            <div className="text-sm font-medium text-gray-400">ID</div>
                            <div className="text-sm font-medium text-gray-400">Agent</div>
                            <div className="text-sm font-medium text-gray-400">Phone #</div>
                            <div className="text-sm font-medium text-gray-400">Status</div>
                            <div className="text-sm font-medium text-gray-400">Cost</div>
                            <div className="text-sm font-medium text-gray-400">Duration</div>
                            <div className="text-sm font-medium text-gray-400">Timestamp</div>
                        </div>

                        {/* Table Rows */}
                        {sessions.map((session) => (
                            <div
                                key={session.sessionId}
                                onClick={() => onViewCallDetails?.(session.sessionId)}
                                className="grid grid-cols-[2fr,1.5fr,1fr,1fr,0.8fr,1fr,1.8fr] gap-4 px-6 py-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/30 transition-colors cursor-pointer"
                            >
                                {/* ID */}
                                <div className="text-sm text-gray-300 font-mono truncate">
                                    {session.sessionId}
                                </div>

                                {/* Agent */}
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <span>EMI Reminder</span>
                                    <ExternalLink className="w-3 h-3 text-gray-500" />
                                </div>

                                {/* Phone # */}
                                <div className="text-sm text-gray-400">-</div>

                                {/* Status */}
                                <div className="flex items-center">
                                    <span className="px-2.5 py-1 rounded-md bg-gray-700 text-gray-300 text-xs">
                                        user-ended
                                    </span>
                                </div>

                                {/* Cost */}
                                <div className="text-sm text-gray-300">
                                    {calculateCost(session.messageCount)}
                                </div>

                                {/* Duration */}
                                <div className="text-sm text-gray-300">
                                    {formatDuration(session.firstTimestamp, session.lastTimestamp)}
                                </div>

                                {/* Timestamp */}
                                <div className="text-sm text-gray-300">
                                    {formatTimestamp(session.lastTimestamp)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
