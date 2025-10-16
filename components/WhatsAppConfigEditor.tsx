/**
 * WhatsApp Configuration Component
 * Allows users to configure WhatsApp Business integration for their voice agent
 */

'use client';

import { WhatsAppConfig } from '@/types';
import { CheckCircle, Info, Loader2, MessageSquare, XCircle } from 'lucide-react';
import { useState } from 'react';

interface WhatsAppConfigEditorProps {
    agentId: string;
    initialConfig?: WhatsAppConfig;
    onSave?: (config: WhatsAppConfig) => void;
}

export default function WhatsAppConfigEditor({
    agentId,
    initialConfig,
    onSave,
}: WhatsAppConfigEditorProps) {
    const [config, setConfig] = useState<WhatsAppConfig>(initialConfig || {
        enabled: false,
        appId: '',
        appSecret: '',
        businessId: '',
        accessToken: '',
        phoneNumber: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showConfig, setShowConfig] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        setTestResult(null);

        try {
            const response = await fetch(`/api/voice-agents?id=${agentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsappConfig: config,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save WhatsApp configuration');
            }

            const data = await response.json();
            
            if (onSave) {
                onSave(config);
            }

            alert('WhatsApp configuration saved successfully!');
        } catch (error) {
            console.error('Error saving WhatsApp config:', error);
            alert('Failed to save WhatsApp configuration. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        if (!config.accessToken || !config.phoneNumber) {
            alert('Please enter Access Token and Phone Number ID to test');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            // For testing, we'll send to the same phone number
            // In production, you might want to add a test phone number field
            const testPhone = prompt('Enter a phone number to send test message (with country code, e.g., +919876543210):');
            
            if (!testPhone) {
                setIsTesting(false);
                return;
            }

            const response = await fetch('/api/whatsapp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: config.accessToken,
                    phoneNumberId: config.phoneNumber,
                    recipientPhone: testPhone,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setTestResult({
                    success: true,
                    message: 'Test message "hi check" sent successfully! Check your WhatsApp.',
                });
            } else {
                setTestResult({
                    success: false,
                    message: `Test failed: ${data.error || 'Unknown error'}. ${data.details ? JSON.stringify(data.details) : ''}`,
                });
            }
        } catch (error) {
            console.error('Error testing WhatsApp:', error);
            setTestResult({
                success: false,
                message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        } finally {
            setIsTesting(false);
        }
    };

    const webhookUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/whatsapp/webhook/${agentId}`
        : '';

    return (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">WhatsApp Integration</h2>
                        <p className="text-sm text-white/60">Connect your Meta Business account</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
                >
                    {showConfig ? 'Hide' : 'Configure'}
                </button>
            </div>

            {/* Configuration Form */}
            {showConfig && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                        <div>
                            <label className="text-sm font-medium text-white">Enable WhatsApp</label>
                            <p className="text-xs text-white/60 mt-1">
                                Activate WhatsApp chat for this agent
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {/* Info Box */}
                    <div className="flex gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-200">
                            <p className="font-medium mb-1">How to get WhatsApp credentials:</p>
                            <ol className="list-decimal list-inside space-y-1 text-blue-200/80">
                                <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-100">Meta for Developers</a></li>
                                <li>Create or select your app</li>
                                <li>Add WhatsApp product to your app</li>
                                <li>Get your credentials from the WhatsApp dashboard</li>
                            </ol>
                        </div>
                    </div>

                    {/* App ID */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            App ID
                        </label>
                        <input
                            type="text"
                            value={config.appId || ''}
                            onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                            placeholder="Enter your Meta App ID"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                        />
                    </div>

                    {/* App Secret */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            App Secret
                        </label>
                        <input
                            type="password"
                            value={config.appSecret || ''}
                            onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                            placeholder="Enter your Meta App Secret"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                        />
                    </div>

                    {/* Business ID */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Business Account ID
                        </label>
                        <input
                            type="text"
                            value={config.businessId || ''}
                            onChange={(e) => setConfig({ ...config, businessId: e.target.value })}
                            placeholder="Enter your WhatsApp Business Account ID"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                        />
                    </div>

                    {/* Access Token */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Access Token
                        </label>
                        <input
                            type="password"
                            value={config.accessToken || ''}
                            onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                            placeholder="Enter your WhatsApp Access Token"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                        />
                    </div>

                    {/* Phone Number ID */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Phone Number ID
                        </label>
                        <input
                            type="text"
                            value={config.phoneNumber || ''}
                            onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                            placeholder="Enter your WhatsApp Phone Number ID"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                        />
                    </div>

                    {/* Webhook URL (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Webhook URL (copy this to Meta dashboard)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={webhookUrl}
                                readOnly
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/60 focus:outline-none"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(webhookUrl);
                                    alert('Webhook URL copied to clipboard!');
                                }}
                                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                            Verify Token: <code className="px-2 py-0.5 bg-white/10 rounded">pelocal_verify_token_2025</code>
                        </p>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`flex gap-3 p-4 rounded-lg ${testResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            {testResult.success ? (
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            )}
                            <p className={`text-sm ${testResult.success ? 'text-green-200' : 'text-red-200'}`}>
                                {testResult.message}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleTest}
                            disabled={isTesting || !config.accessToken || !config.phoneNumber}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                        >
                            {isTesting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <MessageSquare className="w-4 h-4" />
                                    Send Test Message
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Configuration'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Status Indicator (when collapsed) */}
            {!showConfig && (
                <div className="flex items-center gap-2 text-sm">
                    {config.enabled ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">WhatsApp Enabled</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">WhatsApp Disabled</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
