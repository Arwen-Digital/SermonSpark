
-- Drop existing tables
DROP TABLE IF EXISTS series;
DROP TABLE IF EXISTS sermons;
DROP TABLE IF EXISTS sync_operations;
DROP TABLE IF EXISTS conflicts;

-- Recreate series table
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  visibility TEXT DEFAULT 'private',
  platform_source TEXT DEFAULT 'mobile',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  dirty INTEGER DEFAULT 0,
  sync_version INTEGER DEFAULT 1
);

-- Recreate sermons table
CREATE TABLE IF NOT EXISTS sermons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  series_id TEXT,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft',
  visibility TEXT DEFAULT 'private',
  platform_source TEXT DEFAULT 'mobile',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  dirty INTEGER DEFAULT 0,
  sync_version INTEGER DEFAULT 1,
  FOREIGN KEY (series_id) REFERENCES series(id)
);

-- Recreate sync operations table
CREATE TABLE IF NOT EXISTS sync_operations (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  data TEXT,
  created_at TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  status TEXT DEFAULT 'pending'
);

-- Recreate conflicts table
CREATE TABLE IF NOT EXISTS conflicts (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_data TEXT,
  remote_data TEXT,
  conflict_fields TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  resolution TEXT,
  status TEXT DEFAULT 'pending'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_series_updated_at ON series(updated_at);
CREATE INDEX IF NOT EXISTS idx_series_dirty ON series(dirty);

CREATE INDEX IF NOT EXISTS idx_sermons_user_id ON sermons(user_id);
CREATE INDEX IF NOT EXISTS idx_sermons_series_id ON sermons(series_id);
CREATE INDEX IF NOT EXISTS idx_sermons_updated_at ON sermons(updated_at);
CREATE INDEX IF NOT EXISTS idx_sermons_dirty ON sermons(dirty);

CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status);
