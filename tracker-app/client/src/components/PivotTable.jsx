import { MONTHS, MONTH_SHORT } from '../lib/constants.js'

export default function PivotTable({ pivot, memberTotals }) {
  return (
    <div className="card overflow-x-auto">
      <div className="px-4 pt-3 pb-2 border-b border-ibm-gray-20">
        <h3 className="text-sm font-semibold text-ibm-text">Pivot Summary — Hours by Member / Project / Type</h3>
      </div>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-ibm-gray-90 text-white">
            <th className="text-left px-3 py-2 sticky left-0 bg-ibm-gray-90 min-w-[140px]">Member</th>
            <th className="text-left px-3 py-2 min-w-[120px]">Project</th>
            <th className="text-left px-3 py-2 min-w-[110px]">Project Type</th>
            {MONTHS.map(m => <th key={m} className="text-right px-3 py-2 min-w-[55px] whitespace-nowrap">{MONTH_SHORT[m]}</th>)}
            <th className="text-right px-3 py-2 min-w-[60px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pivot).map(([member, projects]) => {
            const memberRows = []
            let memberFirstRow = true
            const memberRowSpan = Object.entries(projects).reduce((s, [, types]) => s + Object.keys(types).length, 0)

            Object.entries(projects).forEach(([project, types]) => {
              let projFirstRow = true
              const projRowSpan = Object.keys(types).length

              Object.entries(types).forEach(([ptype, monthHours]) => {
                const rowTotal = Object.values(monthHours).reduce((a, b) => a + b, 0)
                memberRows.push(
                  <tr key={`${member}-${project}-${ptype}`} className="border-b border-ibm-gray-20 hover:bg-blue-50">
                    {memberFirstRow && (
                      <td rowSpan={memberRowSpan} className="px-3 py-2 font-semibold text-ibm-blue align-top sticky left-0 bg-white border-r border-ibm-gray-20">
                        {member}
                      </td>
                    )}
                    {projFirstRow && (
                      <td rowSpan={projRowSpan} className="px-3 py-2 font-medium text-ibm-text align-top">
                        {project}
                      </td>
                    )}
                    <td className="px-3 py-2 text-ibm-gray-50">{ptype}</td>
                    {MONTHS.map(m => (
                      <td key={m} className="text-right px-3 py-1.5 tabular-nums">
                        {monthHours[m] > 0 ? Math.round(monthHours[m]) : '—'}
                      </td>
                    ))}
                    <td className="text-right px-3 py-1.5 font-medium tabular-nums">{Math.round(rowTotal)}</td>
                    {(memberFirstRow = false) || null}
                    {(projFirstRow = false) || null}
                  </tr>
                )
              })
            })

            // Member total row
            const totals = memberTotals[member] || {}
            const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)
            memberRows.push(
              <tr key={`${member}-total`} className="bg-ibm-gray-10 border-b-2 border-ibm-gray-20">
                <td className="px-3 py-2 font-bold text-ibm-text sticky left-0 bg-ibm-gray-10" colSpan={2}>{member} Total</td>
                <td className="px-3 py-2 text-ibm-gray-50 font-medium">All</td>
                {MONTHS.map(m => (
                  <td key={m} className="text-right px-3 py-1.5 font-bold tabular-nums text-ibm-blue">
                    {totals[m] > 0 ? Math.round(totals[m]) : '—'}
                  </td>
                ))}
                <td className="text-right px-3 py-1.5 font-bold tabular-nums text-ibm-blue">{Math.round(grandTotal)}</td>
              </tr>
            )

            return memberRows
          })}
        </tbody>
      </table>
    </div>
  )
}
