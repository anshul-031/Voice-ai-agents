export interface Campaign {
  _id?: string
  title: string
  start_date: string
  updated_at: string
  status: 'running' | 'stopped' | 'completed'
  agent_id: string
  user_id: string
  total_contacts?: number
  calls_completed?: number
  calls_failed?: number
  started_at?: string
}

interface CampaignsTableProps {
  onEditCampaign: (campaign: Campaign) => void
  onAddCampaign: () => void
  onViewCampaign: (campaign: Campaign) => void
  onStartCampaign: (campaign: Campaign) => void
  campaigns: Campaign[]
}

export default function CampaignsTable({ onEditCampaign, onAddCampaign, onViewCampaign, onStartCampaign, campaigns }: CampaignsTableProps) {
  return (
    <div className="flex-1 bg-[#0a0e13] flex flex-col">
      <div className="border-b border-gray-800 px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Campaigns</h1>
        <button
          onClick={onAddCampaign}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          <span>+ Add Campaign</span>
        </button>
      </div>
      <div className="flex-1 overflow-auto px-8 py-6">
        {campaigns.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No campaigns yet. Click "Add Campaign" to create one.</div>
        ) : (
          <div className="bg-[#0f1419] rounded-xl border border-gray-800/50 overflow-hidden">
            <div className="grid grid-cols-6 text-sm font-medium text-gray-400 bg-[#0a0e13] border-b border-gray-800/50">
              <div className="px-6 py-3 border-r border-gray-800/30">Campaign Title</div>
              <div className="px-6 py-3 border-r border-gray-800/30">Status</div>
              <div className="px-6 py-3 border-r border-gray-800/30">Progress</div>
              <div className="px-6 py-3 border-r border-gray-800/30">Start Date</div>
              <div className="px-6 py-3 border-r border-gray-800/30">Updated At</div>
              <div className="px-6 py-3">Actions</div>
            </div>
            <div className="divide-y divide-gray-800/30">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="grid grid-cols-6 px-6 py-4 border-b border-gray-800/30 even:bg-[#11161d] hover:bg-[#1a2332]/40 transition-all duration-150">
                  <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                    <span className="text-white font-medium truncate">{campaign.title}</span>
                  </div>
                  <div className="flex items-center border-r border-gray-800/30 last:border-r-0">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      campaign.status === 'running' ? 'bg-emerald-500/10 text-emerald-400' :
                      campaign.status === 'stopped' ? 'bg-red-500/10 text-red-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        campaign.status === 'running' ? 'bg-emerald-400' :
                        campaign.status === 'stopped' ? 'bg-red-400' :
                        'bg-blue-400'
                      }`}></span>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex items-center border-r border-gray-800/30 last:border-r-0 text-gray-300">
                    {campaign.total_contacts ? (
                      <span className="text-sm">
                        {campaign.calls_completed || 0}/{campaign.total_contacts}
                        {campaign.calls_failed ? <span className="text-red-400 ml-1">({campaign.calls_failed} failed)</span> : ''}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                  <div className="flex items-center border-r border-gray-800/30 last:border-r-0 text-gray-300">
                    {new Date(campaign.start_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center border-r border-gray-800/30 last:border-r-0 text-gray-300">
                    {campaign.updated_at ? new Date(campaign.updated_at).toLocaleDateString() : '-'}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewCampaign(campaign)}
                      className="px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                      title="View Contacts"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEditCampaign(campaign)}
                      className="px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                      title="Edit Campaign"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onStartCampaign(campaign)}
                      disabled={campaign.status === 'running' && !!campaign.started_at}
                      className="px-3 py-1.5 text-sm text-purple-400 hover:bg-purple-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={campaign.status === 'running' && campaign.started_at ? 'Campaign is running' : 'Start Campaign'}
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
