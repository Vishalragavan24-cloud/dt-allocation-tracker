import { useState } from 'react'
import { useAllocations, useAddAllocation } from '../hooks/useAllocations.js'
import { useTeamMembers } from '../hooks/useTeamMembers.js'
import { defaultAllocation } from '../hooks/useAllocations.js'
import AllocationTable from '../components/AllocationTable.jsx'
import AllocationAlerts from '../components/AllocationAlerts.jsx'
import InstructionsPanel from '../components/InstructionsPanel.jsx'
import Spinner from '../components/Spinner.jsx'
import Toast from '../components/Toast.jsx'
import { exportToCSV } from '../lib/export.js'
import { PROJECT_TYPES, STATUS_OPTIONS } from '../lib/constants.js'

export default function AllocationTracker() {
  const [memberFilter, setMemberFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState(null)

  const { data: members = [], isLoading: loadingMembers } = useTeamMembers()
  const { data: allocations = [], isLoading: loadingAllocs, isError } = useAllocations()
  const addAlloc = useAddAllocation()

  const showToast = (msg, type = 'error') => setToast({ msg, type })

  const filtered = allocations.filter(a => {
    if (memberFilter && a.team_member_id !== parseInt(memberFilter)) return false
    if (projectFilter && a.project_type !== projectFilter) return false
    if (statusFilter && a.status !== statusFilter) return false
    return true
  })

  function addRow() {
    const targetId = memberFilter ? parseInt(memberFilter) : members[0]?.id
    if (!targetId) { showToast('Please add a team member first.', 'info'); return }
    addAlloc.mutate(defaultAllocation(targetId), {
      onSuccess: () => showToast('Row added successfully.', 'success'),
      onError: () => showToast('Failed to add row.'),
    })
  }

  if (loadingMembers || loadingAllocs) return <Spinner size="lg" />
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-24 text-ibm-red">
      <p className="text-lg font-semibold">Cannot connect to server.</p>
      <p className="text-sm mt-1 text-ibm-gray-50">Make sure the backend is running at port 4000.</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-ibm-text">RPA Resource Allocation Tracker</h1>
          <p className="text-sm text-ibm-gray-50 mt-0.5">
            {allocations.length} records · auto-syncs every 10s
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary text-xs" onClick={() => exportToCSV(filtered)}>
            ↓ Export CSV
          </button>
          <button className="btn-primary text-xs" onClick={addRow} disabled={addAlloc.isPending}>
            {addAlloc.isPending ? 'Adding...' : '+ Add Row'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <InstructionsPanel />

      {/* Filters */}
      <div className="card mb-4 px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-ibm-gray-50 uppercase tracking-wide">Filters:</span>
        <select className="input w-44 text-sm" value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
          <option value="">All Members</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="input w-40 text-sm" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
          <option value="">All Project Types</option>
          {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input w-36 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(s => s !== '-').map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(memberFilter || projectFilter || statusFilter) && (
          <button className="text-xs text-ibm-blue hover:underline" onClick={() => { setMemberFilter(''); setProjectFilter(''); setStatusFilter('') }}>
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-ibm-gray-50">{filtered.length} rows shown</span>
      </div>

      {/* Capacity alerts */}
      {members.length > 0 && (
        <AllocationAlerts allocations={allocations} members={members} />
      )}

      {/* Main table */}
      <AllocationTable
        allocations={filtered}
        members={members}
        filterMemberId={memberFilter ? parseInt(memberFilter) : null}
        toast={showToast}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
