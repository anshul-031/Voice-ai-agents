'use client'

import { Copy, Edit2, ExternalLink, Phone, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PhoneNumber {
    id: string
    phoneNumber: string
    provider: string
    displayName: string
    exotelConfig?: {
        sid: string
        domain: string
        region: string
    }
    linkedAgentId?: string
    webhookUrl?: string
    websocketUrl?: string
    status: string
    lastUsed?: string
    createdAt: string
}

interface PhoneNumbersTableProps {
    onAddPhone: () => void
    onEditPhone: (phone: PhoneNumber) => void
}

export default function PhoneNumbersTable({ onAddPhone, onEditPhone }: PhoneNumbersTableProps) {
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

    useEffect(() => {
        fetchPhoneNumbers()
    }, [])

    const fetchPhoneNumbers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/phone-numbers?userId=mukul')
            if (res.ok) {
                const data = await res.json()
                setPhoneNumbers(data.phoneNumbers || [])
            }
        } catch (error) {
            console.error('Error fetching phone numbers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this phone number?')) return

        try {
            const res = await fetch(`/api/phone-numbers?id=${id}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                fetchPhoneNumbers()
            } else {
                alert('Failed to delete phone number')
            }
        } catch (error) {
            console.error('Error deleting phone number:', error)
            alert('Failed to delete phone number')
        }
    }

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text)
        setCopiedUrl(`${type}-${text}`)
        setTimeout(() => setCopiedUrl(null), 2000)
    }

    return (
        <div className="flex-1 bg-gradient-to-br from-[#0a0e13] via-[#0d1117] to-[#0a0e13] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-800/50 backdrop-blur-sm bg-[#0a0e13]/80 sticky top-0 z-10">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Phone Numbers
                            </h1>
                            <p className="text-sm text-gray-400">Manage your telephony service integrations</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchPhoneNumbers}
                                className="flex items-center gap-2 px-4 py-2 bg-[#141b24] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 hover:scale-105"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="text-sm font-medium">Refresh</span>
                            </button>
                            <button
                                onClick={onAddPhone}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-emerald-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm font-medium">Import Phone Number</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-8 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
                            <Phone className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-gray-400 mt-4 text-sm">Loading phone numbers...</p>
                    </div>
                ) : phoneNumbers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mb-4">
                            <Phone className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No phone numbers yet</h3>
                        <p className="text-gray-400 text-sm text-center max-w-md mb-4">
                            Import phone numbers from Exotel or other providers to enable telephony services
                        </p>
                        <button
                            onClick={onAddPhone}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Import Phone Number</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {phoneNumbers.map((phone) => (
                            <div
                                key={phone.id}
                                className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                            <Phone className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{phone.displayName}</h3>
                                            <p className="text-sm text-gray-400">{phone.phoneNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                                            phone.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                        }`}>
                                            {phone.status}
                                        </span>
                                        <button
                                            onClick={() => onEditPhone(phone)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(phone.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Provider</span>
                                        <span className="text-white font-medium capitalize">{phone.provider}</span>
                                    </div>
                                    {phone.exotelConfig && (
                                        <>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">SID</span>
                                                <span className="text-white font-mono text-xs">{phone.exotelConfig.sid}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">Region</span>
                                                <span className="text-white uppercase">{phone.exotelConfig.region}</span>
                                            </div>
                                        </>
                                    )}
                                    {phone.linkedAgentId && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Linked Agent</span>
                                            <span className="text-emerald-400 flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" />
                                                Agent
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Webhook URLs */}
                                <div className="border-t border-gray-700/50 pt-4 space-y-2">
                                    <div className="text-xs font-medium text-gray-400 mb-2">Configure in Exotel Portal:</div>
                                    
                                    {phone.webhookUrl && (
                                        <div className="bg-[#0a0e13] rounded-lg p-3 border border-gray-700/50">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-gray-400">HTTPS Webhook</span>
                                                <button
                                                    onClick={() => copyToClipboard(phone.webhookUrl!, 'webhook')}
                                                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    {copiedUrl === `webhook-${phone.webhookUrl}` ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            <code className="text-xs text-gray-300 break-all">{phone.webhookUrl}</code>
                                        </div>
                                    )}

                                    {phone.websocketUrl && (
                                        <div className="bg-[#0a0e13] rounded-lg p-3 border border-gray-700/50">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-gray-400">WebSocket URL</span>
                                                <button
                                                    onClick={() => copyToClipboard(phone.websocketUrl!, 'websocket')}
                                                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    {copiedUrl === `websocket-${phone.websocketUrl}` ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            <code className="text-xs text-gray-300 break-all">{phone.websocketUrl}</code>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
