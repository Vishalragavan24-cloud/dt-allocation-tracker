import { useState, useEffect } from 'react'
import { MONTHS, MONTH_SHORT, PROJECT_TYPES, STATUS_OPTIONS } from '../lib/constants.js'
import { useUpdateAllocation, useDeleteAllocation, defaultAllocation, useAddAllocation } from '../hooks/useAllocations.js'
import EditableCell from './EditableCell.jsx'
import StatusBadge from './StatusBadge.jsx'

// ── Column header names stored in localStorage so renames persist across sessions
const STORAGE_KEY = 'dt_tracker_column_names'

function loadColumnNames(months) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return months.map(m => saved[m] ?? m)
  } catch { return [...months] }
}

function saveColumnNames(months, names) {
  const map = Object.fromEntries(months.map((m, i) => [m, names[i]]))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

// ── Editable column header (click to rename)
function EditableHeader({ value, onSave, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  useEffect(() => setVal(value), [value])

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { setEditing(false); if (val.trim() && val !== value) onSave(val.trim()) }}
        onKeyDown={e => {
          if (e.key === 'Enter') { setEditing(false); if (val.trim() && val !== value) onSave(val.trim()) }
          if (e.key === 'Escape') { setVal(value); setEditing(false) }
        }}
        className={`bg-ibm-gray-90 text-white border-b border-white/50 outline-none text-xs font-medium w-full text-center ${className}`}
      />
    )
  }
  return (
    <span
      title="Click to rename this column"
      className={`cursor-pointer hover:underline decoration-dotted underline-offset-2 ${className}`}
      onClick={() => setEditing(true)}
    >
      {value} ✎
    </span>
  )
}

// ── Add Column Modal
function AddColumnModal({ onAdd, onClose, existingNames }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border border-ibm-gray-20 shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-base font-semibold text-ibm-text mb-1">Add New Month / Period Column</h2>
        <p className="text-xs text-ibm-gray-50 mb-4">A new Allocation % and Hours column pair will be added for all rows.</p>
        <label className="label">Column Name</label>
        <input
          autoFocus
          className="input mb-4"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. August, Q3, Sprint 5"
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onAdd(name.trim()) }}
        />
        {existingNames.includes(name.trim()) && (
          <p className="text-ibm-red text-xs mb-2">A column with this name already exists.</p>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!name.trim() || existingNames.includes(name.trim())}
            onClick={() => onAdd(name.trim())}
          >Add Column</button>
        </div>
      </div>
    </div>
  )
}

