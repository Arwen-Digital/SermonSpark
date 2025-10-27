-- SQLite Performance Indexes for Local-First Operations
-- Generated on 2025-10-23T06:33:22.428Z

-- Core user-based indexes for fast user data lookup
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_sermons_user_id ON sermons(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_series_user_active ON series(user_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sermons_user_active ON sermons(user_id, deleted_at) WHERE deleted_at IS NULL;

-- Series-sermon relationship index
CREATE INDEX IF NOT EXISTS idx_sermons_series_id ON sermons(series_id);
CREATE INDEX IF NOT EXISTS idx_sermons_user_series ON sermons(user_id, series_id, deleted_at);

-- Sync-related indexes for efficient sync operations
CREATE INDEX IF NOT EXISTS idx_series_dirty ON series(user_id, dirty, updated_at);
CREATE INDEX IF NOT EXISTS idx_sermons_dirty ON sermons(user_id, dirty, updated_at);
CREATE INDEX IF NOT EXISTS idx_series_synced_at ON series(user_id, synced_at);
CREATE INDEX IF NOT EXISTS idx_sermons_synced_at ON sermons(user_id, synced_at);

-- Status and visibility indexes for filtering
CREATE INDEX IF NOT EXISTS idx_series_status ON series(user_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_sermons_status ON sermons(user_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_sermons_visibility ON sermons(user_id, visibility, deleted_at);

-- Date-based indexes for chronological queries
CREATE INDEX IF NOT EXISTS idx_series_dates ON series(user_id, start_date, end_date, deleted_at);
CREATE INDEX IF NOT EXISTS idx_sermons_date ON sermons(user_id, date, deleted_at);

-- Analyze tables for query planner optimization
ANALYZE series;
ANALYZE sermons;

-- Vacuum and optimize database
PRAGMA optimize;
