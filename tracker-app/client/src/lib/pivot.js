import { MONTHS, MONTH_SHORT } from './constants.js'

export function computePivot(allocations) {
  // { memberName -> { project -> { projectType -> { month -> hours } } } }
  const pivot = {}
  const memberTotals = {}

  for (const alloc of allocations) {
    const member = alloc.team_member_name || 'Unknown'
    const project = alloc.project || ''
    const ptype = alloc.project_type || ''
    if (!pivot[member]) { pivot[member] = {}; memberTotals[member] = {} }
    if (!pivot[member][project]) pivot[member][project] = {}
    if (!pivot[member][project][ptype]) {
      pivot[member][project][ptype] = {}
      MONTHS.forEach(m => { pivot[member][project][ptype][m] = 0 })
    }
    if (!memberTotals[member]) memberTotals[member] = {}
    MONTHS.forEach(m => { if (!memberTotals[member][m]) memberTotals[member][m] = 0 })

    for (const ma of (alloc.monthly_allocations || [])) {
      pivot[member][project][ptype][ma.month] = (pivot[member][project][ptype][ma.month] || 0) + (ma.hours || 0)
      memberTotals[member][ma.month] = (memberTotals[member][ma.month] || 0) + (ma.hours || 0)
    }
  }
  return { pivot, memberTotals }
}

export function computeChartData(allocations, filterMembers = null) {
  // Returns [{ month, PMA, 'New Project', Maintenance, 'Time Away', total }, ...]
  const monthData = {}
  MONTHS.forEach(m => {
    monthData[m] = { month: MONTH_SHORT[m], PMA: 0, 'New Project': 0, Maintenance: 0, 'Time Away': 0, total: 0 }
  })

  for (const alloc of allocations) {
    if (filterMembers && !filterMembers.includes(alloc.team_member_name)) continue
    const ptype = alloc.project_type || 'Other'
    for (const ma of (alloc.monthly_allocations || [])) {
      if (monthData[ma.month]) {
        monthData[ma.month][ptype] = (monthData[ma.month][ptype] || 0) + (ma.hours || 0)
        monthData[ma.month].total += (ma.hours || 0)
      }
    }
  }
  return Object.values(monthData)
}

export function computeAlertGrid(allocations, members) {
  // Returns { memberName: { month: totalHours } }
  const grid = {}
  for (const m of members) grid[m.name] = {}
  MONTHS.forEach(month => {
    for (const m of members) grid[m.name][month] = 0
  })
  for (const alloc of allocations) {
    const name = alloc.team_member_name
    if (!grid[name]) continue
    for (const ma of (alloc.monthly_allocations || [])) {
      grid[name][ma.month] = (grid[name][ma.month] || 0) + (ma.hours || 0)
    }
  }
  return grid
}
