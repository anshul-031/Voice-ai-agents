'use client'

/* eslint-disable no-console */

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface WhatsAppNumberModalProps {
    isOpen: boolean
    onClose: () => void
    whatsAppNumber?: any
    onSuccess: () => void
}

export default function WhatsAppNumberModal({ isOpen, onClose, whatsAppNumber, onSuccess }: WhatsAppNumberModalProps) {
    const [formData, setFormData] = useState({
        phoneNumber: '',
        displayName: '',
        appId: '',
        appSecret: '',
        businessId: '',
        accessToken: '',
        linkedAgentId: '',
    })
    const [loading, setLoading] = useState(false)
    const [agents, setAgents] = useState<any[]>([])
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/meta-webhook`
        : 'https://your-domain.com/api/meta-webhook'

    useEffect(() => {
        if (!isOpen) return

        fetch('/api/voice-agents?userId=mukul')
            .then(res => res.json())
            .then(data => setAgents(data.agents || []))
            .catch(() => setAgents([]))

        if (whatsAppNumber) {
            setFormData({
                phoneNumber: whatsAppNumber.phoneNumber || '',
                displayName: whatsAppNumber.displayName || '',
                appId: whatsAppNumber.appId || '',
                appSecret: '',
                businessId: whatsAppNumber.businessId || '',
                accessToken: '',
                linkedAgentId: whatsAppNumber.linkedAgentId || '',
            })
        } else {
            setFormData({
                phoneNumber: '',
                displayName: '',
                appId: '',
                appSecret: '',
                businessId: '',
                accessToken: '',
                linkedAgentId: '',
            })
        }
    }, [isOpen, whatsAppNumber])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload: any = {
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                appId: formData.appId,
                businessId: formData.businessId,
                linkedAgentId: formData.linkedAgentId || undefined,
            }

            if (!whatsAppNumber) {
                payload.appSecret = formData.appSecret
                payload.accessToken = formData.accessToken
            } else {
                if (formData.appSecret) payload.appSecret = formData.appSecret
                if (formData.accessToken) payload.accessToken = formData.accessToken
            }

            const method = whatsAppNumber ? 'PUT' : 'POST'
            const body = whatsAppNumber ? { ...payload, id: whatsAppNumber.id } : payload

            const res = await fetch('/api/whatsapp-numbers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                onSuccess()
                onClose()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to save WhatsApp number')
            }
        } catch (error) {
            console.error('Error saving WhatsApp number:', error)
            alert('Failed to save WhatsApp number')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#141b24] to-[#1a2332] border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">
                        {whatsAppNumber ? 'Edit WhatsApp Number' : 'Connect WhatsApp Number'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    WhatsApp Number *
                                </label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="919876543210"
                                    required
                                    disabled={!!whatsAppNumber}
                                    className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="Support Chat"
                                    required
                                    className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    App ID *
                                </label>
                                <input
                                    type="text"
                                    value={formData.appId}
                                    onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                                    placeholder="Enter Meta App ID"
                                    required
                                    className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    App Secret *
                                </label>
                                <input
                                    type="password"
                                    value={formData.appSecret}
                                    onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                                    placeholder={whatsAppNumber ? 'Leave blank to keep existing secret' : 'Enter Meta App Secret'}
                                    required={!whatsAppNumber}
                                    className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Business (WABA) ID *
                                </label>
                                <input
                                    type="text"
                                    value={formData.businessId}
                                    onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                                    placeholder="Enter WhatsApp Business Account ID"
                                    required
                                    className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Access Token *
                                </label>
                                <input
                                    type="password"
                                    value={formData.accessToken}
                                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                    placeholder={whatsAppNumber ? 'Leave blank to keep existing token' : 'Enter long-lived access token'}
                                    required={!whatsAppNumber}
                                    className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Link to Agent (Optional)
                            </label>
                            <select
                                value={formData.linkedAgentId}
                                onChange={(e) => setFormData({ ...formData, linkedAgentId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">-- No Agent Linked --</option>
                                {agents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Responses will be generated using the selected voice agent pipeline.
                            </p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200">
                            <p>
                                After saving, we will send a test message "hi check" from your business account to confirm connectivity. Configure the webhook URL in Meta to {webhookUrl}.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : whatsAppNumber ? 'Update WhatsApp Number' : 'Connect WhatsApp Number'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
