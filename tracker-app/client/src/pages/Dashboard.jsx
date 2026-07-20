import { useState } from 'react'
import { useAllocations } from '../hooks/useAllocations.js'
import { useTeamMembers } from '../hooks/useTeamMembers.js'
import { computePivot, computeChartData } from '../lib/pivot.js'
import PivotTable from '../components/PivotTable.jsx'
import MonthlyBarChart from '../components/MonthlyBarChart.jsx'
import TeamTotalChart from '../components/TeamTotalChart.jsx'
import Spinner from '../components/Spinner.jsx'
import { MONTHS, MONTH_SHORT, PROJECT_TYPES } from '../lib/constants.js'

export default function Dashboard() {
  const [selectedMonths, setSelectedMonths] = useState(new Set(MONTHS))
  const [selectedTypes, setSelectedTypes] = useState(new Set(PROJECT_TYPES))

  const { data: allocations = [], isLoading } = useAllocations()
  const { data: members = [] } = useTeamMembers()

  if (isLoading) return <Spinner size="lg" />

  // Apply filters
  const filtered = allocations.filter(a =>
    !selectedTypes.size || selectedTypes.has(a.project_type)
  )

  const { pivot, memberTotals } = computePivot(filtered)
  const totalChartData = computeChartData(filtered)
  const filteredTotalData = totalChartData.filter(d => selectedMonths.has(Object.entries(MONTH_SHORT).find(([, s]) => s === d.month)?.[0]))

  function toggleMonth(m) {
    setSelectedMonths(prev => {
      const next = new Set(prev)
      next.has(m) ? next.delete(m) : next.add(m)
      return next
    })
  }
  function toggleType(t) {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }

  // Per-member chart data
  const memberChartData = members.map(member => ({
    member: member.name,
    data: computeChartData(filtered, [member.name]),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-ibm-text">Dashboard &amp; Analytics</h1>
        <span className="text-sm text-ibm-gray-50">{allocations.length} total records</span>
      </div>

      {/* Filters */}
      <div className="card mb-4 px-4 py-3">
        <div className="flex flex-wrap items-start gap-6">
          <div>
            <span className="label">Months</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {MONTHS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMonth(m)}
                  className={`text-xs px-2 py-0.5 border transition-colors ${selectedMonths.has(m) ? 'bg-ibm-blue text-white border-ibm-blue' : 'border-ibm-gray-20 text-ibm-gray-50 hover:border-ibm-blue'}`}
                >
                  {MONTH_SHORT[m]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Project Types</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {PROJECT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`text-xs px-2 py-0.5 border transition-colors ${selectedTypes.has(t) ? 'bg-ibm-blue text-white border-ibm-blue' : 'border-ibm-gray-20 text-ibm-gray-50 hover:border-ibm-blue'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {members.map(member => {
          const total = Object.values(memberTotals[member.name] || {}).reduce((a, b) => a + b, 0)
          const rows = allocations.filter(a => a.team_member_id === member.id).length
          return (
            <div key={member.id} className="card px-4 py-3">
              <p className="text-xs text-ibm-gray-50 font-medium uppercase tracking-wide">{member.name}</p>
              <p className="text-2xl font-bold text-ibm-blue mt-1">{Math.round(total)}<span className="text-sm font-normal text-ibm-gray-50 ml-1">hrs</span></p>
              <p className="text-xs text-ibm-gray-50 mt-0.5">{rows} allocation rows · Band {member.band}</p>
            </div>
          )
        })}
        <div className="card px-4 py-3">
          <p className="text-xs text-ibm-gray-50 font-medium uppercase tracking-wide">Grand Total</p>
          <p className="text-2xl font-bold text-ibm-gray-90 mt-1">
            {Math.round(Object.values(memberTotals).flatMap(Object.values).reduce((a, b) => a + b, 0))}
            <span className="text-sm font-normal text-ibm-gray-50 ml-1">hrs</span>
          </p>
          <p className="text-xs text-ibm-gray-50 mt-0.5">{allocations.length} total rows</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TeamTotalChart data={totalChartData} />
        {memberChartData[0] && (
          <MonthlyBarChart data={memberChartData[0].data} title={`${memberChartData[0].member} — Monthly Hours by Type`} />
        )}
      </div>
      {memberChartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {memberChartData.slice(1).map(({ member, data }) => (
            <MonthlyBarChart key={member} data={data} title={`${member} — Monthly Hours by Type`} />
          ))}
        </div>
      )}

      {/* Pivot table */}
      <PivotTable pivot={pivot} memberTotals={memberTotals} />
    </div>
  )
}
