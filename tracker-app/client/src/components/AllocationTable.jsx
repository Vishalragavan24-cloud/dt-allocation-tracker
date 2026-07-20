import { useState, useEffect, useRef } from 'react'
import { MONTHS, PROJECT_TYPES, STATUS_OPTIONS } from '../lib/constants.js'
import { useUpdateAllocation, useDeleteAllocation, defaultAllocation, useAddAllocation } from '../hooks/useAllocations.js'
import StatusBadge from './StatusBadge.jsx'

// ─── Inline editable cell ─────────────────────────────────────────────────────
function EditableCell({ value, onSave, type = 'text', options = null, placeholder = 'click to edit', wrap = false }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const ref = useRef(null)

  useEffect(() => { setVal(value ?? '') }, [value])
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])

  function commit() {
    setEditing(false)
    const v = String(val).trim()
    const orig = String(value ?? '').trim()
    if (v !== orig) onSave(val)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && type !== 'textarea') commit()
    if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false) }
  }

  if (!editing) {
    const display = (val !== '' && val !== null && val !== undefined) ? String(val) : null
    return (
      <div
        className={`cursor-pointer hover:bg-blue-50 px-1.5 py-1 rounded min-h-[28px] ${wrap ? 'whitespace-pre-wrap break-words' : 'flex items-center'}`}
        onClick={() => setEditing(true)}
        title={wrap ? undefined : 'Click to edit'}
      >
        {display ?? <span className="text-gray-300 italic text-xs">{placeholder}</span>}
      </div>
    )
  }

  if (options) {
    return (
      <select
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className="border border-blue-400 rounded px-1 py-0.5 text-sm w-full outline-none bg-white"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  if (type === 'textarea') {
    return (
      <textarea
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        rows={3}
        className="border border-blue-400 rounded px-1 py-0.5 text-sm w-full min-w-[180px] outline-none resize-y"
      />
    )
  }

  return (
    <input
      ref={ref}
      type={type === 'number' ? 'number' : 'text'}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className="border border-blue-400 rounded px-1 py-0.5 text-sm w-full outline-none"
    />
  )
}

// ─── Editable column header (click to rename) ────────────────────────────────
function EditableHeader({ value, onSave, light = false }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  useEffect(() => setVal(value), [value])

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { setEditing(false); if (val.trim() && val.trim() !== value) onSave(val.trim()) }}
        onKeyDown={e => {
          if (e.key === 'Enter') { setEditing(false); if (val.trim() && val.trim() !== value) onSave(val.trim()) }
          if (e.key === 'Escape') { setVal(value); setEditing(false) }
        }}
        className={`outline-none text-xs font-semibold w-full text-center border-b ${light ? 'bg-transparent text-white border-white/60' : 'bg-gray-100 border-gray-400'}`}
      />
    )
  }
  return (
    <span
      className={`cursor-pointer select-none ${light ? 'text-white hover:text-blue-200' : 'hover:text-blue-600'}`}
      title="Click to rename this column"
      onClick={() => setEditing(true)}
    >
      {value} <span className="opacity-50 text-xs">✎</span>
    </span>
  )
}

// ─── Add Column Modal ─────────────────────────────────────────────────────────
function AddColumnModal({ onAdd, onClose, existingNames }) {
  const [name, setName] = useState('')
  const exists = existingNames.includes(name.trim())
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 shadow-xl p-6 w-full max-w-sm rounded">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Add New Month / Period Column</h2>
        <p className="text-xs text-gray-500 mb-4">
          A new <strong>Alloc %</strong> and <strong>Hours</strong> column pair will be added for all existing rows.
        </p>
        <label className="block text-xs font-medium text-gray-700 mb-1">Column Name</label>
        <input
          autoFocus
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full outline-none focus:border-blue-500 mb-3"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. August, Q3, Sprint 5"
          onKeyDown={e => { if (e.key === 'Enter' && name.trim() && !exists) onAdd(name.trim()) }}
        />
        {exists && <p className="text-red-600 text-xs mb-2">A column with this name already exists.</p>}
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            onClick={onClose}
          >Cancel</button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
            disabled={!name.trim() || exists}
            onClick={() => onAdd(name.trim())}
          >Add Column</button>
        </div>
      </div>
    </div>
  )
}

