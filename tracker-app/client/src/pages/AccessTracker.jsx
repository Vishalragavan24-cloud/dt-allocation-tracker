import { useState } from 'react'
import { useAccess, useUpdateAccess } from '../hooks/useAccess.js'
import { useTeamMembers } from '../hooks/useTeamMembers.js'
import Spinner from '../components/Spinner.jsx'
import Toast from '../components/Toast.jsx'

function AccessCard({ record, memberId, onSave }) {
  const [form, setForm] = useState({
    current_access: record?.current_access || '',
    access_type: record?.access_type || '',
    required_access: record?.required_access || '',
  })
  const [dirty, setDirty] = useState(false)

  function change(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-ibm-text">{record?.team_member_name || 'Unknown'}</h3>
          <span className="text-xs text-ibm-gray-50">Band: {record?.band || '—'}</span>
        </div>
        {dirty && (
          <button className="btn-primary text-xs" onClick={() => { onSave(memberId, form); setDirty(false) }}>
            Save Changes
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Current Access</label>
          <textarea
            className="input h-28 text-xs resize-y font-mono"
            value={form.current_access}
            onChange={e => change('current_access', e.target.value)}
            placeholder="List all current tool access..."
          />
        </div>
        <div>
          <label className="label">Access Type / Notes</label>
          <textarea
            className="input h-20 text-xs resize-y font-mono"
            value={form.access_type}
            onChange={e => change('access_type', e.target.value)}
            placeholder="Development, test, production access details..."
          />
        </div>
        <div>
          <label className="label">Required Access</label>
          <textarea
            className="input h-16 text-xs resize-y font-mono"
            value={form.required_access}
            onChange={e => change('required_access', e.target.value)}
            placeholder="Any pending / required access..."
          />
        </div>
      </div>
    </div>
  )
}

export default function AccessTracker() {
  const { data: access = [], isLoading } = useAccess()
  const { data: members = [] } = useTeamMembers()
  const updateAccess = useUpdateAccess()
  const [toast, setToast] = useState(null)

  function save(memberId, form) {
    updateAccess.mutate({ memberId, ...form }, {
      onSuccess: () => setToast({ msg: 'Access record saved.', type: 'success' }),
      onError: () => setToast({ msg: 'Failed to save.', type: 'error' }),
    })
  }

  if (isLoading) return <Spinner size="lg" />

  // Ensure every member has a card, even if no access record exists yet
  const memberAccess = members.map(member => ({
    member,
    record: access.find(a => a.team_member_id === member.id) || { team_member_name: member.name, band: member.band },
  }))

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ibm-text">Access Tracker</h1>
        <p className="text-sm text-ibm-gray-50 mt-0.5">Tool access details for each team member. Click Save Changes after editing.</p>
      </div>

      {memberAccess.length === 0 && (
        <div className="card p-8 text-center text-ibm-gray-50">
          <p>No team members added yet. Use the <strong>+ Add Member</strong> button to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {memberAccess.map(({ member, record }) => (
          <AccessCard key={member.id} record={record} memberId={member.id} onSave={save} />
        ))}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