export default function AllocationTable({ allocations, members, filterMemberId, toast }) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showAddCol, setShowAddCol] = useState(false)

  // Column management — starts from MONTHS but allows additions and renames
  const [activeMonths, setActiveMonths] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('dt_tracker_active_months') || 'null')
      return saved || [...MONTHS]
    } catch { return [...MONTHS] }
  })
  const [columnLabels, setColumnLabels] = useState(() => loadColumnNames(
    (() => { try { return JSON.parse(localStorage.getItem('dt_tracker_active_months') || 'null') || [...MONTHS] } catch { return [...MONTHS] } })()
  ))

  const updateAlloc = useUpdateAllocation()
  const deleteAlloc = useDeleteAllocation()
  const addAlloc = useAddAllocation()

  const memberOptions = members.map(m => m.name)
  const memberMap = Object.fromEntries(members.map(m => [m.name, m.id]))
  const memberById = Object.fromEntries(members.map(m => [m.id, m]))

  // ── Save ──────────────────────────────────────────────────────────────────
  function save(alloc, field, value) {
    const updated = { ...alloc, [field]: value }
    if (field === 'team_member_name') updated.team_member_id = memberMap[value] || alloc.team_member_id
    updateAlloc.mutate(updated, { onError: () => toast?.('Failed to save. Please try again.') })
  }

  function saveMonth(alloc, monthKey, field, rawValue) {
    const monthly = alloc.monthly_allocations ? [...alloc.monthly_allocations] : []
    const idx = monthly.findIndex(x => x.month === monthKey)
    const entry = idx >= 0 ? { ...monthly[idx] } : { month: monthKey, allocation_percent: 0, hours: 0 }

    if (field === 'allocation_percent') {
      entry.allocation_percent = parseFloat(rawValue) / 100 || 0
      entry.hours = Math.round(entry.allocation_percent * 160)
    } else {
      // hours edited directly
      entry.hours = parseFloat(rawValue) || 0
      entry.allocation_percent = entry.hours > 0 ? parseFloat((entry.hours / 160).toFixed(4)) : 0
    }

    if (idx >= 0) monthly[idx] = entry
    else monthly.push(entry)

    updateAlloc.mutate({ ...alloc, monthly_allocations: monthly }, {
      onError: () => toast?.('Failed to save month data.'),
    })
  }

  // ── Add row ───────────────────────────────────────────────────────────────
  function addRow() {
    const targetId = filterMemberId || members[0]?.id
    if (!targetId) { toast?.('Please add a team member first.', 'info'); return }
    const def = defaultAllocation(targetId)
    // ensure new row has entries for all active columns
    def.monthly_allocations = activeMonths.map(m => ({ month: m, allocation_percent: 0, hours: 0 }))
    addAlloc.mutate(def, { onError: () => toast?.('Failed to add row.') })
  }

  // ── Column header rename ──────────────────────────────────────────────────
  function renameColumn(colIdx, newLabel) {
    const newLabels = [...columnLabels]
    const oldKey = activeMonths[colIdx]
    newLabels[colIdx] = newLabel
    setColumnLabels(newLabels)
    // also update the key in activeMonths so the new name persists
    const newMonths = [...activeMonths]
    newMonths[colIdx] = newLabel
    setActiveMonths(newMonths)
    localStorage.setItem('dt_tracker_active_months', JSON.stringify(newMonths))
    saveColumnNames(newMonths, newLabels)
    // Update all allocations to rename the month key
    for (const alloc of allocations) {
      const monthly = alloc.monthly_allocations ? [...alloc.monthly_allocations] : []
      const entry = monthly.find(x => x.month === oldKey)
      if (entry) {
        entry.month = newLabel
        updateAlloc.mutate({ ...alloc, monthly_allocations: monthly })
      }
    }
  }

  // ── Add column ────────────────────────────────────────────────────────────
  function addColumn(name) {
    const newMonths = [...activeMonths, name]
    const newLabels = [...columnLabels, name]
    setActiveMonths(newMonths)
    setColumnLabels(newLabels)
    localStorage.setItem('dt_tracker_active_months', JSON.stringify(newMonths))
    saveColumnNames(newMonths, newLabels)
    // Patch all existing allocations to include the new month with 0 values
    for (const alloc of allocations) {
      const monthly = alloc.monthly_allocations ? [...alloc.monthly_allocations] : []
      if (!monthly.find(x => x.month === name)) {
        monthly.push({ month: name, allocation_percent: 0, hours: 0 })
        updateAlloc.mutate({ ...alloc, monthly_allocations: monthly })
      }
    }
    setShowAddCol(false)
    toast?.(`Column "${name}" added to all rows.`, 'success')
  }

  // ── Delete column ─────────────────────────────────────────────────────────
  function deleteColumn(colIdx) {
    const name = activeMonths[colIdx]
    if (!window.confirm(`Remove column "${name}" from all rows? Allocation data for this period will be deleted.`)) return
    const newMonths = activeMonths.filter((_, i) => i !== colIdx)
    const newLabels = columnLabels.filter((_, i) => i !== colIdx)
    setActiveMonths(newMonths)
    setColumnLabels(newLabels)
    localStorage.setItem('dt_tracker_active_months', JSON.stringify(newMonths))
    saveColumnNames(newMonths, newLabels)
    for (const alloc of allocations) {
      const monthly = (alloc.monthly_allocations || []).filter(x => x.month !== name)
      updateAlloc.mutate({ ...alloc, monthly_allocations: monthly })
    }
  }

  const filtered = filterMemberId
    ? allocations.filter(a => a.team_member_id === parseInt(filterMemberId))
    : allocations

  const totalCols = 14 + activeMonths.length * 2 + 1

  return (
    <>
      {/* Table toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border border-b-0 border-ibm-gray-20">
        <span className="text-xs text-ibm-gray-50">{filtered.length} rows · {activeMonths.length} month columns · Click any cell or header to edit</span>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 text-xs border border-ibm-blue text-ibm-blue px-3 py-1.5 hover:bg-blue-50 transition-colors"
            onClick={() => setShowAddCol(true)}
          >
            <span className="text-base leading-none">+</span> Add Column
          </button>
          <button
            className="btn-primary text-xs"
            onClick={addRow}
            disabled={addAlloc.isPending}
          >
            {addAlloc.isPending ? 'Adding...' : '+ Add Row'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
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
                {/* Month column headers — each is editable, with a delete × */}
                {activeMonths.map((month, ci) => [
                  <th key={`${month}-pct-h`} className="table-header min-w-[90px] bg-ibm-blue/90 group relative">
                    <div className="flex flex-col items-center gap-0.5">
                      <EditableHeader
                        value={columnLabels[ci]}
                        onSave={v => renameColumn(ci, v)}
                      />
                      <span className="text-white/60 text-xs font-normal">Alloc %</span>
                    </div>
                    <button
                      title="Remove this column"
                      className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-white/50 hover:text-ibm-red text-xs leading-none"
                      onClick={() => deleteColumn(ci)}
                    >×</button>
                  </th>,
                  <th key={`${month}-hrs-h`} className="table-header min-w-[80px] bg-ibm-blue/70">
                    <div className="flex flex-col items-center">
                      <span>{columnLabels[ci]}</span>
                      <span className="text-white/60 text-xs font-normal">Hours</span>
                    </div>
                  </th>
                ])}
                <th className="table-header min-w-[70px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="py-12 text-center text-ibm-gray-50 text-sm">
                    No records found. Click <strong>+ Add Row</strong> to start.
                  </td>
                </tr>
              ) : (
                filtered.map((alloc, rowIdx) => {
                  const monthlyMap = {}
                  for (const ma of (alloc.monthly_allocations || [])) monthlyMap[ma.month] = ma
                  const memberName = alloc.team_member_name || memberById[alloc.team_member_id]?.name || ''

                  return (
                    <tr key={alloc.id} className="table-row-hover border-b border-ibm-gray-20">
                      <td className="table-cell sticky left-0 bg-white text-ibm-gray-50 text-xs w-8">{rowIdx + 1}</td>
                      <td className="table-cell sticky left-8 bg-white min-w-[160px]">
                        <EditableCell value={memberName} options={memberOptions} onSave={v => save(alloc, 'team_member_name', v)} />
                      </td>
                      <td className="table-cell text-ibm-gray-50 text-xs">
                        <EditableCell value={alloc.band || memberById[alloc.team_member_id]?.band || ''} onSave={v => save(alloc, 'band', v)} />
                      </td>
                      <td className="table-cell"><EditableCell value={alloc.project} onSave={v => save(alloc, 'project', v)} /></td>
                      <td className="table-cell"><EditableCell value={alloc.project_type} options={PROJECT_TYPES} onSave={v => save(alloc, 'project_type', v)} /></td>
                      <td className="table-cell"><EditableCell value={alloc.sub_project_type} onSave={v => save(alloc, 'sub_project_type', v)} /></td>
                      <td className="table-cell font-mono text-xs"><EditableCell value={alloc.charge_code} onSave={v => save(alloc, 'charge_code', v)} /></td>
                      <td className="table-cell text-center"><EditableCell value={alloc.allocation_hours_per_day} type="number" onSave={v => save(alloc, 'allocation_hours_per_day', parseInt(v))} /></td>
                      <td className="table-cell"><EditableCell value={alloc.start_date} onSave={v => save(alloc, 'start_date', v)} /></td>
                      <td className="table-cell"><EditableCell value={alloc.end_date} onSave={v => save(alloc, 'end_date', v)} /></td>
                      <td className="table-cell">
                        <EditableCell value={alloc.status} options={STATUS_OPTIONS} onSave={v => save(alloc, 'status', v)} />
                        <StatusBadge status={alloc.status} />
                      </td>
                      <td className="table-cell max-w-[200px]">
                        <EditableCell value={alloc.remarks} type="textarea" onSave={v => save(alloc, 'remarks', v)} />
                      </td>
                      <td className="table-cell"><EditableCell value={alloc.backup_resource} onSave={v => save(alloc, 'backup_resource', v)} /></td>
                      <td className="table-cell text-center">
                        <EditableCell value={alloc.workload_capacity_limit} type="number" onSave={v => save(alloc, 'workload_capacity_limit', parseInt(v))} />
                      </td>

                      {/* Monthly columns — BOTH % and Hrs are now editable */}
                      {activeMonths.map((month) => {
                        const ma = monthlyMap[month] || { month, allocation_percent: 0, hours: 0 }
                        return [
                          <td key={`${alloc.id}-${month}-pct`} className="table-cell bg-blue-50 min-w-[80px]">
                            <EditableCell
                              value={ma.allocation_percent > 0 ? (ma.allocation_percent * 100).toFixed(0) : ''}
                              type="number"
                              onSave={v => saveMonth(alloc, month, 'allocation_percent', v)}
                              className="text-center"
                            />
                          </td>,
                          <td key={`${alloc.id}-${month}-hrs`} className="table-cell bg-blue-50/50 min-w-[70px]">
                            <EditableCell
                              value={ma.hours > 0 ? String(Math.round(ma.hours)) : ''}
                              type="number"
                              onSave={v => saveMonth(alloc, month, 'hours', v)}
                              className="text-center font-medium"
                            />
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
      </div>

      {/* Add Column Modal */}
      {showAddCol && (
        <AddColumnModal
          onAdd={addColumn}
          onClose={() => setShowAddCol(false)}
          existingNames={activeMonths}
        />
      )}

      {/* Confirm delete row dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-ibm-gray-20 shadow-lg p-6 w-full max-w-sm">
            <h3 className="font-semibold text-ibm-text mb-2">Confirm Delete</h3>
            <p className="text-sm text-ibm-gray-90 mb-4">
              Delete <strong>{confirmDelete.sub_project_type || confirmDelete.project}</strong> for <strong>{confirmDelete.team_member_name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn-danger"
                onClick={() => deleteAlloc.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
