CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  filename TEXT NOT NULL,
  key TEXT NOT NULL,
  mime TEXT,
  unlimited INTEGER DEFAULT 0,
  max_downloads INTEGER,
  downloads INTEGER DEFAULT 0,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  file_size INTEGER,
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER,
  deleted_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(is_deleted);

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  last_login INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Download history table to track who downloaded what
CREATE TABLE IF NOT EXISTS download_history (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  downloaded_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  ip_address TEXT,
  user_agent TEXT,
  browser_info TEXT,
  country TEXT,
  user_id TEXT,
  download_duration INTEGER,
  bytes_downloaded INTEGER,
  success INTEGER DEFAULT 1,
  FOREIGN KEY (file_id) REFERENCES files(id),
  FOREIGN KEY (user_id) REFERENCES users(username)
);

CREATE INDEX IF NOT EXISTS idx_download_history_file_id ON download_history(file_id);
CREATE INDEX IF NOT EXISTS idx_download_history_downloaded_at ON download_history(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_download_history_ip ON download_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_download_history_user_id ON download_history(user_id);

-- Expired files history to track expired files
CREATE TABLE IF NOT EXISTS expired_files_history (
  id TEXT PRIMARY KEY,
  original_file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  owner TEXT NOT NULL,
  key TEXT NOT NULL,
  mime TEXT,
  file_size INTEGER,
  created_at INTEGER,
  expired_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  total_downloads INTEGER DEFAULT 0,
  expiry_reason TEXT -- 'time_expired', 'download_limit_reached', 'manual_deletion'
);

CREATE INDEX IF NOT EXISTS idx_expired_files_owner ON expired_files_history(owner);
CREATE INDEX IF NOT EXISTS idx_expired_files_expired_at ON expired_files_history(expired_at);

-- File statistics table for aggregated stats
CREATE TABLE IF NOT EXISTS file_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  stat_date TEXT NOT NULL, -- YYYY-MM-DD format
  download_count INTEGER DEFAULT 0,
  unique_ips INTEGER DEFAULT 0,
  bytes_transferred INTEGER DEFAULT 0,
  UNIQUE(file_id, stat_date),
  FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE INDEX IF NOT EXISTS idx_file_stats_file_id ON file_stats(file_id);
CREATE INDEX IF NOT EXISTS idx_file_stats_date ON file_stats(stat_date);

-- Audit trail table for all system actions
CREATE TABLE IF NOT EXISTS audit_trail (
  id TEXT PRIMARY KEY,
  timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  user_id TEXT,
  action TEXT NOT NULL, -- 'upload', 'download', 'delete', 'login', 'register', 'view_stats', etc.
  resource_type TEXT, -- 'file', 'user', 'system'
  resource_id TEXT, -- file_id, username, etc.
  ip_address TEXT,
  user_agent TEXT,
  details TEXT, -- JSON string with additional details
  success INTEGER DEFAULT 1,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON audit_trail(resource_type, resource_id);