// ─── Persistent storage helpers ───────────────────────────────────────────────
const MONTHS_KEY  = 'dt_active_months'
const HEADERS_KEY = 'dt_static_headers'
const COL_LABELS_KEY = 'dt_col_labels'

const DEFAULT_STATIC_HEADERS = {
  teamMember: 'Team Member', band: 'Band', project: 'Project',
  projectType: 'Project Type', subProjectType: 'Sub Project Type',
  chargeCode: 'Charge Code', hrsDay: 'Hrs/Day', startDate: 'Start Date',
  endDate: 'End Date', status: 'Status', remarks: 'Remarks',
  backupResource: 'Backup Resource', capPct: 'Cap %',
}

function loadActiveMonths() {
  try { return JSON.parse(localStorage.getItem(MONTHS_KEY) || 'null') || [...MONTHS] }
  catch { return [...MONTHS] }
}
function saveActiveMonths(months) { localStorage.setItem(MONTHS_KEY, JSON.stringify(months)) }

function loadColLabels(months) {
  try {
    const saved = JSON.parse(localStorage.getItem(COL_LABELS_KEY) || '{}')
    return months.map(m => saved[m] ?? m)
  } catch { return [...months] }
}
function saveColLabels(months, labels) {
  const map = Object.fromEntries(months.map((m, i) => [m, labels[i]]))
  localStorage.setItem(COL_LABELS_KEY, JSON.stringify(map))
}

function loadStaticHeaders() {
  try { return { ...DEFAULT_STATIC_HEADERS, ...JSON.parse(localStorage.getItem(HEADERS_KEY) || '{}') } }
  catch { return { ...DEFAULT_STATIC_HEADERS } }
}
function saveStaticHeaders(h) { localStorage.setItem(HEADERS_KEY, JSON.stringify(h)) }

