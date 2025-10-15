import { useEffect, useState } from 'react'
import { Campaign } from './CampaignsTable'

interface CampaignModalProps {
  isOpen: boolean
  onClose: () => void
  campaign?: Campaign | null
  onSuccess: () => void
}

export default function CampaignModal({ isOpen, onClose, campaign, onSuccess }: CampaignModalProps) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [status, setStatus] = useState<'running' | 'stopped' | 'completed'>('running')
  const [agentId, setAgentId] = useState('emi reminder')
  const [userId, setUserId] = useState('mukul')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title)
      setStartDate(campaign.start_date.slice(0, 10))
      setStatus(campaign.status)
      setAgentId(campaign.agent_id)
      setUserId(campaign.user_id)
    } else {
      setTitle('')
      setStartDate('')
      setStatus('running')
      setAgentId('emi reminder')
      setUserId('mukul')
    }
  }, [campaign, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const method = campaign ? 'PUT' : 'POST'
      const body = campaign
        ? JSON.stringify({ id: campaign._id, title, start_date: startDate, updated_at: new Date().toISOString(), status, agent_id: agentId, user_id: userId })
        : JSON.stringify({ title, start_date: startDate, updated_at: new Date().toISOString(), status, agent_id: agentId, user_id: userId })
      const res = await fetch('/api/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })
      if (res.ok) {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMessage(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('campaign_id', campaign?._id || '')
    try {
      const res = await fetch('/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setUploadMessage(`✓ Uploaded ${data.count} contacts!`)
      } else {
        setUploadMessage(`✗ ${data.error || 'Upload failed'}`)
      }
    } catch {
      setUploadMessage('✗ Upload failed')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141b24] border border-gray-700 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-[#141b24] z-10">
          <h2 className="text-xl font-semibold text-white">{campaign ? 'Edit Campaign' : 'Add Campaign'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
            <span className="text-gray-400 text-xl">✕</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Campaign Title</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., EMI Reminder Campaign Q1 2025" className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select id="status" value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="agentId" className="block text-sm font-medium text-gray-300 mb-2">Agent ID</label>
              <input type="text" id="agentId" value={agentId} onChange={e => setAgentId(e.target.value)} required className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
              <input type="text" id="userId" value={userId} onChange={e => setUserId(e.target.value)} required className="w-full px-4 py-2.5 bg-[#0a0e13] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
          </div>
          
          {campaign && (
            <div className="pt-4 border-t border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                📁 Upload Contacts (CSV only)
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 file:cursor-pointer cursor-pointer"
                disabled={uploading}
              />
              {uploading && <div className="text-gray-400 mt-2 text-sm">⏳ Uploading...</div>}
              {uploadMessage && (
                <div className={`mt-2 text-sm ${uploadMessage.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {uploadMessage}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                CSV must have columns: <code className="bg-gray-800 px-1 rounded">number</code>, <code className="bg-gray-800 px-1 rounded">name</code>, <code className="bg-gray-800 px-1 rounded">description</code>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : campaign ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
