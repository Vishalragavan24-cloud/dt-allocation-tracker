import { MONTHS } from './constants.js'

export function exportToCSV(allocations) {
  const headers = [
    'Team Member Name','Band','Project/Initiative','Project Type','Sub Project Type',
    'Charge Code','Allocation Hours in A Day','Start Date','End Date','Status',
    'Remarks','Backup Resource','Workload Capacity Limit (%)',
    ...MONTHS.flatMap(m => [`${m} Allocation %`, `${m} Hours`])
  ]

  const rows = allocations.map(a => {
    const monthlyMap = {}
    for (const ma of (a.monthly_allocations || [])) monthlyMap[ma.month] = ma
    const monthCols = MONTHS.flatMap(m => {
      const ma = monthlyMap[m] || {}
      return [ma.allocation_percent ?? 0, ma.hours ?? 0]
    })
    return [
      a.team_member_name ?? '',
      a.band ?? '',
      a.project ?? '',
      a.project_type ?? '',
      a.sub_project_type ?? '',
      a.charge_code ?? '',
      a.allocation_hours_per_day ?? 8,
      a.start_date ?? '',
      a.end_date ?? '',
      a.status ?? '',
      (a.remarks ?? '').replace(/\n/g, ' | '),
      a.backup_resource ?? '',
      a.workload_capacity_limit ?? 8,
      ...monthCols,
    ]
  })

  const csvContent = [headers, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `allocation_tracker_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