// ─────────────────────────────────────────────────────────────────────────────
export default function AllocationTable({ allocations, members, filterMemberId, toast }) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showAddCol, setShowAddCol]   = useState(false)

  const [activeMonths, setActiveMonths] = useState(loadActiveMonths)
  const [colLabels, setColLabels]       = useState(() => loadColLabels(loadActiveMonths()))
  const [staticHdrs, setStaticHdrs]     = useState(loadStaticHeaders)

  const updateAlloc = useUpdateAllocation()
  const deleteAlloc = useDeleteAllocation()
  const addAlloc    = useAddAllocation()

  const memberOptions = members.map(m => m.name)
  const memberMap     = Object.fromEntries(members.map(m => [m.name, m.id]))
  const memberById    = Object.fromEntries(members.map(m => [m.id, m]))

  // ── Rename a static column header ─────────────────────────────────────────
  function renameStaticHdr(key, newVal) {
    const updated = { ...staticHdrs, [key]: newVal }
    setStaticHdrs(updated)
    saveStaticHeaders(updated)
  }

  // ── Save a regular allocation field ───────────────────────────────────────
  function save(alloc, field, value) {
    const updated = { ...alloc, [field]: value }
    if (field === 'team_member_name') updated.team_member_id = memberMap[value] ?? alloc.team_member_id
    updateAlloc.mutate(updated, { onError: () => toast?.('Failed to save. Please try again.', 'error') })
  }

  // ── Save a monthly allocation field (% or hours) ──────────────────────────
  function saveMonth(alloc, monthKey, field, rawValue) {
    const monthly = alloc.monthly_allocations ? [...alloc.monthly_allocations] : []
    const idx = monthly.findIndex(x => x.month === monthKey)
    const entry = idx >= 0 ? { ...monthly[idx] } : { month: monthKey, allocation_percent: 0, hours: 0 }

    const num = parseFloat(rawValue) || 0
    if (field === 'allocation_percent') {
      entry.allocation_percent = num / 100
      entry.hours = Math.round(entry.allocation_percent * 160)
    } else {
      entry.hours = num
      entry.allocation_percent = num > 0 ? parseFloat((num / 160).toFixed(4)) : 0
    }

    if (idx >= 0) monthly[idx] = entry
    else monthly.push(entry)

    updateAlloc.mutate({ ...alloc, monthly_allocations: monthly }, {
      onError: () => toast?.('Failed to save month data.', 'error'),
    })
  }

  // ── Add row ───────────────────────────────────────────────────────────────
  function addRow() {
    const targetId = filterMemberId || members[0]?.id
    if (!targetId) { toast?.('Please add a team member first.', 'info'); return }
    const def = defaultAllocation(targetId)
    def.monthly_allocations = activeMonths.map(m => ({ month: m, allocation_percent: 0, hours: 0 }))
    addAlloc.mutate(def, {
      onSuccess: () => toast?.('Row added.', 'success'),
      onError: () => toast?.('Failed to add row.', 'error'),
    })
  }

  // ── Rename a month column ──────────────────────────────────────────────────
  function renameMonthCol(ci, newLabel) {
    const oldKey  = activeMonths[ci]
    const newMonths = activeMonths.map((m, i) => i === ci ? newLabel : m)
    const newLabels = colLabels.map((l, i) => i === ci ? newLabel : l)
    setActiveMonths(newMonths)
    setColLabels(newLabels)
    saveActiveMonths(newMonths)
    saveColLabels(newMonths, newLabels)
    // Patch all allocations: rename the month key in their monthly_allocations
    for (const alloc of allocations) {
      const monthly = (alloc.monthly_allocations || []).map(x =>
        x.month === oldKey ? { ...x, month: newLabel } : x
      )
      updateAlloc.mutate({ ...alloc, monthly_allocations: monthly })
    }
  }

  // ── Add a new month column ────────────────────────────────────────────────
  function addColumn(name) {
    const newMonths = [...activeMonths, name]
    const newLabels = [...colLabels, name]
    setActiveMonths(newMonths)
    setColLabels(newLabels)
    saveActiveMonths(newMonths)
    saveColLabels(newMonths, newLabels)
    for (const alloc of allocations) {
      const monthly = alloc.monthly_allocations ? [...alloc.monthly_allocations] : []
      if (!monthly.find(x => x.month === name)) {
        monthly.push({ month: name, allocation_percent: 0, hours: 0 })
        updateAlloc.mutate({ ...alloc, monthly_allocations: monthly })
      }
    }
    setShowAddCol(false)
    toast?.(`Column "${name}" added.`, 'success')
  }

  // ── Delete a month column ─────────────────────────────────────────────────
  function deleteColumn(ci) {
    const name = activeMonths[ci]
    if (!window.confirm(`Remove column "${name}" from all rows?\nAllocation data for this period will be deleted.`)) return
    const newMonths = activeMonths.filter((_, i) => i !== ci)
    const newLabels = colLabels.filter((_, i) => i !== ci)
    setActiveMonths(newMonths)
    setColLabels(newLabels)
    saveActiveMonths(newMonths)
    saveColLabels(newMonths, newLabels)
    for (const alloc of allocations) {
      const monthly = (alloc.monthly_allocations || []).filter(x => x.month !== name)
      updateAlloc.mutate({ ...alloc, monthly_allocations: monthly })
    }
    toast?.(`Column "${name}" removed.`, 'success')
  }

  // ─────────────────────────────────────────────────────────────────────────
  const rows = filterMemberId
    ? allocations.filter(a => a.team_member_id === filterMemberId)
    : allocations

  const totalCols = 15 + activeMonths.length * 2

  const TH = ({ hdrKey, className = '', children }) => (
    <th className={`table-header whitespace-nowrap ${className}`}>
      {hdrKey ? (
        <EditableHeader value={staticHdrs[hdrKey]} onSave={v => renameStaticHdr(hdrKey, v)} />
      ) : children}
    </th>
  )

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-b-0 border-gray-200 rounded-t">
        <span className="text-xs text-gray-500">
          {rows.length} rows · {activeMonths.length} month columns ·{' '}
          <span className="text-blue-600">Click any cell or header to edit</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 text-xs border border-blue-600 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors font-medium"
            onClick={() => setShowAddCol(true)}
          >
            + Add Column
          </button>
          <button
            className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            onClick={addRow}
            disabled={addAlloc.isPending}
          >
            {addAlloc.isPending ? 'Adding…' : '+ Add Row'}
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="border border-gray-200 rounded-b overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="table-header sticky left-0 z-20 bg-gray-800 w-8 text-center">#</th>
              <TH hdrKey="teamMember" className="sticky left-8 z-20 bg-gray-800 min-w-[150px]" />
              <TH hdrKey="band"           className="min-w-[60px]" />
              <TH hdrKey="project"        className="min-w-[120px]" />
              <TH hdrKey="projectType"    className="min-w-[110px]" />
              <TH hdrKey="subProjectType" className="min-w-[180px]" />
              <TH hdrKey="chargeCode"     className="min-w-[100px]" />
              <TH hdrKey="hrsDay"         className="min-w-[60px]" />
              <TH hdrKey="startDate"      className="min-w-[100px]" />
              <TH hdrKey="endDate"        className="min-w-[100px]" />
              <TH hdrKey="status"         className="min-w-[90px]" />
              <TH hdrKey="remarks"        className="min-w-[180px]" />
              <TH hdrKey="backupResource" className="min-w-[120px]" />
              <TH hdrKey="capPct"         className="min-w-[60px]" />

              {/* Month column pairs */}
              {activeMonths.map((month, ci) => [
                <th key={`${month}-pct-h`} className="table-header min-w-[90px] bg-blue-700 group relative">
                  <div className="flex flex-col items-center gap-0.5">
                    <EditableHeader
                      value={colLabels[ci]}
                      onSave={v => renameMonthCol(ci, v)}
                      light
                    />
                    <span className="text-blue-200 text-[10px] font-normal">Alloc %</span>
                  </div>
                  <button
                    title="Remove this column"
                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-300 text-sm leading-none"
                    onClick={() => deleteColumn(ci)}
                  >×</button>
                </th>,
                <th key={`${month}-hrs-h`} className="table-header min-w-[80px] bg-blue-600">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-white text-xs font-semibold">{colLabels[ci]}</span>
                    <span className="text-blue-200 text-[10px] font-normal">Hours</span>
                  </div>
                </th>,
              ])}

              <th className="table-header min-w-[70px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="py-16 text-center text-gray-400 text-sm">
                  No records found. Click <strong className="text-blue-600">+ Add Row</strong> to start.
                </td>
              </tr>
            ) : (
              rows.map((alloc, rowIdx) => {
                // Build a fast lookup for monthly data
                const mMap = {}
                for (const ma of (alloc.monthly_allocations || [])) mMap[ma.month] = ma
                const memberName = alloc.team_member_name || memberById[alloc.team_member_id]?.name || ''

                return (
                  <tr key={alloc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell sticky left-0 bg-white text-gray-400 text-xs text-center w-8">{rowIdx + 1}</td>
                    <td className="table-cell sticky left-8 bg-white min-w-[150px]">
                      <EditableCell
                        value={memberName}
                        options={memberOptions}
                        onSave={v => save(alloc, 'team_member_name', v)}
                      />
                    </td>
                    <td className="table-cell min-w-[60px]">
                      <EditableCell
                        value={alloc.band || memberById[alloc.team_member_id]?.band || ''}
                        onSave={v => save(alloc, 'band', v)}
                      />
                    </td>
                    <td className="table-cell min-w-[120px]">
                      <EditableCell value={alloc.project} onSave={v => save(alloc, 'project', v)} />
                    </td>
                    <td className="table-cell min-w-[110px]">
                      <EditableCell value={alloc.project_type} options={PROJECT_TYPES} onSave={v => save(alloc, 'project_type', v)} />
                    </td>
                    <td className="table-cell min-w-[180px]">
                      <EditableCell value={alloc.sub_project_type} onSave={v => save(alloc, 'sub_project_type', v)} />
                    </td>
                    <td className="table-cell min-w-[100px] font-mono text-xs">
                      <EditableCell value={alloc.charge_code} onSave={v => save(alloc, 'charge_code', v)} />
                    </td>
                    <td className="table-cell min-w-[60px] text-center">
                      <EditableCell
                        value={alloc.allocation_hours_per_day ?? ''}
                        type="number"
                        onSave={v => save(alloc, 'allocation_hours_per_day', parseFloat(v) || 0)}
                      />
                    </td>
                    <td className="table-cell min-w-[100px]">
                      <EditableCell value={alloc.start_date} onSave={v => save(alloc, 'start_date', v)} />
                    </td>
                    <td className="table-cell min-w-[100px]">
                      <EditableCell value={alloc.end_date} onSave={v => save(alloc, 'end_date', v)} />
                    </td>
                    <td className="table-cell min-w-[90px]">
                      <EditableCell value={alloc.status} options={STATUS_OPTIONS} onSave={v => save(alloc, 'status', v)} />
                      <StatusBadge status={alloc.status} />
                    </td>
                    <td className="table-cell min-w-[220px] max-w-[300px] align-top">
                      <EditableCell value={alloc.remarks} type="textarea" wrap onSave={v => save(alloc, 'remarks', v)} />
                    </td>
                    <td className="table-cell min-w-[120px]">
                      <EditableCell value={alloc.backup_resource} onSave={v => save(alloc, 'backup_resource', v)} />
                    </td>
                    <td className="table-cell min-w-[60px] text-center">
                      <EditableCell
                        value={alloc.workload_capacity_limit ?? ''}
                        type="number"
                        onSave={v => save(alloc, 'workload_capacity_limit', parseFloat(v) || 0)}
                      />
                    </td>

                    {/* ── Monthly columns — BOTH Alloc % and Hours are fully editable ── */}
                    {activeMonths.map((month) => {
                      const ma = mMap[month] || { month, allocation_percent: 0, hours: 0 }
                      const pctDisplay  = ma.allocation_percent > 0
                        ? String(Math.round(ma.allocation_percent * 100))
                        : '0'
                      const hrsDisplay  = ma.hours > 0
                        ? String(Math.round(ma.hours))
                        : '0'

                      return [
                        <td key={`${alloc.id}-${month}-pct`} className="table-cell bg-blue-50 min-w-[80px] text-center">
                          <EditableCell
                            value={pctDisplay}
                            type="number"
                            placeholder="0"
                            onSave={v => saveMonth(alloc, month, 'allocation_percent', v)}
                          />
                        </td>,
                        <td key={`${alloc.id}-${month}-hrs`} className="table-cell bg-blue-50/40 min-w-[70px] text-center">
                          <EditableCell
                            value={hrsDisplay}
                            type="number"
                            placeholder="0"
                            onSave={v => saveMonth(alloc, month, 'hours', v)}
                          />
                        </td>,
                      ]
                    })}

                    <td className="table-cell">
                      <button
                        className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                        onClick={() => setConfirmDelete(alloc)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add Column Modal ── */}
      {showAddCol && (
        <AddColumnModal
          onAdd={addColumn}
          onClose={() => setShowAddCol(false)}
          existingNames={activeMonths}
        />
      )}

      {/* ── Confirm delete row ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 shadow-xl p-6 w-full max-w-sm rounded">
            <h3 className="font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-700 mb-4">
              Delete <strong>{confirmDelete.sub_project_type || confirmDelete.project || 'this row'}</strong>
              {confirmDelete.team_member_name ? <> for <strong>{confirmDelete.team_member_name}</strong></> : ''}?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => setConfirmDelete(null)}
              >Cancel</button>
              <button
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => deleteAlloc.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
