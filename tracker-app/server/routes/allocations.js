import express from 'express'
import db from '../db.js'

const router = express.Router()

const MONTHS = ['October','November','December','January','February','March','April','May','June','July']

function getFullAllocation(id) {
  const alloc = db.prepare('SELECT a.*, tm.name as team_member_name, tm.band FROM allocations a JOIN team_members tm ON a.team_member_id = tm.id WHERE a.id = ?').get(id)
  if (!alloc) return null
  alloc.monthly_allocations = db.prepare('SELECT * FROM monthly_allocations WHERE allocation_id = ? ORDER BY id').all(id)
  return alloc
}

// GET all allocations (with optional memberId filter)
router.get('/', (req, res) => {
  const { memberId } = req.query
  let rows
  if (memberId) {
    rows = db.prepare('SELECT a.*, tm.name as team_member_name, tm.band FROM allocations a JOIN team_members tm ON a.team_member_id = tm.id WHERE a.team_member_id = ? ORDER BY a.id').all(memberId)
  } else {
    rows = db.prepare('SELECT a.*, tm.name as team_member_name, tm.band FROM allocations a JOIN team_members tm ON a.team_member_id = tm.id ORDER BY tm.name, a.id').all()
  }
  for (const row of rows) {
    row.monthly_allocations = db.prepare('SELECT * FROM monthly_allocations WHERE allocation_id = ? ORDER BY id').all(row.id)
  }
  res.json(rows)
})

// POST create new allocation
router.post('/', (req, res) => {
  const {
    team_member_id, project, project_type, sub_project_type, charge_code,
    allocation_hours_per_day, start_date, end_date, status, remarks,
    backup_resource, workload_capacity_limit, monthly_allocations
  } = req.body

  const info = db.prepare(`
    INSERT INTO allocations (team_member_id, project, project_type, sub_project_type, charge_code,
      allocation_hours_per_day, start_date, end_date, status, remarks, backup_resource, workload_capacity_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    team_member_id, project || '', project_type || '', sub_project_type || '', charge_code || '',
    allocation_hours_per_day || 8, start_date || '', end_date || '', status || 'Active',
    remarks || '', backup_resource || '', workload_capacity_limit || 8
  )

  const allocId = info.lastInsertRowid
  const monthlyData = monthly_allocations || MONTHS.map(m => ({ month: m, allocation_percent: 0, hours: 0 }))
  const insertMonth = db.prepare('INSERT INTO monthly_allocations (allocation_id, month, allocation_percent, hours) VALUES (?, ?, ?, ?)')
  for (const m of monthlyData) {
    insertMonth.run(allocId, m.month, m.allocation_percent || 0, m.hours || 0)
  }

  res.status(201).json(getFullAllocation(allocId))
})

// PUT update allocation
router.put('/:id', (req, res) => {
  const {
    team_member_id, project, project_type, sub_project_type, charge_code,
    allocation_hours_per_day, start_date, end_date, status, remarks,
    backup_resource, workload_capacity_limit, monthly_allocations
  } = req.body

  db.prepare(`
    UPDATE allocations SET team_member_id=?, project=?, project_type=?, sub_project_type=?,
    charge_code=?, allocation_hours_per_day=?, start_date=?, end_date=?, status=?,
    remarks=?, backup_resource=?, workload_capacity_limit=? WHERE id=?
  `).run(
    team_member_id, project, project_type, sub_project_type, charge_code,
    allocation_hours_per_day, start_date, end_date, status,
    remarks, backup_resource, workload_capacity_limit, req.params.id
  )

  if (monthly_allocations) {
    db.prepare('DELETE FROM monthly_allocations WHERE allocation_id = ?').run(req.params.id)
    const insertMonth = db.prepare('INSERT INTO monthly_allocations (allocation_id, month, allocation_percent, hours) VALUES (?, ?, ?, ?)')
    for (const m of monthly_allocations) {
      insertMonth.run(req.params.id, m.month, m.allocation_percent || 0, m.hours || 0)
    }
  }

  res.json(getFullAllocation(req.params.id))
})

// DELETE allocation
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM allocations WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

export default router
