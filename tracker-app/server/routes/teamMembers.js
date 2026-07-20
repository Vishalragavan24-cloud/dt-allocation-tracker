import express from 'express'
import db from '../db.js'

const router = express.Router()

// GET all team members
router.get('/', (_req, res) => {
  const members = db.prepare('SELECT * FROM team_members ORDER BY name').all()
  res.json(members)
})

// POST add new team member
router.post('/', (req, res) => {
  const { name, band } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const info = db.prepare('INSERT INTO team_members (name, band) VALUES (?, ?)').run(name, band || '')
  // Auto-create empty access record
  db.prepare('INSERT INTO access (team_member_id) VALUES (?)').run(info.lastInsertRowid)
  const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json(member)
})

// PUT update team member
router.put('/:id', (req, res) => {
  const { name, band } = req.body
  db.prepare('UPDATE team_members SET name = ?, band = ? WHERE id = ?').run(name, band, req.params.id)
  const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id)
  res.json(member)
})

// DELETE team member (only if no allocations)
router.delete('/:id', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM allocations WHERE team_member_id = ?').get(req.params.id)
  if (count.cnt > 0) {
    return res.status(400).json({ error: 'Cannot delete member with existing allocations. Remove their allocations first.' })
  }
  db.prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

export default router
