import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// On Render, /tmp is writable. Locally uses same directory as db.js
const DB_DIR = process.env.RENDER ? '/tmp' : __dirname
const DB_PATH = path.join(DB_DIR, 'tracker.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
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

export default db
