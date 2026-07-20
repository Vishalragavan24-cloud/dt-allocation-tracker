// Pure WebAssembly SQLite — no native compilation, works on any Node version
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR = process.env.RENDER ? '/tmp' : __dirname
const DB_PATH = path.join(DB_DIR, 'tracker.db')

// Initialize sql.js synchronously-ish via top-level await (ES module)
const SQL = await initSqlJs()

// Load existing DB from disk or create fresh
let db
if (fs.existsSync(DB_PATH)) {
  const fileBuffer = fs.readFileSync(DB_PATH)
  db = new SQL.Database(fileBuffer)
} else {
  db = new SQL.Database()
}

// Persist db to disk after every write
function persist() {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

// Create schema
db.run(`PRAGMA foreign_keys = ON;`)
db.run(`
  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    band TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_member_id INTEGER NOT NULL,
    project TEXT NOT NULL DEFAULT '',
    project_type TEXT NOT NULL DEFAULT '',
    sub_project_type TEXT DEFAULT '',
    charge_code TEXT DEFAULT '',
    allocation_hours_per_day INTEGER DEFAULT 8,
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    status TEXT DEFAULT 'Active',
    remarks TEXT DEFAULT '',
    backup_resource TEXT DEFAULT '',
    workload_capacity_limit INTEGER DEFAULT 8,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS monthly_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    allocation_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    allocation_percent REAL DEFAULT 0,
    hours REAL DEFAULT 0,
    FOREIGN KEY (allocation_id) REFERENCES allocations(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_member_id INTEGER NOT NULL UNIQUE,
    current_access TEXT DEFAULT '',
    access_type TEXT DEFAULT '',
    required_access TEXT DEFAULT '',
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
  );
`)
persist()

// Helper: convert sql.js result rows to array of objects
function rowsToObjects(result) {
  if (!result || result.length === 0) return []
  const { columns, values } = result[0]
  return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])))
}

// Thin wrapper to mimic better-sqlite3 API used in routes
const dbWrapper = {
  prepare(sql) {
    return {
      all(...params) {
        try {
          const result = db.exec(sql, params.flat())
          return rowsToObjects(result)
        } catch (e) { console.error('DB all error:', e.message, sql); return [] }
      },
      get(...params) {
        try {
          const result = db.exec(sql, params.flat())
          const rows = rowsToObjects(result)
          return rows[0] || null
        } catch (e) { console.error('DB get error:', e.message, sql); return null }
      },
      run(...params) {
        try {
          db.run(sql, params.flat())
          persist()
          const idResult = db.exec('SELECT last_insert_rowid() as id')
          const changesResult = db.exec('SELECT changes() as c')
          const id = idResult[0]?.values[0]?.[0] || 0
          const changes = changesResult[0]?.values[0]?.[0] || 0
          return { lastInsertRowid: id, changes }
        } catch (e) { console.error('DB run error:', e.message, sql); return { lastInsertRowid: 0, changes: 0 } }
      },
    }
  },
  exec(sql) {
    try { db.run(sql); persist() } catch (e) { console.error('DB exec error:', e.message) }
  },
  pragma() {}, // no-op — handled in schema above
}

export default dbWrapper
