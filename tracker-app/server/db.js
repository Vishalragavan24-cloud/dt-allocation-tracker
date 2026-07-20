// Pure WebAssembly SQLite — no native compilation, works on any Node version
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR = process.env.RENDER ? '/tmp' : __dirname
const DB_PATH = path.join(DB_DIR, 'tracker.db')

const SQL = await initSqlJs()

// Load existing DB from disk or create fresh
let db
if (fs.existsSync(DB_PATH)) {
  db = new SQL.Database(fs.readFileSync(DB_PATH))
} else {
  db = new SQL.Database()
}

function persist() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
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

// sql.js Statement-based query helpers
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function queryGet(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  return row
}

function queryRun(sql, params = []) {
  db.run(sql, params)
  const id = queryGet('SELECT last_insert_rowid() as id', [])?.id || 0
  persist()
  return { lastInsertRowid: id, changes: db.getRowsModified() }
}

// Wrapper matching better-sqlite3 API used in routes
const dbWrapper = {
  prepare(sql) {
    return {
      all(...params)  { return queryAll(sql, params.flat()) },
      get(...params)  { return queryGet(sql, params.flat()) },
      run(...params)  { return queryRun(sql, params.flat()) },
    }
  },
  exec(sql)   { db.run(sql); persist() },
  pragma()    {},
}

export default dbWrapper
