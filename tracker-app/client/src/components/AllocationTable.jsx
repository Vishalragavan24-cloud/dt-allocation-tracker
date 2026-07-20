import { useState } from 'react'
import { MONTHS, MONTH_SHORT, PROJECT_TYPES, STATUS_OPTIONS } from '../lib/constants.js'
import { useUpdateAllocation, useDeleteAllocation, defaultAllocation, useAddAllocation } from '../hooks/useAllocations.js'
import EditableCell from './EditableCell.jsx'
import StatusBadge from './StatusBadge.jsx'

export default function AllocationTable({ allocations, members, filterMemberId, toast }) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const updateAlloc = useUpdateAllocation()
  const deleteAlloc = useDeleteAllocation()
  const addAlloc = useAddAllocation()

  const memberOptions = members.map(m => m.name)
  const memberMap = Object.fromEntries(members.map(m => [m.name, m.id]))
  const memberById = Object.fromEntries(members.map(m => [m.id, m]))

  function save(alloc, field, value) {
    const updated = { ...alloc, [field]: value }
    if (field === 'team_member_name') {
      updated.team_member_id = memberMap[value] || alloc.team_member_id
    }
    updateAlloc.mutate(updated, {
      onError: () => toast?.('Failed to save. Please try again.'),
    })
  }

  function saveMonth(alloc, monthIdx, field, value) {
    const monthly = [...(alloc.monthly_allocations || [])]
    const monthEntry = { ...monthly[monthIdx] }
    monthEntry[field] = parseFloat(value) || 0
    if (field === 'allocation_percent') {
      monthEntry.hours = Math.round(monthEntry.allocation_percent * 160)
    }
    monthly[monthIdx] = monthEntry
    updateAlloc.mutate({ ...alloc, monthly_allocations: monthly }, {
      onError: () => toast?.('Failed to save month data.'),
    })
  }

  function addRow() {
    const targetId = filterMemberId || (members[0]?.id)
    if (!targetId) { alert('Please add a team member first.'); return }
    addAlloc.mutate(defaultAllocation(targetId), {
      onError: () => toast?.('Failed to add row.'),
    })
  }

  const filtered = filterMemberId
    ? allocations.filter(a => a.team_member_id === parseInt(filterMemberId))
    : allocations

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {/* Static header columns */}
              <th className="table-header sticky left-0 z-10 bg-ibm-gray-90 w-8">#</th>
              <th className="table-header sticky left-8 z-10 bg-ibm-gray-90 min-w-[160px]">Team Member</th>
              <th className="table-header min-w-[48px]">Band</th>
              <th className="table-header min-w-[120px]">Project</th>
              <th className="table-header min-w-[110px]">Project Type</th>
              <th className="table-header min-w-[180px]">Sub Project Type</th>
              <th className="table-header min-w-[100px]">Charge Code</th>
              <th className="table-header min-w-[60px]">Hrs/Day</th>
              <th className="table-header min-w-[100px]">Start Date</th>
              <th className="table-header min-w-[100px]">End Date</th>
              <th className="table-header min-w-[90px]">Status</th>
              <th className="table-header min-w-[200px]">Remarks</th>
              <th className="table-header min-w-[120px]">Backup Resource</th>
              <th className="table-header min-w-[60px]">Cap %</th>
              {/* Monthly columns */}
              {MONTHS.map(m => (
                <>
                  <th key={`${m}-pct`} className="table-header min-w-[70px] bg-ibm-blue/90">{MONTH_SHORT[m]} %</th>
                  <th key={`${m}-hrs`} className="table-header min-w-[70px] bg-ibm-blue/70">{MONTH_SHORT[m]} Hrs</th>
                </>
              ))}
              <th className="table-header min-w-[60px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={14 + MONTHS.length * 2 + 1} className="py-12 text-center text-ibm-gray-50 text-sm">
                  No records found. Click <strong>+ Add Row</strong> to start.
                </td>
              </tr>
            ) : (
              filtered.map((alloc, idx) => {
                const monthlyMap = {}
                for (const ma of (alloc.monthly_allocations || [])) monthlyMap[ma.month] = ma
                const memberName = alloc.team_member_name || memberById[alloc.team_member_id]?.name || ''

                return (
                  <tr key={alloc.id} className="table-row-hover border-b border-ibm-gray-20">
                    <td className="table-cell sticky left-0 bg-white text-ibm-gray-50 text-xs w-8">{idx + 1}</td>
                    <td className="table-cell sticky left-8 bg-white min-w-[160px]">
                      <EditableCell value={memberName} options={memberOptions} onSave={v => save(alloc, 'team_member_name', v)} />
                    </td>
                    <td className="table-cell text-ibm-gray-50 text-xs">{alloc.band || memberById[alloc.team_member_id]?.band || '—'}</td>
                    <td className="table-cell"><EditableCell value={alloc.project} onSave={v => save(alloc, 'project', v)} /></td>
                    <td className="table-cell"><EditableCell value={alloc.project_type} options={PROJECT_TYPES} onSave={v => save(alloc, 'project_type', v)} /></td>
                    <td className="table-cell"><EditableCell value={alloc.sub_project_type} onSave={v => save(alloc, 'sub_project_type', v)} /></td>
                    <td className="table-cell font-mono text-xs"><EditableCell value={alloc.charge_code} onSave={v => save(alloc, 'charge_code', v)} /></td>
                    <td className="table-cell text-center"><EditableCell value={alloc.allocation_hours_per_day} type="number" onSave={v => save(alloc, 'allocation_hours_per_day', parseInt(v))} /></td>
                    <td className="table-cell"><EditableCell value={alloc.start_date} type="text" onSave={v => save(alloc, 'start_date', v)} /></td>
                    <td className="table-cell"><EditableCell value={alloc.end_date} type="text" onSave={v => save(alloc, 'end_date', v)} /></td>
                    <td className="table-cell">
                      <EditableCell
                        value={alloc.status}
                        options={STATUS_OPTIONS}
                        onSave={v => save(alloc, 'status', v)}
                        className="w-full"
                      />
                      <StatusBadge status={alloc.status} />
                    </td>
                    <td className="table-cell max-w-[200px]">
                      <EditableCell value={alloc.remarks} type="textarea" onSave={v => save(alloc, 'remarks', v)} />
                    </td>
                    <td className="table-cell"><EditableCell value={alloc.backup_resource} onSave={v => save(alloc, 'backup_resource', v)} /></td>
                    <td className="table-cell text-center">
                      <EditableCell value={alloc.workload_capacity_limit} type="number" onSave={v => save(alloc, 'workload_capacity_limit', parseInt(v))} />
                    </td>
                    {/* Monthly columns */}
                    {MONTHS.map((month, mi) => {
                      const ma = monthlyMap[month] || { month, allocation_percent: 0, hours: 0 }
                      const idx2 = (alloc.monthly_allocations || []).findIndex(x => x.month === month)
                      return [
                        <td key={`${month}-pct`} className="table-cell bg-blue-50">
                          <EditableCell
                            value={ma.allocation_percent > 0 ? (ma.allocation_percent * 100).toFixed(0) : ''}
                            type="number"
                            onSave={v => saveMonth(alloc, idx2 >= 0 ? idx2 : mi, 'allocation_percent', parseFloat(v) / 100)}
                            className="text-center min-w-[50px]"
                          />
                        </td>,
                        <td key={`${month}-hrs`} className="table-cell text-center bg-blue-50/50 text-ibm-text font-medium">
                          {ma.hours > 0 ? Math.round(ma.hours) : '—'}
                        </td>
                      ]
                    })}
                    <td className="table-cell">
                      <button
                        className="text-ibm-red hover:text-red-700 text-xs font-medium px-2 py-1 hover:bg-red-50 transition-colors"
                        onClick={() => setConfirmDelete(alloc)}
                      >Delete</button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="font-semibold text-ibm-text mb-2">Confirm Delete</h3>
            <p className="text-sm text-ibm-gray-90 mb-4">
              Delete allocation <strong>{confirmDelete.sub_project_type || confirmDelete.project}</strong> for <strong>{confirmDelete.team_member_name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn-danger"
                onClick={() => {
                  deleteAlloc.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
                }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
