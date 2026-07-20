import { MONTHS, MONTH_SHORT, STANDARD_MONTHLY_HOURS } from '../lib/constants.js'

function alertClass(hours) {
  if (hours > STANDARD_MONTHLY_HOURS) return 'bg-red-100 text-red-800 font-semibold'
  if (hours >= 140) return 'bg-yellow-100 text-yellow-800 font-medium'
  if (hours > 0) return 'bg-green-100 text-green-800'
  return 'bg-white text-ibm-gray-50'
}

export default function AllocationAlerts({ allocations, members }) {
  // Compute grid: memberName -> month -> totalHours
  const grid = {}
  for (const m of members) grid[m.name] = {}

  for (const alloc of allocations) {
    const name = alloc.team_member_name
    if (!grid[name]) continue
    for (const ma of (alloc.monthly_allocations || [])) {
      grid[name][ma.month] = (grid[name][ma.month] || 0) + (ma.hours || 0)
    }
  }

  return (
    <div className="card mb-4 overflow-x-auto">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-ibm-gray-20">
        <h3 className="text-sm font-semibold text-ibm-text">Capacity Alerts</h3>
        <div className="flex items-center gap-4 text-xs text-ibm-gray-50">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-200 inline-block rounded-sm"/>&gt;160h Overallocated</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 inline-block rounded-sm"/>140–160h Near Limit</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-200 inline-block rounded-sm"/>&lt;140h OK</span>
        </div>
      </div>
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="text-left px-4 py-2 text-ibm-gray-50 font-medium w-40 sticky left-0 bg-white">Member</th>
            {MONTHS.map(m => (
              <th key={m} className="text-center px-2 py-2 text-ibm-gray-50 font-medium whitespace-nowrap">{MONTH_SHORT[m]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id} className="border-t border-ibm-gray-20">
              <td className="px-4 py-2 font-medium text-ibm-text sticky left-0 bg-white whitespace-nowrap">{member.name}</td>
              {MONTHS.map(month => {
                const hrs = grid[member.name]?.[month] || 0
                return (
                  <td key={month} className={`text-center px-2 py-1.5 ${alertClass(hrs)}`}>
                    {hrs > 0 ? Math.round(hrs) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
