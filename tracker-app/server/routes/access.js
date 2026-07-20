import express from 'express'
import db from '../db.js'

const router = express.Router()

// GET all access records (joined with team member names)
router.get('/', (_req, res) => {
  const records = db.prepare(`
    SELECT a.*, tm.name as team_member_name, tm.band
    FROM access a
    JOIN team_members tm ON a.team_member_id = tm.id
    ORDER BY tm.name
  `).all()
  res.json(records)
})

// GET access by member id
router.get('/:memberId', (req, res) => {
  const record = db.prepare(`
    SELECT a.*, tm.name as team_member_name
    FROM access a
    JOIN team_members tm ON a.team_member_id = tm.id
    WHERE a.team_member_id = ?
  `).get(req.params.memberId)
  if (!record) return res.status(404).json({ error: 'Not found' })
  res.json(record)
})

// PUT update access record
router.put('/:memberId', (req, res) => {
  const { current_access, access_type, required_access } = req.body
  // Upsert: insert if not exists, update if exists
  db.prepare(`
    INSERT INTO access (team_member_id, current_access, access_type, required_access)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(team_member_id) DO UPDATE SET
      current_access = excluded.current_access,
      access_type = excluded.access_type,
      required_access = excluded.required_access
  `).run(req.params.memberId, current_access || '', access_type || '', required_access || '')
  const record = db.prepare('SELECT * FROM access WHERE team_member_id = ?').get(req.params.memberId)
  res.json(record)
})

export default router
