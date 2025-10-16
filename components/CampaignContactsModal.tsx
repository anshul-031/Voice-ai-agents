import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Contact {
  _id: string
  number: string
  name: string
  description: string
  call_done: string
  call_status?: 'pending' | 'initiated' | 'completed' | 'failed'
  call_sid?: string
  call_error?: string
}

interface CampaignContactsModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string | null
}

export default function CampaignContactsModal({ isOpen, onClose, campaignId }: CampaignContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && campaignId) {
      setLoading(true)
      fetch(`/api/campaign-contacts?campaign_id=${campaignId}`)
        .then(res => res.json())
        .then(data => setContacts(data.data || []))
        .catch(() => setContacts([]))
        .finally(() => setLoading(false))
    }
  }, [isOpen, campaignId])

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    try {
      const res = await fetch(`/api/campaign-contacts?id=${contactId}`, { method: 'DELETE' })
      if (res.ok) {
        setContacts(contacts.filter(c => c._id !== contactId))
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141b24] border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Campaign Contacts</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
            <span className="text-gray-400 text-xl">✕</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-gray-400 text-center py-12">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">No contacts found for this campaign.</div>
              <div className="text-sm text-gray-500">Upload a CSV file in Edit mode to add contacts.</div>
            </div>
          ) : (
            <div className="bg-[#0f1419] rounded-xl border border-gray-800/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-[#0a0e13] border-b border-gray-800/50">
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Number</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Description</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Call Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Call Done</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/30">
                    {contacts.map((contact, index) => (
                      <tr key={contact._id} className={`${index % 2 === 0 ? 'bg-[#0f1419]' : 'bg-[#11161d]'} hover:bg-[#1a2332]/40 transition-colors`}>
                        <td className="px-6 py-4 text-sm text-white font-mono">{contact.number}</td>
                        <td className="px-6 py-4 text-sm text-white">{contact.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-300 max-w-md truncate" title={contact.description}>
                          {contact.description}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contact.call_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            contact.call_status === 'initiated' ? 'bg-blue-500/10 text-blue-400' :
                            contact.call_status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {contact.call_status === 'completed' ? '✓ Completed' :
                             contact.call_status === 'initiated' ? '⟳ In Progress' :
                             contact.call_status === 'failed' ? '✕ Failed' :
                             '○ Pending'}
                          </span>
                          {contact.call_error && (
                            <div className="text-xs text-red-400 mt-1" title={contact.call_error}>
                              {contact.call_error.substring(0, 30)}...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contact.call_done === 'yes' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
                          }`}>
                            {contact.call_done === 'yes' ? '✓ Yes' : '○ No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDelete(contact._id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-[#0a0e13] border-t border-gray-800/50 text-sm text-gray-400">
                Total contacts: {contacts.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
