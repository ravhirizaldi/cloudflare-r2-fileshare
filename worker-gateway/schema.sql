CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  filename TEXT NOT NULL,
  key TEXT NOT NULL,
  mime TEXT,
  unlimited INTEGER DEFAULT 0,
  max_downloads INTEGER,
  downloads INTEGER DEFAULT 0,
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner);

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user'
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);