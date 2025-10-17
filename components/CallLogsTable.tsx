'use client'

import {
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock,
    DollarSign,
    Download,
    ExternalLink,
    Filter,
    PhoneCall,
    RefreshCw,
    Search
} from 'lucide-react'
import { useEffect, useState } from 'react'

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
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'ongoing'>('all')
    const [showFilters, setShowFilters] = useState(false)

    // ...existing code...

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

    const calculateCost = (messageCount: number) => {
        // Mock cost calculation: $0.002 per message
        const cost = messageCount * 0.002
        return `$${cost.toFixed(4)}`
    }

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.sessionId.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || statusFilter === 'completed' // Mock: all sessions are completed
        return matchesSearch && matchesStatus
    })

    const totalCalls = filteredSessions.length
    const totalCost = filteredSessions.reduce((sum, s) => sum + (s.messageCount * 0.002), 0)
    const avgDuration = filteredSessions.length > 0
        ? filteredSessions.reduce((sum, s) => {
            const duration = new Date(s.lastTimestamp).getTime() - new Date(s.firstTimestamp).getTime()
            return sum + duration
        }, 0) / filteredSessions.length / 1000 / 60
        : 0

    return (
        <div className="flex-1 bg-gradient-to-br from-[#0a0e13] via-[#0d1117] to-[#0a0e13] flex flex-col">
            {/* Enhanced Header with Stats */}
            <div className="border-b border-gray-800/50 backdrop-blur-sm bg-[#0a0e13]/80 sticky top-0 z-10">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Call Logs
                            </h1>
                            <p className="text-sm text-gray-400">Monitor and analyze all voice interactions</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchSessions}
                                className="flex items-center gap-2 px-4 py-2 bg-[#141b24] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 hover:scale-105"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="text-sm font-medium">Refresh</span>
                            </button>
                            <button
                                onClick={() => { /* TODO: implement export handler */ }}
                                className="flex items-center gap-2 px-4 py-2 bg-[#141b24] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 hover:scale-105"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-sm font-medium">Export</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800/50 rounded-xl p-4 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Calls</span>
                                <PhoneCall className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">{totalCalls}</div>
                            <div className="text-xs text-gray-500 mt-1">All time</div>
                        </div>

                        <div className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800/50 rounded-xl p-4 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Cost</span>
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</div>
                            <div className="text-xs text-gray-500 mt-1">Accumulated</div>
                        </div>

                        <div className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800/50 rounded-xl p-4 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Duration</span>
                                <Clock className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">{avgDuration.toFixed(1)}m</div>
                            <div className="text-xs text-gray-500 mt-1">Per call</div>
                        </div>

                        <div className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800/50 rounded-xl p-4 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Success Rate</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">98.5%</div>
                            <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters Bar */}
                <div className="px-8 py-4 border-t border-gray-800/50">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by Session ID, Agent, or Phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${showFilters
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'bg-[#141b24] border-gray-700 text-gray-300 hover:bg-gray-800'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filters</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>

                            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#141b24] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-all">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">Date Range</span>
                            </button>
                        </div>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-[#141b24] border border-gray-800 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-[#0a0e13] border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="failed">Failed</option>
                                        <option value="ongoing">Ongoing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Agent</label>
                                    <select className="w-full px-3 py-2 bg-[#0a0e13] border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-emerald-500">
                                        <option value="all">All Agents</option>
                                        <option value="emi">EMI Reminder</option>
                                        <option value="support">Customer Support</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Duration</label>
                                    <select className="w-full px-3 py-2 bg-[#0a0e13] border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-emerald-500">
                                        <option value="all">All Durations</option>
                                        <option value="short">&lt; 1 min</option>
                                        <option value="medium">1-5 min</option>
                                        <option value="long">&gt; 5 min</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Table */}
            {/* Enhanced Table */}
            <div className="flex-1 overflow-auto px-8 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
                            <PhoneCall className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-gray-400 mt-4 text-sm">Loading call logs...</p>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mb-4">
                            <PhoneCall className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No call logs found.</h3>
                        <p className="text-gray-400 text-sm text-center max-w-md">
                            {searchQuery ? 'Try adjusting your search or filters' : 'Start making calls to see them appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-[#0f1419] rounded-xl border border-gray-800/50 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-8 text-sm font-medium text-gray-400 bg-[#0a0e13] border-b border-gray-800/50">
                            <div className="px-6 py-3 border-r border-gray-800/30">ID</div>
                            <div className="px-6 py-3 border-r border-gray-800/30">Agent</div>
                            <div className="px-6 py-3 border-r border-gray-800/30">Phone #</div>
                            <div className="px-6 py-3 border-r border-gray-800/30">Status</div>
                            <div className="px-6 py-3 border-r border-gray-800/30">Cost</div>
                            <div className="px-6 py-3 border-r border-gray-800/30">Duration</div>
                            <div className="px-6 py-3 border-r border-gray-800/30">Timestamp</div>
                            <div className="px-6 py-3">Actions</div>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-gray-800/30">
                            {filteredSessions.map((session) => (
                                <div
                                    key={session.sessionId}
                                    onClick={() => onViewCallDetails?.(session.sessionId)}
                                    className="grid grid-cols-8 px-6 py-4 border-b border-gray-800/30 even:bg-[#11161d] hover:bg-[#1a2332]/40 transition-all duration-150 cursor-pointer group"
                                >
                                    {/* ID */}
                                    <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                                        <span className="text-sm text-gray-300 font-mono">{session.sessionId}</span>
                                    </div>

                                    {/* Agent */}
                                    <div className="flex items-center gap-2 border-r border-gray-800/30 last:border-r-0">
                                        <span className="text-sm text-gray-300">EMI Reminder</span>
                                        <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                                        <span className="text-sm text-gray-400">-</span>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                                        <span className="px-2.5 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-md border border-gray-700/50">
                                            user-ended
                                        </span>
                                    </div>

                                    {/* Cost */}
                                    <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                                        <span className="text-sm text-gray-300">{calculateCost(session.messageCount)}</span>
                                    </div>

                                    {/* Duration */}
                                    <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                                        <span className="text-sm text-gray-300">
                                            {formatDuration(session.firstTimestamp, session.lastTimestamp)}
                                        </span>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                                        <span className="text-sm text-gray-300">
                                            {new Date(session.lastTimestamp).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })},{' '}
                                            {new Date(session.lastTimestamp).toLocaleTimeString('en-GB', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onViewCallDetails?.(session.sessionId)
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 border-t border-gray-800/50 bg-[#0f1419]">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-400">
                                    Showing <span className="text-white font-medium">{filteredSessions.length}</span> of{' '}
                                    <span className="text-white font-medium">{sessions.length}</span> calls
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 bg-[#141b24] border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        Previous
                                    </button>
                                    <button className="px-3 py-1.5 bg-emerald-500 border border-emerald-500 rounded-lg text-sm text-white hover:bg-emerald-600 transition-all">
                                        1
                                    </button>
                                    <button className="px-3 py-1.5 bg-[#141b24] border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                                        2
                                    </button>
                                    <button className="px-3 py-1.5 bg-[#141b24] border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Add animation keyframes */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}
