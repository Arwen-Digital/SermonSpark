-- Optimized Query Patterns for Local-First Operations
-- Generated on 2025-10-23T06:33:22.428Z

-- 1. Efficient user data retrieval with pagination
-- Instead of: SELECT * FROM series WHERE user_id = ? ORDER BY updated_at DESC
-- Use: SELECT * FROM series WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT ? OFFSET ?

-- 2. Efficient dirty record queries for sync
-- Instead of: SELECT * FROM series WHERE dirty = 1
-- Use: SELECT * FROM series WHERE user_id = ? AND dirty = 1 ORDER BY updated_at ASC LIMIT ?

-- 3. Efficient series-sermon relationship queries
-- Instead of: SELECT s.*, ser.title as series_title FROM sermons s LEFT JOIN series ser ON s.series_id = ser.id WHERE s.user_id = ?
-- Use: SELECT s.* FROM sermons s WHERE s.user_id = ? AND s.deleted_at IS NULL ORDER BY s.updated_at DESC

-- 4. Efficient conflict detection queries
-- For sync conflict detection, use timestamp-based queries:
-- SELECT id, updated_at, dirty FROM series WHERE id IN (?, ?, ?) AND user_id = ?

-- 5. Batch operations for bulk sync
-- Use prepared statements with parameter binding for bulk operations
-- INSERT OR REPLACE INTO series (id, user_id, title, ...) VALUES (?, ?, ?, ...)

-- 6. Efficient count queries
-- Instead of: SELECT COUNT(*) FROM sermons WHERE user_id = ?
-- Use: SELECT COUNT(*) FROM sermons WHERE user_id = ? AND deleted_at IS NULL

-- 7. Optimized search queries
-- Use LIKE with proper indexing:
-- SELECT * FROM sermons WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) AND deleted_at IS NULL LIMIT ?
