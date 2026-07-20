import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import teamMembersRouter from './routes/teamMembers.js'
import allocationsRouter from './routes/allocations.js'
import accessRouter from './routes/access.js'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000
const IS_PROD = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/team-members', teamMembersRouter)
app.use('/api/allocations', allocationsRouter)
app.use('/api/access', accessRouter)

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }))

// Serve built React frontend (production)
const distPath = path.join(__dirname, '../client/dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  const indexFile = path.join(distPath, 'index.html')
  res.sendFile(indexFile, (err) => {
    if (err) res.status(200).send(`
      <h2>Digital Transformation Tracker</h2>
      <p>Frontend not built yet. It will be ready after the first deploy.</p>
    `)
  })
})

// Auto-seed database on startup if empty
function autoSeed() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM team_members').get()
  if (count.cnt > 0) {
    console.log('✅ Database already has data — skipping seed')
    return
  }

  console.log('🌱 Auto-seeding database with initial data...')

  const MONTHS = ['October','November','December','January','February','March','April','May','June','July']
  const insertMember = db.prepare('INSERT INTO team_members (name, band) VALUES (?, ?)')
  const v = insertMember.run('Vishalragavan M', '6A').lastInsertRowid
  const p = insertMember.run('Puja Deo', '6B').lastInsertRowid
  const s = insertMember.run('Senthil Sambhasivam', '6B').lastInsertRowid

  const insertAccess = db.prepare('INSERT OR IGNORE INTO access (team_member_id, current_access, access_type, required_access) VALUES (?,?,?,?)')
  insertAccess.run(p,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nPower Automate-DOW\nPower Automate Attended License\nUiPath-Micron\nUiPath Studio Attended License Access',
    '*Development & Test access available\n*VM Development access only\n*VM Testing & Production handled by GCC team',
    'Null'
  )
  insertAccess.run(v,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nPower Automate-DOW\nPower Automate Attended License\nUiPath-Micron\nUiPath Studio Attended License Access',
    '*Development & Test access available\n*VM Development access only\n*VM Testing & Production handled by GCC team',
    'Access To Maximo'
  )
  insertAccess.run(s,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nPower Automate-DOW\nPower Automate Attended License',
    '*Development & Test access available\n*VM Development access only\n*VM Testing & Production handled by GCC team',
    'Access To Maximo'
  )

  const insertAlloc = db.prepare(`INSERT INTO allocations (team_member_id,project,project_type,sub_project_type,charge_code,allocation_hours_per_day,start_date,end_date,status,remarks,backup_resource,workload_capacity_limit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
  const insertMonth = db.prepare('INSERT INTO monthly_allocations (allocation_id,month,allocation_percent,hours) VALUES (?,?,?,?)')

  function addAlloc(memberId, d) {
    const id = insertAlloc.run(memberId, d.project, d.projectType, d.subType||'', d.chargeCode||'', d.hoursPerDay||8, d.startDate||'', d.endDate||'', d.status||'Active', d.remarks||'', d.backup||'', d.capacity||8).lastInsertRowid
    MONTHS.forEach((m, i) => insertMonth.run(id, m, d.months[i]?.[0]??0, d.months[i]?.[1]??0))
  }

  // Vishalragavan M
  addAlloc(v, {project:'Micron',projectType:'New Project',subType:'IR Automation',chargeCode:'AH1QMN01',startDate:'2025-10-15',endDate:'On Going',status:'Active',remarks:'UiPath DU Testing - UAT in progress',backup:'Puja Deo',months:[[0.7,136],[1,160],[0.95,176],[0.8,144],[0.1,16],[0.9,160],[0.36,58],[0.4,64],[0.35,56],[0,0]]})
  addAlloc(v, {project:'DOW',projectType:'Maintenance',subType:'UI Change-Snow Ticket Creation',chargeCode:'AHQDCBE1',startDate:'2026-02-04',endDate:'2026-02-26',status:'Completed',remarks:'NAA recode completed',backup:'Puja/Senthil',months:[[0,0],[0,0],[0,0],[0,0],[0.75,120],[0,0],[0.05,10],[0,0],[0,0],[0,0]]})
  addAlloc(v, {project:'IPS RPA',projectType:'PMA',subType:'WL Gore PMA Initiative',chargeCode:'AH2QABY2',startDate:'2026-06-26',endDate:'On Going',status:'Active',remarks:'DTPs Use case preparation',backup:'Puja/Senthil',months:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0.4,64]]})
  addAlloc(v, {project:'IPS RPA',projectType:'PMA',subType:'AMAT PMA Initiative',chargeCode:'AH2QABY2',startDate:'2026-06-15',endDate:'On Going',status:'Active',remarks:'PMA Data collection',backup:'Puja/Senthil',months:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.4,66],[0,0]]})
  addAlloc(v, {project:'IPS RPA',projectType:'PMA',subType:'Micron DU (Document Understanding)',chargeCode:'AH2QABY2',startDate:'2026-04-08',endDate:'On Going',status:'Active',remarks:'DU Access not provided',backup:'Puja/Senthil',months:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.2,30],[0.15,24],[0,0]]})
  addAlloc(v, {project:'DOW',projectType:'New Project',subType:'Standardize Quotes- PR to PO',chargeCode:'AHQDCBE1',startDate:'2026-04-09',endDate:'On Going',status:'Active',remarks:'Testing',backup:'Puja/Senthil',months:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.26,42],[0,0],[0,0],[0,0]]})
  addAlloc(v, {project:'Micron',projectType:'Maintenance',subType:'Down Tool PR to PO',chargeCode:'AH1QMN01',startDate:'2026-03-18',endDate:'On Going',status:'Active',remarks:'PR falling into exception',backup:'Puja Deo',months:[[0,0],[0,0],[0,0],[0,0],[0.05,8],[0.05,8],[0.3,48],[0.15,24],[0,0],[0,0]]})
  addAlloc(v, {project:'Designated Holiday',projectType:'Time Away',subType:'Leave',chargeCode:'XL0B00',startDate:'-',endDate:'-',status:'-',remarks:'Oct 1st (Dussehra), Dec 25 (Christmas), Jan 15 (Pongal)',backup:'-',months:[[0.15,24],[0,0],[0.05,8],[0.1,16],[0,0],[0.05,8],[0.05,8],[0.1,16],[0,0],[0,0]]})
  addAlloc(v, {project:'Vacation (PL)',projectType:'Time Away',subType:'Leave',chargeCode:'XL0A00',startDate:'-',endDate:'-',status:'-',remarks:'January 14th, 16th (Pongal)',backup:'-',months:[[0.15,24],[0,0],[0,0],[0.1,16],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})

  // Puja Deo
  addAlloc(p, {project:'Micron',projectType:'New Project',subType:'PR to PO Processing',chargeCode:'AH1QMN01',startDate:'2025-10-01',endDate:'2025-12-31',status:'Active',remarks:'UAT is in-progress',backup:'Puja/Vishal',months:[[0.61,112],[0.85,136],[0.78,144],[0.09,16],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  addAlloc(p, {project:'Dow',projectType:'New Project',subType:'Infrared',chargeCode:'QDCBE',startDate:'2025-10-01',endDate:'2025-12-31',status:'Active',remarks:'SAP issue',backup:'Senthil/Vishal',months:[[0,0],[0.15,24],[0,0],[0,0],[0.38,60],[0.64,51],[0,0],[0,0],[0,0],[0,0]]})
  addAlloc(p, {project:'Dow',projectType:'New Project',subType:'PR Blocking',chargeCode:'AHQDCBE1',startDate:'2026-02-11',endDate:'On Going',status:'Active',remarks:'Document Creation (PDD, SDD) in progress',backup:'Senthil/Vishal',months:[[0,0],[0,0],[0,0],[0,0],[0,0.5],[0.29,90],[0,24],[0,80],[0,0],[0,0]]})
  addAlloc(p, {project:'IPS RPA',projectType:'PMA',subType:'PMA Initiative',chargeCode:'AH2QABY2',startDate:'2026-01-01',endDate:'On Going',status:'Active',remarks:'',backup:'Senthil/Vishal',months:[[0,0],[0,0],[0,0],[0.47,103],[0.25,30],[0,4],[0,0],[0,25],[0,30],[0,0]]})
  addAlloc(p, {project:'DOW',projectType:'Maintenance',subType:'UI Elements change- PR to PO',chargeCode:'AHQDCBE1',startDate:'2026-02-13',endDate:'2026-02-17',status:'Completed',remarks:'Issue resolved post-SAP migration',backup:'Senthil/Vishal',months:[[0.22,40],[0,0],[0,0],[0,0],[0.03,4],[0,9],[0,48],[0,0],[0,122],[0,0]]})
  addAlloc(p, {project:'Designated Holiday',projectType:'Time Away',subType:'Leave',chargeCode:'XL0B00',startDate:'_',endDate:'_',status:'Completed',remarks:'_',backup:'_',months:[[0.13,24],[0,0],[0.17,32],[0.05,16],[0,0],[0,8],[0,8],[0,16],[0,0],[0,0]]})
  addAlloc(p, {project:'Vacation (PL/SL)',projectType:'Time Away',subType:'Leave',chargeCode:'XL0A00',startDate:'_',endDate:'_',status:'Completed',remarks:'_',backup:'_',months:[[0.04,8],[0,0],[0.04,8],[0.05,8],[0,0],[0,0],[0,72],[0,0],[0,0],[0,0]]})

  // Senthil Sambhasivam
  addAlloc(s, {project:'KDP',projectType:'New Project',subType:'Phase 1 BOT - Alteration',chargeCode:'AH1QDP17',startDate:'2025-10-03',endDate:'2025-10-08',status:'Completed',remarks:'Project went on HOLD',backup:'Puja/Vishal',months:[[0.19,32],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  addAlloc(s, {project:'IPS RPA',projectType:'PMA',subType:'RPA - Supporting Activity',chargeCode:'AH2QABY2',startDate:'2025-11-03',endDate:'2025-11-28',status:'Completed',remarks:'Supporting Activity',backup:'Puja/Vishal',months:[[0.81,136],[0.94,128],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  addAlloc(s, {project:'IPS RPA',projectType:'PMA',subType:'PMA Slide update',chargeCode:'AH2QABY2',startDate:'2025-12-04',endDate:'On Going',status:'Active',remarks:'Discussed with Delivery Team',backup:'Puja/Vishal',months:[[0,0],[0,0],[1,152],[0.74,131],[0.84,134],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  addAlloc(s, {project:'IPS RPA',projectType:'Maintenance',subType:'Category Instruction Check - NAA PR Validation',chargeCode:'AHQDCBE1',startDate:'2026-03-09',endDate:'2026-03-12',status:'Completed',remarks:'Moved code to Production',backup:'Puja/Vishal',months:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.16,28],[0,0],[0,0],[0,0],[0,0]]})
  addAlloc(s, {project:'IPS RPA',projectType:'Maintenance',subType:'BOT maintenance - General',chargeCode:'AH2QABY2',startDate:'2026-05-01',endDate:'On Going',status:'Active',remarks:'',backup:'Puja/Vishal',months:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,136],[0,120],[0,32]]})
  addAlloc(s, {project:'Reckitt',projectType:'New Project',subType:'Exception Process',chargeCode:'C.26J6D.056',startDate:'2026-02-04',endDate:'On Going',status:'Active',remarks:'Saubhik Approved 2/9/2026',backup:'Puja/Vishal',months:[[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,8],[0,48],[0,32]]})
  addAlloc(s, {project:'Designated Holiday',projectType:'Time Away',subType:'Leave',chargeCode:'XL0B00',startDate:'-',endDate:'-',status:'Active',remarks:'',backup:'-',months:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0.05,8],[0,16],[0,0],[0,0]]})
  addAlloc(s, {project:'Vacation (PL)',projectType:'Time Away',subType:'Leave',chargeCode:'XL0A00',startDate:'-',endDate:'-',status:'Active',remarks:'',backup:'-',months:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,8],[0,8],[0,0]]})

  console.log(`✅ Seeded: ${db.prepare('SELECT COUNT(*) as c FROM allocations').get().c} allocations, 3 members`)
}

autoSeed()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`)
})
