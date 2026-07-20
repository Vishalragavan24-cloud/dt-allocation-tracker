import { useState } from 'react'
import { useAddTeamMember } from '../hooks/useTeamMembers.js'

export default function AddMemberModal({ onClose }) {
  const [name, setName] = useState('')
  const [band, setBand] = useState('')
  const { mutate, isPending, error } = useAddTeamMember()

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    mutate({ name: name.trim(), band: band.trim() }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-ibm-text mb-4">Add Team Member</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Jane Smith"
              required
            />
          </div>
          <div>
            <label className="label">Band</label>
            <input
              className="input"
              value={band}
              onChange={e => setBand(e.target.value)}
              placeholder="e.g. 6A, 6B, 7A"
            />
          </div>
          {error && (
            <p className="text-ibm-red text-sm">
              {error.response?.data?.error || 'Failed to add member.'}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
