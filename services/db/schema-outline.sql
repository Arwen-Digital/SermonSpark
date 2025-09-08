-- Schema outline for SQLite (native only). Actual migrations will be added in step 4.
-- Notes:
-- - All timestamps are stored as TEXT (ISO8601) for portability.
-- - Arrays/JSON stored as TEXT (JSON.stringify); decode in repository layer.
-- - Per-user scoping enforced by user_id column and WHERE clauses in queries.

-- series table
-- Indexes:
--   idx_series_user_updated (user_id, updated_at)
--   idx_series_user_deleted (user_id, deleted_at)
--   idx_series_user_status  (user_id, status)
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,            -- UUID
  user_id TEXT NOT NULL,          -- UUID owner
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT,                -- ISO date
  end_date TEXT,                  -- ISO date
  image_url TEXT,
  tags TEXT NOT NULL DEFAULT '[]',-- JSON array
  status TEXT NOT NULL DEFAULT 'planning', -- planning|active|completed|archived
  -- sync/meta
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT,
  dirty INTEGER NOT NULL DEFAULT 1,        -- 0|1
  op TEXT NOT NULL DEFAULT 'upsert',       -- upsert|delete
  version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_series_user_updated ON series (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_series_user_deleted ON series (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_series_user_status  ON series (user_id, status);

-- sermons table
-- Indexes:
--   idx_sermons_user_updated (user_id, updated_at)
--   idx_sermons_user_deleted (user_id, deleted_at)
--   idx_sermons_user_series  (user_id, series_id)
CREATE TABLE IF NOT EXISTS sermons (
  id TEXT PRIMARY KEY,            -- UUID
  user_id TEXT NOT NULL,          -- UUID owner
  title TEXT NOT NULL,
  content TEXT,
  outline TEXT,                   -- JSON
  scripture TEXT,
  tags TEXT NOT NULL DEFAULT '[]',-- JSON array
  status TEXT NOT NULL DEFAULT 'draft',      -- draft|preparing|ready|delivered|archived
  visibility TEXT NOT NULL DEFAULT 'private',-- private|congregation|public
  date TEXT,                      -- ISO date
  notes TEXT,
  series_id TEXT,                 -- nullable FK (not enforced)
  -- sync/meta
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT,
  dirty INTEGER NOT NULL DEFAULT 1,
  op TEXT NOT NULL DEFAULT 'upsert',
  version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sermons_user_updated ON sermons (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sermons_user_deleted ON sermons (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_sermons_user_series  ON sermons (user_id, series_id);

-- Optional conflict log
CREATE TABLE IF NOT EXISTS conflicts (
  id TEXT PRIMARY KEY,            -- UUID
  user_id TEXT NOT NULL,
  table_name TEXT NOT NULL,       -- 'series' | 'sermons'
  record_id TEXT NOT NULL,
  local_updated_at TEXT NOT NULL,
  remote_updated_at TEXT NOT NULL,
  resolved_with TEXT NOT NULL,    -- 'local' | 'remote'
  created_at TEXT NOT NULL
);

-- PRAGMA user_version will be used to track migration version.

