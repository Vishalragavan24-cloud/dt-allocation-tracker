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

app.use(cors())
app.use(express.json())

app.use('/api/team-members', teamMembersRouter)
app.use('/api/allocations', allocationsRouter)
app.use('/api/access', accessRouter)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

const distPath = path.join(__dirname, '../client/dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(200).send('<h2>Building frontend...</h2>')
  })
})

// ── Auto-seed ────────────────────────────────────────────────────────────────
function autoSeed() {
  const { cnt } = db.prepare('SELECT COUNT(*) as cnt FROM team_members').get()
  if (cnt > 0) { console.log('✅ DB already seeded'); return }
  console.log('🌱 Seeding from Excel data...')

  const MONTHS = ['October','November','December','January','February','March','April','May','June','July']
  const im = db.prepare('INSERT INTO team_members (name,band) VALUES (?,?)')
  const v = im.run('Vishalragavan M','6A').lastInsertRowid
  const p = im.run('Puja Deo','6B').lastInsertRowid
  const s = im.run('Senthil Sambhasivam','6B').lastInsertRowid

  db.prepare('INSERT OR IGNORE INTO access (team_member_id,current_access,access_type,required_access) VALUES (?,?,?,?)').run(v,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nNew Account Creation - IBM-GBS:BIWDC-IBMEMEA\nAccess to Virtual Desktop - FRPA_VDI_EndpointAuthorization\nActive Directory Role - FRPA_BP_CPS_Developers\n\nPower Automate-DOW\nPower Automate Attended License - (1 User Access)\n\nUiPath-Micron\nUiPath Studio Attended License Access - (Micron Client holds license)',
    '*Development & Test access available (Credentials available to login to Test Environment)\n*VM Development access is only available\n*VM Testing & Production access is handled by GCC team we dont have access',
    'Access To Maximo')
  db.prepare('INSERT OR IGNORE INTO access (team_member_id,current_access,access_type,required_access) VALUES (?,?,?,?)').run(p,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nNew Account Creation - IBM-GBS:BIWDC-IBMEMEA\nAccess to Virtual Desktop - FRPA_VDI_EndpointAuthorization\nActive Directory Role - FRPA_BP_CPS_Developers\nAccess To Maximo\n\nPower Automate-DOW\nPower Automate Attended License - (1 User Access)\n\nUiPath-Micron\nUiPath Studio Attended License Access - (Micron Client holds license)',
    '*Development & Test access available (Credentials available to login to Test Environment)\n*VM Development access is only available\n*VM Testing & Production access is handled by GCC team we dont have access',
    'Null')
  db.prepare('INSERT OR IGNORE INTO access (team_member_id,current_access,access_type,required_access) VALUES (?,?,?,?)').run(s,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nNew Account Creation - IBM-GBS:BIWDC-IBMEMEA\nAccess to Virtual Desktop - FRPA_VDI_EndpointAuthorization\nActive Directory Role - FRPA_BP_CPS_Developers\n\nPower Automate-DOW\nPower Automate Attended License - (1 User Access)',
    '*Development & Test access available (Credentials available to login to Test Environment)\n*VM Development access is only available\n*VM Testing & Production access is handled by GCC team we dont have access',
    'Access To Maximo')

  const ia = db.prepare(`INSERT INTO allocations (team_member_id,project,project_type,sub_project_type,charge_code,allocation_hours_per_day,start_date,end_date,status,remarks,backup_resource,workload_capacity_limit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
  const im2 = db.prepare('INSERT INTO monthly_allocations (allocation_id,month,allocation_percent,hours) VALUES (?,?,?,?)')

  function add(mid, d) {
    const id = ia.run(mid,d.p,d.pt,d.st||'',d.cc||'',d.hpd||8,d.sd||'',d.ed||'',d.s||'Active',d.r||'',d.b||'',d.c||8).lastInsertRowid
    MONTHS.forEach((m,i) => im2.run(id,m,d.m[i]?.[0]??0,d.m[i]?.[1]??0))
  }

  // ── Vishalragavan M (12 rows) ─────────────────────────────────────────────
  add(v,{p:'IPS RPA',pt:'PMA',st:'WL Gore PMA Intiative',cc:'AH2QABY2',hpd:8,sd:'2026-06-26',ed:'On Going',s:'Active',r:'DTPs Use case preparation\nPMA Data collection',b:'Puja/Senthil',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0.4,64]]})
  add(v,{p:'IPS RPA',pt:'PMA',st:'AMAT PMA Intiative',cc:'AH2QABY2',hpd:8,sd:'2026-06-15',ed:'On Going',s:'Active',r:'PMA Data collection',b:'Puja/Senthil',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.4,66],[0,0]]})
  add(v,{p:'IPS RPA',pt:'PMA',st:'MIcron DU (Document Understanding)',cc:'AH2QABY2',hpd:8,sd:'2026-04-08',ed:'On Going',s:'Active',r:'DU Access not provided',b:'Puja/Senthil',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.2,30],[0.15,24],[0,0]]})
  add(v,{p:'IPS RPA',pt:'PMA',st:'IKEA Quote Test',cc:'AH2QABY2',hpd:8,sd:'2026-04-08',ed:'On Going',s:'Active',r:'Testing',b:'Puja/Senthil',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.075,12],[0,0],[0,0],[0,0]]})
  add(v,{p:'IPS RPA',pt:'PMA',st:'Apleona Email and Attachment validation',cc:'AH2QABY2',hpd:8,sd:'2026-04-08',ed:'On Going',s:'Active',r:'PMA Data collection',b:'Puja/Senthil',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.23,38],[0,0],[0,0],[0,0]]})
  add(v,{p:'DOW',pt:'Maintenance',st:'Infrared Email Subject change',cc:'AH2QABY2',hpd:8,sd:'2026-04-08',ed:'On Going',s:'Active',r:'BOT Email Subject change',b:'Puja/Senthil',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.06,10],[0,0],[0,0],[0,0]]})
  add(v,{p:'DOW',pt:'New Project',st:'Standardize Quotes- PR to PO',cc:'AHQDCBE1',hpd:8,sd:'2026-04-09',ed:'On Going',s:'Active',r:'Testing',b:'Puja/Senthil',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.26,42],[0,0],[0,0],[0,0]]})
  add(v,{p:'DOW',pt:'Maintenance',st:'UI Change-Snow Ticket Creation (EMEAI & NAA)',cc:'AHQDCBE1',hpd:8,sd:'2026-02-04',ed:'2026-02-26',s:'Completed',r:'*PRG Tenant include in current NAA code is not required\n*NAA recode strated and completed testing recode\n*EMEAI recode completed awaiting conformation from delivery team to start NAA recode',b:'Puja/Senthil',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0.75,120],[0,0],[0.05,10],[0,0],[0,0],[0,0]]})
  add(v,{p:'Micron',pt:'New Project',st:'IR Automation',cc:'AH1QMN01',hpd:8,sd:'2025-10-15',ed:'On Going',s:'Active',r:'*Uipath DU Testing\n*UiPath DU Access request\n*UAT is in-progress\n*Worked on IR Automation Invoice extraction possibility through Extract PDF, OCR, PDF to Excel Extract\n*Extract PDF and OCR in buit in UiPath are not fesible to extract IR Invoice values, PDF to Excel Extract is fesible for only one to three line item invoice testing those scenarios.\n*Uipath version updated old version not supporting connected with IT team to get it updated and fasing system slow ness as well raised ticket and issue got resolved by 1/30/2026',b:'Puja Deo',c:8,m:[[0.7,136],[1,160],[0.95,176],[0.8,144],[0.1,16],[0.9,160],[0.36,58],[0.4,64],[0.35,56],[0,0]]})
  add(v,{p:'Micron',pt:'Maintenance',st:'Down Tool PR to PO',cc:'AH1QMN01',hpd:8,sd:'2026-03-18',ed:'On Going',s:'Active',r:'*PR falling in to exception\n*Lamreserch PR sent to Incorrect Email ID\n*Exception PR Undo not exist\n*Down Tool PR holding in queue not getting approved',b:'Puja Deo',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0.05,8],[0.3,48],[0.15,24],[0,0]]})
  add(v,{p:'Designated Holiday',pt:'Time Away',st:'Leave',cc:'XL0B00',hpd:8,sd:'-',ed:'-',s:'-',r:'5/28/2026 Bakrith\n5/1/2026 May Day\n4/10/2026 Good Friday\nMarch 19th (Ugadi)\nJanuary 15th (Pongal), 26th (Independence)\nDecember 25th (Christmas)\nOctober 1st (Dussehra ),2nd (Gandhi Jayanthi),20th (Diwali)',b:'-',c:8,m:[[0.15,24],[0,0],[0.05,8],[0.1,16],[0,0],[0.05,8],[0.05,8],[0.1,16],[0,0],[0,0]]})
  add(v,{p:'Vacation (PL)',pt:'Time Away',st:'Leave',cc:'XL0A00',hpd:8,sd:'-',ed:'-',s:'-',r:'January 14th,16th (Pongal)\nOctober 27th,28th ,29th (Medical)',b:'-',c:8,m:[[0.15,24],[0,0],[0,0],[0.1,16],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})

  // ── Puja Deo (12 rows) ────────────────────────────────────────────────────
  add(p,{p:'Dow',pt:'New Project',st:'Infrared',cc:'QDCBE',hpd:8,sd:'2025-10-01',ed:'2025-12-31',s:'Active',r:'SAP issue',b:'Senthil/Vishal',c:8,m:[[0,0],[0.15,24],[0,0],[0,0],[0.38,60],[0.64,51],[0,0],[0,0],[0,0],[0,0]]})
  add(p,{p:'Micron',pt:'New Project',st:'PR to PO Processing',cc:'AH1QMN01',hpd:8,sd:'2025-10-01',ed:'2025-12-31',s:'Active',r:'UAT is in-progress',b:'Puja/Vishal',c:8,m:[[0.61,112],[0.85,136],[0.78,144],[0.09,16],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(p,{p:'Dow',pt:'New Project',st:'BIT',cc:'AHQDCBE1',hpd:8,sd:'2025-11-10',ed:'2025-11-14',s:'Active',r:'This change is on hold. when the task resumes in Q1/ as confirmed by Vinay, we will review and adjust the timing to align with task closure and reconfirm with Vinay & Team accordingly before we start the activity',b:'Senthil/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0.35,55.5],[0.07,10],[0,24],[0,47],[0,8],[0,0]]})
  add(p,{p:'Dow',pt:'New Project',st:' PR Blocking',cc:'AHQDCBE1',hpd:8,sd:'Wednesday, February 11, 2026',ed:'On Going',s:'Active',r:'Document Creation(PDD, SDD, Business case+IPA) is in progress',b:'Senthil/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0.5],[0.29,90],[0,24],[0,80],[0,0],[0,0]]})
  add(p,{p:'DOW',pt:'Maintenance',st:' UI Elements change- PR to PO',cc:'AHQDCBE1',hpd:8,sd:'Wednesday, February 13, 2026',ed:'Wednesday, February 17, 2026',s:'Completed',r:'Issue identified and resolved by updated the code post\u2011SAP migration.',b:'Senthil/Vishal',c:8,m:[[0.22,40],[0,0],[0,0],[0,0],[0.03,4],[0,9],[0,48],[0,0],[0,122],[0,0]]})
  add(p,{p:'IPS RPA',pt:'PMA',st:'PMA Intiative',cc:'AH2QABY2',hpd:8,sd:'Thursday, January 1, 2026',ed:'On Going',s:'Active',r:'',b:'Senthil/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0.47,103],[0.25,30],[0,4],[0,0],[0,25],[0,30],[0,0]]})
  add(p,{p:'IPS RPA',pt:'PMA',st:'Case Study Slide',cc:'AH2QABY2',hpd:8,sd:'',ed:'',s:'Completed',r:'',b:'',c:8,m:[[0,0],[0,0],[0,0],[0.01,2],[0.02,2],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(p,{p:'IPS RPA',pt:'PMA',st:'weekly, Monthly and walkthrough meeting',cc:'AH2QABY2',hpd:8,sd:'',ed:'',s:'Completed',r:'',b:'',c:8,m:[[0,0],[0,0],[0,0],[0.03,6],[0,8],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(p,{p:'IPS RPA',pt:'Maintenance',st:'Micron on RPA Malfunction',cc:'AH2QABY2',hpd:8,sd:'2026-01-14',ed:'2026-01-14',s:'Completed',r:'Root cause Analysis why Bot failed to pick catalog PR# PR2099695',b:'',c:8,m:[[0,0],[0,0],[0,0],[0.03,5],[0,0],[0,4],[0,0],[0,0],[0,0],[0,0]]})
  add(p,{p:'IPS RPA',pt:'PMA',st:'Uipath-Document Understanding, Action Center, Python',cc:'AH2QABY2',hpd:8,sd:'',ed:'',s:'Active',r:'',b:'',c:8,m:[[0,0],[0,0],[0,0],[0.28,20],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(p,{p:'Designated Holiday',pt:'Time Away',st:'Leave',cc:'XL0B00',hpd:8,sd:'_',ed:'_',s:'Completed',r:'_',b:'_',c:8,m:[[0.13,24],[0,0],[0.17,32],[0.05,16],[0,0],[0,8],[0,8],[0,16],[0,0],[0,0]]})
  add(p,{p:'Vacation (PL/SL)',pt:'Time Away',st:'Leave',cc:'XL0A00',hpd:8,sd:'_',ed:'_',s:'Completed',r:'_',b:'_',c:8,m:[[0.04,8],[0,0],[0.04,8],[0.05,8],[0,0],[0,0],[0,72],[0,0],[0,0],[0,0]]})

  // ── Senthil Sambhasivam (31 rows) ─────────────────────────────────────────
  add(s,{p:'KDP',pt:'New Project',st:'Phase 1 BOT - Alteration',cc:'AH1QDP17',hpd:8,sd:'2025-10-03',ed:'2025-10-08',s:'Completed',r:'Project went on HOLD as per Delivery Team, email received from Tejus (8th Oct)',b:'Puja/Vishal',c:8,m:[[0.19,32],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'RPA',cc:'AH2QABY2',hpd:8,sd:'2025-10-09',ed:'2025-10-31',s:'Completed',r:'Supporting Activity',b:'Puja/Vishal',c:8,m:[[0.81,136],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'RPA',cc:'AH2QABY2',hpd:8,sd:'2025-11-03',ed:'2025-11-28',s:'Completed',r:'Supporting Activity',b:'Puja/Vishal',c:8,m:[[0,0],[0.94,128],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'Fixing the Non-PO invoices Macro',cc:'03UKAGQP',hpd:8,sd:'2025-11-20',ed:'2025-11-20',s:'Completed',r:'KPMG - Fixing the Non-PO invoices Macro',b:'N/A',c:8,m:[[0,0],[0.06,8],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'PMA Slide update',cc:'AH2QABY2',hpd:8,sd:'2025-12-04',ed:'On Going',s:'Active',r:'Discussed with Delivery Team & To collect Raw Dump',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[1,152],[0.74,131],[0.84,134],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'BOT run - Consignment Order',cc:'QDCAE',hpd:8,sd:'2026-01-07',ed:'2026-01-07',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'PMA, Updated Slides & Questionnaire file',cc:'AH2QABY2',hpd:8,sd:'2026-01-09',ed:'2026-01-09',s:'Completed',r:'Discussion on RECKITT- GPOH_PMA, Updated Slides & Questionnaire file',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0.02,4],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'Automation & PMA Assessment',cc:'AH2QABY2',hpd:8,sd:'2026-01-19',ed:'2026-01-19',s:'Completed',r:'Automation & PMA Assessment - Discussion & Alignment on Next Steps. Meetings & MOM creation',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0.02,3],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'Discussion on Key Best Practises',cc:'AH2QABY2',hpd:8,sd:'2026-01-21',ed:'2026-01-21',s:'Completed',r:'Key Best Practices - Discussion connected with Pavan',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0.02,4],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'Infrared BOT ID Access for Production',cc:'AH2QABY2',hpd:8,sd:'2026-01-29',ed:'2026-01-29',s:'Completed',r:'Tried to connect with the DVC to check IR BOT, since Puja was away',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0.01,2],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'Prepare the case studies from existing projects',cc:'AH2QABY2',hpd:8,sd:'2026-01-29',ed:'2026-01-30',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'Reckitt',pt:'New Project',st:'Exception Process',cc:'C.26J6D.056',hpd:8,sd:'2026-02-04',ed:'2026-02-04',s:'Completed',r:'Saubhik Approved -  2/9/2026',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'BOT run - Consignment Order',cc:'QDCAE',hpd:8,sd:'2026-02-06',ed:'2026-02-06',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'Installed in another system',cc:'AH2QABY2',hpd:8,sd:'2026-02-09',ed:'2026-02-09',s:'Completed',r:'BOT Installed in another system (Akshatha B H)',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0.01,2],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:' Fixing the Audit BOT UI Change',cc:'AH2QABY2',hpd:8,sd:'2026-02-26',ed:'2026-02-26',s:'Completed',r:'BOT got stuck due to backend update in the KDP - OKTA page. Identified & resolved it',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'PMA Slide update',cc:'AH2QABY2',hpd:8,sd:'2026-03-02',ed:'2026-03-03',s:'Completed',r:'discussion on PMA &  Automation Oppurtunity & MoM Creation & discussion',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.11,20],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'PMA',st:'PMA Slide update - VSM',cc:'AH2QABY2',hpd:8,sd:'2026-03-04',ed:'2026-03-06',s:'Completed',r:'Worked on VSM & shared with delivery team & Category Instruction',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.14,24],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'BOT run - Consignment Order',cc:'QDCAE',hpd:8,sd:'2026-03-06',ed:'2026-03-06',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'Category Instruction Check - NAA PR Validation BOTs',cc:'AHQDCBE1',hpd:8,sd:'2026-03-09',ed:'2026-03-12',s:'Completed',r:'Worked with Puja & Vishal - moved the code to Production',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.16,28],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'PMA Slide update & Blue Prism learning',cc:'AH2QABY2',hpd:8,sd:'2026-03-16',ed:'2026-03-20',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.18,32],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'Designated Holiday',pt:'Time Away',st:'Leave',cc:'XL0B00',hpd:8,sd:'2026-03-19',ed:'2026-03-19',s:'Completed',r:'IBM Holiday',b:'-',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'PMA Slide update & Blue Prism learning',cc:'AH2QABY2',hpd:8,sd:'2026-03-23',ed:'2026-03-27',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.23,40],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'PMA',cc:'AH2QABY2',hpd:8,sd:'2026-03-30',ed:'2026-03-31',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0.09,16],[0,0],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'PMA',cc:'AH2QABY2',hpd:8,sd:'2026-04-01',ed:'2026-04-02',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.09,16],[0,0],[0,0],[0,0]]})
  add(s,{p:'Designated Holiday',pt:'Time Away',st:'Leave',cc:'XL0B00',hpd:8,sd:'2026-04-03',ed:'2026-04-03',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'BOT run - Consignment Order',cc:'QDCAE',hpd:8,sd:'2026-04-07',ed:'2026-04-07',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0]]})
  add(s,{p:'Reckitt',pt:'New Project',st:'Exception Process',cc:'C.26J6D.056',hpd:8,sd:'2026-05-05',ed:'On Going',s:'Active',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,8],[0,48],[0,32]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'BOT run - Consignment Order',cc:'QDCAE',hpd:8,sd:'2026-05-06',ed:'2026-05-06',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,8],[0,0],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'BOT run - Consignment Order',cc:'QDCAE',hpd:8,sd:'2026-06-03',ed:'2026-06-03',s:'Completed',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,8],[0,0]]})
  add(s,{p:'IPS RPA',pt:'Maintenance',st:'BOT maintenance',cc:'AH2QABY2',hpd:8,sd:'2026-05-01',ed:'On Going',s:'Active',r:'',b:'Puja/Vishal',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,136],[0,120],[0,32]]})
  add(s,{p:'Designated Holiday',pt:'Time Away',st:'Leave',cc:'XL0B00',hpd:8,sd:'-',ed:'-',s:'Active',r:'',b:'-',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,16],[0,0],[0,0]]})
  add(s,{p:'Vacation (PL)',pt:'Time Away',st:'Leave',cc:'XL0A00',hpd:8,sd:'-',ed:'-',s:'Active',r:'',b:'-',c:8,m:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,8],[0,8],[0,0]]})

  const total = db.prepare('SELECT COUNT(*) as c FROM allocations').get().c
  console.log(`✅ Seeded: ${total} allocations across 3 members`)
}

autoSeed()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`)
})
