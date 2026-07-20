// server/seed.js  — seeds the SQLite DB with all data from the Excel tracker
import db from './db.js'

const MONTHS = ['October','November','December','January','February','March','April','May','June','July']

function seedIfEmpty() {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM team_members').get()
  if (existing.cnt > 0) {
    console.log('✅ Database already seeded. Skipping.')
    return
  }

  console.log('🌱 Seeding database...')

  // ── Team Members ───────────────────────────────────────────────────────────
  const insertMember = db.prepare('INSERT INTO team_members (name, band) VALUES (?, ?)')
  const v = insertMember.run('Vishalragavan M', '6A').lastInsertRowid
  const p = insertMember.run('Puja Deo', '6B').lastInsertRowid
  const s = insertMember.run('Senthil Sambhasivam', '6B').lastInsertRowid

  // ── Access Records ─────────────────────────────────────────────────────────
  const insertAccess = db.prepare('INSERT INTO access (team_member_id, current_access, access_type, required_access) VALUES (?,?,?,?)')
  insertAccess.run(p,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nNew Account Creation - IBM-GBS:BIWDC-IBMEMEA\nAccess to Virtual Desktop - FRPA_VDI_EndpointAuthorization\nActive Directory Role - FRPA_BP_CPS_Developers\nAccess To Maximo\n\nPower Automate-DOW\nPower Automate Attended License - (1 User Access)\n\nUiPath-Micron\nUiPath Studio Attended License Access - (Micron Client holds license)',
    '*Development & Test access available (Credentials available to login to Test Environment)\n*VM Development access is only available\n*VM Testing & Production access is handled by GCC team we dont have access',
    'Null'
  )
  insertAccess.run(v,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nNew Account Creation - IBM-GBS:BIWDC-IBMEMEA\nAccess to Virtual Desktop - FRPA_VDI_EndpointAuthorization\nActive Directory Role - FRPA_BP_CPS_Developers\n\nPower Automate-DOW\nPower Automate Attended License - (1 User Access)\n\nUiPath-Micron\nUiPath Studio Attended License Access - (Micron Client holds license)',
    '*Development & Test access available (Credentials available to login to Test Environment)\n*VM Development access is only available\n*VM Testing & Production access is handled by GCC team we dont have access',
    'Access To Maximo'
  )
  insertAccess.run(s,
    'IBM Cloud (Blue Prism)-DOW\nRPA Control List Access - CBR_IBM-GBS-BI-XTW-BI_WIN_AccessControl\nNew Account Creation - IBM-GBS:BIWDC-IBMEMEA\nAccess to Virtual Desktop - FRPA_VDI_EndpointAuthorization\nActive Directory Role - FRPA_BP_CPS_Developers\n\nPower Automate-DOW\nPower Automate Attended License - (1 User Access)',
    '*Development & Test access available (Credentials available to login to Test Environment)\n*VM Development access is only available\n*VM Testing & Production access is handled by GCC team we dont have access',
    'Access To Maximo'
  )

  // ── Helper ─────────────────────────────────────────────────────────────────
  const insertAlloc = db.prepare(`
    INSERT INTO allocations (team_member_id, project, project_type, sub_project_type, charge_code,
      allocation_hours_per_day, start_date, end_date, status, remarks, backup_resource, workload_capacity_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertMonth = db.prepare('INSERT INTO monthly_allocations (allocation_id, month, allocation_percent, hours) VALUES (?, ?, ?, ?)')

  function addAllocation(memberId, { project, projectType, subType, chargeCode, hoursPerDay, startDate, endDate, status, remarks, backup, capacity, months }) {
    const info = insertAlloc.run(memberId, project, projectType, subType || '', chargeCode || '', hoursPerDay || 8, startDate || '', endDate || '', status || 'Active', remarks || '', backup || '', capacity || 8)
    const id = info.lastInsertRowid
    MONTHS.forEach((m, i) => {
      const pct = months[i]?.[0] ?? 0
      const hrs = months[i]?.[1] ?? 0
      insertMonth.run(id, m, pct, hrs)
    })
  }

  // ── Vishalragavan M allocations ────────────────────────────────────────────
  // Oct Nov Dec Jan Feb Mar Apr May Jun Jul  — pairs of [percent, hours]
  addAllocation(v, { project:'IPS RPA', projectType:'PMA', subType:'WL Gore PMA Intiative', chargeCode:'AH2QABY2', startDate:'2026-06-26', endDate:'On Going', status:'Active', remarks:'DTPs Use case preparation\nPMA Data collection', backup:'Puja/Senthil', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0.4,64] ] })
  addAllocation(v, { project:'IPS RPA', projectType:'PMA', subType:'AMAT PMA Intiative', chargeCode:'AH2QABY2', startDate:'2026-06-15', endDate:'On Going', status:'Active', remarks:'PMA Data collection', backup:'Puja/Senthil', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.4,66],[0,0] ] })
  addAllocation(v, { project:'IPS RPA', projectType:'PMA', subType:'MIcron DU (Document Understanding)', chargeCode:'AH2QABY2', startDate:'2026-04-08', endDate:'On Going', status:'Active', remarks:'DU Access not provided', backup:'Puja/Senthil', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.2,30],[0.15,24],[0,0] ] })
  addAllocation(v, { project:'IPS RPA', projectType:'PMA', subType:'IKEA Quote Test', chargeCode:'AH2QABY2', startDate:'2026-04-08', endDate:'On Going', status:'Active', remarks:'Testing', backup:'Puja/Senthil', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.075,12],[0,0],[0,0],[0,0] ] })
  addAllocation(v, { project:'IPS RPA', projectType:'PMA', subType:'Apleona Email and Attachment validation', chargeCode:'AH2QABY2', startDate:'2026-04-08', endDate:'On Going', status:'Active', remarks:'PMA Data collection', backup:'Puja/Senthil', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.23,38],[0,0],[0,0],[0,0] ] })
  addAllocation(v, { project:'DOW', projectType:'Maintenance', subType:'Infrared Email Subject change', chargeCode:'AH2QABY2', startDate:'2026-04-08', endDate:'On Going', status:'Active', remarks:'BOT Email Subject change', backup:'Puja/Senthil', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.06,10],[0,0],[0,0],[0,0] ] })
  addAllocation(v, { project:'DOW', projectType:'New Project', subType:'Standardize Quotes- PR to PO', chargeCode:'AHQDCBE1', startDate:'2026-04-09', endDate:'On Going', status:'Active', remarks:'Testing', backup:'Puja/Senthil', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.26,42],[0,0],[0,0],[0,0] ] })
  addAllocation(v, { project:'DOW', projectType:'Maintenance', subType:'UI Change-Snow Ticket Creation (EMEAI & NAA)', chargeCode:'AHQDCBE1', startDate:'2026-02-04', endDate:'2026-02-26', status:'Completed', remarks:'PRG Tenant include in current NAA code is not required\nNAA recode started and completed testing\nEMEAI recode completed awaiting confirmation', backup:'Puja/Senthil', months:[ [0,0],[0,0],[0,0],[0,0],[0.75,120],[0,0],[0.05,10],[0,0],[0,0],[0,0] ] })
  addAllocation(v, { project:'Micron', projectType:'New Project', subType:'IR Automation', chargeCode:'AH1QMN01', startDate:'2025-10-15', endDate:'On Going', status:'Active', remarks:'UiPath DU Testing\nUiPath DU Access request\nUAT is in-progress\nWorked on IR Automation Invoice extraction\nExtract PDF and OCR not feasible\nPDF to Excel Extract feasible for single invoice\nUipath version updated - issue resolved 1/30/2026', backup:'Puja Deo', months:[ [0.7,136],[1,160],[0.95,176],[0.8,144],[0.1,16],[0.9,160],[0.36,58],[0.4,64],[0.35,56],[0,0] ] })
  addAllocation(v, { project:'Micron', projectType:'Maintenance', subType:'Down Tool PR to PO', chargeCode:'AH1QMN01', startDate:'2026-03-18', endDate:'On Going', status:'Active', remarks:'PR falling into exception\nLamreserch PR sent to Incorrect Email ID\nException PR Undo not exist\nDown Tool PR holding in queue not getting approved', backup:'Puja Deo', months:[ [0,0],[0,0],[0,0],[0,0],[0.05,8],[0.05,8],[0.3,48],[0.15,24],[0,0],[0,0] ] })
  addAllocation(v, { project:'Designated Holiday', projectType:'Time Away', subType:'Leave', chargeCode:'XL0B00', startDate:'-', endDate:'-', status:'-', remarks:'5/28/2026 Bakrith\n5/1/2026 May Day\n4/10/2026 Good Friday\nMarch 19th (Ugadi)\nJanuary 15th (Pongal), 26th (Independence)\nDecember 25th (Christmas)\nOctober 1st (Dussehra), 2nd (Gandhi Jayanthi), 20th (Diwali)', backup:'-', months:[ [0.15,24],[0,0],[0.05,8],[0.1,16],[0,0],[0.05,8],[0.05,8],[0.1,16],[0,0],[0,0] ] })
  addAllocation(v, { project:'Vacation (PL)', projectType:'Time Away', subType:'Leave', chargeCode:'XL0A00', startDate:'-', endDate:'-', status:'-', remarks:'January 14th, 16th (Pongal)\nOctober 27th, 28th, 29th (Medical)', backup:'-', months:[ [0.15,24],[0,0],[0,0],[0.1,16],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })

  // ── Puja Deo allocations ───────────────────────────────────────────────────
  addAllocation(p, { project:'Dow', projectType:'New Project', subType:'Infrared', chargeCode:'QDCBE', startDate:'2025-10-01', endDate:'2025-12-31', status:'Active', remarks:'SAP issue', backup:'Senthil/Vishal', months:[ [0,0],[0.15,24],[0,0],[0,0],[0.38,60],[0.64,51],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(p, { project:'Micron', projectType:'New Project', subType:'PR to PO Processing', chargeCode:'AH1QMN01', startDate:'2025-10-01', endDate:'2025-12-31', status:'Active', remarks:'UAT is in-progress', backup:'Puja/Vishal', months:[ [0.61,112],[0.85,136],[0.78,144],[0.09,16],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(p, { project:'Dow', projectType:'New Project', subType:'BIT', chargeCode:'AHQDCBE1', startDate:'2025-11-10', endDate:'2025-11-14', status:'Active', remarks:'This change is on hold. When the task resumes in Q1, we will review and adjust timing accordingly.', backup:'Senthil/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0.35,55.5],[0.07,10],[0,24],[0,47],[0,8],[0,0] ] })
  addAllocation(p, { project:'Dow', projectType:'New Project', subType:'PR Blocking', chargeCode:'AHQDCBE1', startDate:'2026-02-11', endDate:'On Going', status:'Active', remarks:'Document Creation (PDD, SDD, Business case+IPA) is in progress', backup:'Senthil/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0.5],[0.29,90],[0,24],[0,80],[0,0],[0,0] ] })
  addAllocation(p, { project:'DOW', projectType:'Maintenance', subType:'UI Elements change- PR to PO', chargeCode:'AHQDCBE1', startDate:'2026-02-13', endDate:'2026-02-17', status:'Completed', remarks:'Issue identified and resolved by updated the code post-SAP migration.', backup:'Senthil/Vishal', months:[ [0.22,40],[0,0],[0,0],[0,0],[0.03,4],[0,9],[0,48],[0,0],[0,122],[0,0] ] })
  addAllocation(p, { project:'IPS RPA', projectType:'PMA', subType:'PMA Intiative', chargeCode:'AH2QABY2', startDate:'2026-01-01', endDate:'On Going', status:'Active', remarks:'', backup:'Senthil/Vishal', months:[ [0,0],[0,0],[0,0],[0.47,103],[0.25,30],[0,4],[0,0],[0,25],[0,30],[0,0] ] })
  addAllocation(p, { project:'IPS RPA', projectType:'PMA', subType:'Case Study Slide', chargeCode:'AH2QABY2', startDate:'', endDate:'', status:'Completed', remarks:'', backup:'', months:[ [0,0],[0,0],[0,0],[0.01,2],[0.02,2],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(p, { project:'IPS RPA', projectType:'PMA', subType:'Weekly, Monthly and Walkthrough Meeting', chargeCode:'AH2QABY2', startDate:'', endDate:'', status:'Completed', remarks:'', backup:'', months:[ [0,0],[0,0],[0,0],[0.03,6],[0,8],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(p, { project:'IPS RPA', projectType:'Maintenance', subType:'Micron on RPA Malfunction', chargeCode:'AH2QABY2', startDate:'2026-01-14', endDate:'2026-01-14', status:'Completed', remarks:'Root cause Analysis why Bot failed to pick catalog PR# PR2099695', backup:'', months:[ [0,0],[0,0],[0,0],[0.03,5],[0,0],[0,4],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(p, { project:'IPS RPA', projectType:'PMA', subType:'UiPath-Document Understanding, Action Center, Python', chargeCode:'AH2QABY2', startDate:'', endDate:'', status:'Active', remarks:'', backup:'', months:[ [0,0],[0,0],[0,0],[0.28,20],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(p, { project:'Designated Holiday', projectType:'Time Away', subType:'Leave', chargeCode:'XL0B00', startDate:'_', endDate:'_', status:'Completed', remarks:'_', backup:'_', months:[ [0.13,24],[0,0],[0.17,32],[0.05,16],[0,0],[0,8],[0,8],[0,16],[0,0],[0,0] ] })
  addAllocation(p, { project:'Vacation (PL/SL)', projectType:'Time Away', subType:'Leave', chargeCode:'XL0A00', startDate:'_', endDate:'_', status:'Completed', remarks:'_', backup:'_', months:[ [0.04,8],[0,0],[0.04,8],[0.05,8],[0,0],[0,0],[0,72],[0,0],[0,0],[0,0] ] })

  // ── Senthil Sambhasivam allocations ────────────────────────────────────────
  addAllocation(s, { project:'KDP', projectType:'New Project', subType:'Phase 1 BOT - Alteration', chargeCode:'AH1QDP17', startDate:'2025-10-03', endDate:'2025-10-08', status:'Completed', remarks:'Project went on HOLD as per Delivery Team, email received from Tejus (8th Oct)', backup:'Puja/Vishal', months:[ [0.19,32],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'RPA - Supporting Activity', chargeCode:'AH2QABY2', startDate:'2025-10-09', endDate:'2025-10-31', status:'Completed', remarks:'Supporting Activity', backup:'Puja/Vishal', months:[ [0.81,136],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'RPA - Supporting Activity Nov', chargeCode:'AH2QABY2', startDate:'2025-11-03', endDate:'2025-11-28', status:'Completed', remarks:'Supporting Activity', backup:'Puja/Vishal', months:[ [0,0],[0.94,128],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'Fixing the Non-PO invoices Macro', chargeCode:'03UKAGQP', startDate:'2025-11-20', endDate:'2025-11-20', status:'Completed', remarks:'KPMG - Fixing the Non-PO invoices Macro', backup:'N/A', months:[ [0,0],[0.06,8],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'PMA Slide update', chargeCode:'AH2QABY2', startDate:'2025-12-04', endDate:'On Going', status:'Active', remarks:'Discussed with Delivery Team & To collect Raw Dump', backup:'Puja/Vishal', months:[ [0,0],[0,0],[1,152],[0.74,131],[0.84,134],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'BOT run - Consignment Order', chargeCode:'QDCAE', startDate:'2026-01-07', endDate:'2026-01-07', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'PMA, Updated Slides & Questionnaire file', chargeCode:'AH2QABY2', startDate:'2026-01-09', endDate:'2026-01-09', status:'Completed', remarks:'Discussion on RECKITT- GPOH_PMA, Updated Slides & Questionnaire file', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0.02,4],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'Automation & PMA Assessment', chargeCode:'AH2QABY2', startDate:'2026-01-19', endDate:'2026-01-19', status:'Completed', remarks:'Automation & PMA Assessment - Discussion & Alignment on Next Steps', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0.02,3],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'Discussion on Key Best Practises', chargeCode:'AH2QABY2', startDate:'2026-01-21', endDate:'2026-01-21', status:'Completed', remarks:'Key Best Practices - Discussion connected with Pavan', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0.02,4],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'Infrared BOT ID Access for Production', chargeCode:'AH2QABY2', startDate:'2026-01-29', endDate:'2026-01-29', status:'Completed', remarks:'Tried to connect with the DVC to check IR BOT, since Puja was away', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0.01,2],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'Prepare the case studies from existing projects', chargeCode:'AH2QABY2', startDate:'2026-01-29', endDate:'2026-01-30', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'Reckitt', projectType:'New Project', subType:'Exception Process', chargeCode:'C.26J6D.056', startDate:'2026-02-04', endDate:'2026-02-04', status:'Completed', remarks:'Saubhik Approved - 2/9/2026', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'BOT run - Consignment Order Feb', chargeCode:'QDCAE', startDate:'2026-02-06', endDate:'2026-02-06', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'Installed in another system', chargeCode:'AH2QABY2', startDate:'2026-02-09', endDate:'2026-02-09', status:'Completed', remarks:'BOT Installed in another system (Akshatha B H)', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0.01,2],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'Fixing the Audit BOT UI Change', chargeCode:'AH2QABY2', startDate:'2026-02-26', endDate:'2026-02-26', status:'Completed', remarks:'BOT got stuck due to backend update in the KDP - OKTA page. Identified & resolved it', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'PMA Slide update - MOM Creation', chargeCode:'AH2QABY2', startDate:'2026-03-02', endDate:'2026-03-03', status:'Completed', remarks:'Discussion on PMA & Automation Opportunity & MoM Creation & discussion', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0.11,20],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'PMA', subType:'PMA Slide update - VSM', chargeCode:'AH2QABY2', startDate:'2026-03-04', endDate:'2026-03-06', status:'Completed', remarks:'Worked on VSM & shared with delivery team & Category Instruction', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0.14,24],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'BOT run - Consignment Order Mar', chargeCode:'QDCAE', startDate:'2026-03-06', endDate:'2026-03-06', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'Category Instruction Check - NAA PR Validation BOTs', chargeCode:'AHQDCBE1', startDate:'2026-03-09', endDate:'2026-03-12', status:'Completed', remarks:'Worked with Puja & Vishal - moved the code to Production', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0.16,28],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'PMA Slide update & Blue Prism learning', chargeCode:'AH2QABY2', startDate:'2026-03-16', endDate:'2026-03-20', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0.18,32],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'Designated Holiday', projectType:'Time Away', subType:'Leave', chargeCode:'XL0B00', startDate:'2026-03-19', endDate:'2026-03-19', status:'Completed', remarks:'IBM Holiday', backup:'-', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'PMA Slide update & Blue Prism learning 2', chargeCode:'AH2QABY2', startDate:'2026-03-23', endDate:'2026-03-27', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0.23,40],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'PMA - End of March', chargeCode:'AH2QABY2', startDate:'2026-03-30', endDate:'2026-03-31', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0.09,16],[0,0],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'PMA - Start of April', chargeCode:'AH2QABY2', startDate:'2026-04-01', endDate:'2026-04-02', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.09,16],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'Designated Holiday', projectType:'Time Away', subType:'Leave - Good Friday', chargeCode:'XL0B00', startDate:'2026-04-03', endDate:'2026-04-03', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'BOT run - Consignment Order Apr', chargeCode:'QDCAE', startDate:'2026-04-07', endDate:'2026-04-07', status:'Completed', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.05,8],[0,0],[0,0],[0,0] ] })
  addAllocation(s, { project:'Reckitt', projectType:'New Project', subType:'Exception Process - New Automation', chargeCode:'C.26J6D.056', startDate:'2026-05-01', endDate:'On Going', status:'Active', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,8],[0,48],[0,32] ] })
  addAllocation(s, { project:'IPS RPA', projectType:'Maintenance', subType:'BOT maintenance - General', chargeCode:'AH2QABY2', startDate:'2026-05-01', endDate:'On Going', status:'Active', remarks:'', backup:'Puja/Vishal', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,136],[0,120],[0,32] ] })
  addAllocation(s, { project:'Designated Holiday', projectType:'Time Away', subType:'Leave', chargeCode:'XL0B00', startDate:'-', endDate:'-', status:'Active', remarks:'', backup:'-', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,16],[0,0],[0,0] ] })
  addAllocation(s, { project:'Vacation (PL)', projectType:'Time Away', subType:'Leave', chargeCode:'XL0A00', startDate:'-', endDate:'-', status:'Active', remarks:'', backup:'-', months:[ [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,8],[0,8],[0,0] ] })

  console.log('✅ Database seeded successfully!')
  console.log(`   - 3 team members`)
  console.log(`   - 3 access records`)
  console.log(`   - ${db.prepare('SELECT COUNT(*) as cnt FROM allocations').get().cnt} allocation rows`)
  console.log(`   - ${db.prepare('SELECT COUNT(*) as cnt FROM monthly_allocations').get().cnt} monthly allocation entries`)
}

seedIfEmpty()
