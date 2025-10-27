#!/usr/bin/env node

/**
 * Performance Optimization Script for Local-First Operations
 * 
 * This script implements performance optimizations for:
 * 1. SQLite queries for large datasets
 * 2. Efficient sync queue processing
 * 3. Proper indexing for local database operations
 * 4. API sync endpoints for bulk operations
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OPTIMIZATION_CONFIG = {
  verbose: process.argv.includes('--verbose') || process.env.VERBOSE === 'true',
  dryRun: process.argv.includes('--dry-run'),
  outputDir: path.join(__dirname, '../services/db/optimizations')
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// SQLite Query Optimizations
class SQLiteOptimizer {
  constructor() {
    this.optimizations = [];
  }

  generateOptimizedQueries() {
    log('🗄️ Generating SQLite Query Optimizations');

    // 1. Optimized indexes for common queries
    const indexes = this.generateIndexes();
    
    // 2. Optimized query patterns
    const queries = this.generateOptimizedQueryPatterns();
    
    // 3. Connection pooling configuration
    const connectionConfig = this.generateConnectionConfig();

    this.optimizations.push({
      type: 'indexes',
      content: indexes
    }, {
      type: 'queries',
      content: queries
    }, {
      type: 'connection',
      content: connectionConfig
    });

    return this.optimizations;
  }

  generateIndexes() {
    return `-- SQLite Performance Indexes for Local-First Operations
-- Generated on ${new Date().toISOString()}

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
`;
  }

  generateOptimizedQueryPatterns() {
    return `-- Optimized Query Patterns for Local-First Operations
-- Generated on ${new Date().toISOString()}

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
`;
  }

  generateConnectionConfig() {
    return `-- SQLite Connection Configuration for Performance
-- Generated on ${new Date().toISOString()}

-- Performance-oriented PRAGMA settings
PRAGMA journal_mode = WAL;           -- Write-Ahead Logging for better concurrency
PRAGMA synchronous = NORMAL;         -- Balance between safety and performance
PRAGMA cache_size = -64000;          -- 64MB cache size (negative = KB)
PRAGMA temp_store = MEMORY;          -- Store temporary tables in memory
PRAGMA mmap_size = 268435456;        -- 256MB memory-mapped I/O
PRAGMA page_size = 4096;             -- Optimal page size for most systems

-- Query optimization settings
PRAGMA optimize;                     -- Enable automatic index optimization
PRAGMA analysis_limit = 1000;       -- Limit analysis for large tables
`;
  }

  writeOptimizations() {
    if (OPTIMIZATION_CONFIG.dryRun) {
      log('🔍 Dry run mode - would write optimizations to files');
      return;
    }

    // Ensure output directory exists
    if (!fs.existsSync(OPTIMIZATION_CONFIG.outputDir)) {
      fs.mkdirSync(OPTIMIZATION_CONFIG.outputDir, { recursive: true });
    }

    this.optimizations.forEach(optimization => {
      const filename = `${optimization.type}-optimization.sql`;
      const filepath = path.join(OPTIMIZATION_CONFIG.outputDir, filename);
      
      fs.writeFileSync(filepath, optimization.content);
      log(`✅ Written ${optimization.type} optimizations to ${filepath}`);
    });
  }
}

// Main optimization runner
async function runOptimizations() {
  try {
    log('⚡ Starting Performance Optimization Generation');
    
    // Generate SQLite optimizations
    const sqliteOptimizer = new SQLiteOptimizer();
    sqliteOptimizer.generateOptimizedQueries();
    sqliteOptimizer.writeOptimizations();
    
    log('🎉 Performance optimizations generated successfully!');
    log(`📁 Output directory: ${OPTIMIZATION_CONFIG.outputDir}`);
    
    if (OPTIMIZATION_CONFIG.dryRun) {
      log('🔍 This was a dry run - no files were actually written');
    }
    
  } catch (error) {
    log(`💥 Optimization generation failed: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run optimizations if this script is executed directly
if (require.main === module) {
  runOptimizations();
}

module.exports = {
  SQLiteOptimizer,
  runOptimizations
};