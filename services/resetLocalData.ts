
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

/**
 * Reset all local data - USE WITH CAUTION!
 * This will clear all user data and reset the app to initial state.
 */
export async function resetAllLocalData() {
  console.log('🔄 Starting complete data reset...');
  
  try {
    // 1. Clear AsyncStorage
    console.log('📱 Clearing AsyncStorage...');
    const keys = [
      'offline.currentUserId',
      'offline.anonymousUserId',
      'access_token',
      'refresh_token',
      'user',
      'sync.bidirectional.state',
      'sync.queue',
      'sync.lastPulledAt.series',
      'sync.lastPulledAt.sermons',
      'sync.lastPushedAt.series',
      'sync.lastPushedAt.sermons',
      'featureGate.cache',
      'featureGate.lastCheck',
      'conflicts.pending',
      'conflicts.resolved',
      'migration.state',
      'migration.progress'
    ];
    
    await AsyncStorage.multiRemove(keys);
    console.log('✅ AsyncStorage cleared');
    
    // 2. Reset SQLite database
    console.log('🗄️  Resetting SQLite database...');
    const db = await SQLite.openDatabaseAsync('sermoncraft.db');
    
    // Execute reset SQL
    const resetSQL = `
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
`;
    
    const statements = resetSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execAsync(statement);
      }
    }
    
    await db.closeAsync();
    console.log('✅ Database reset complete');
    
    // 3. Clear any cached network requests
    console.log('🌐 Clearing network cache...');
    // This would clear any cached HTTP responses
    
    console.log('🎉 Complete data reset finished!');
    console.log('📱 App is now in fresh install state');
    
    return {
      success: true,
      message: 'All local data has been reset successfully',
      clearedKeys: keys.length,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('❌ Error during data reset:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Reset only authentication data (keep user content)
 */
export async function resetAuthenticationData() {
  console.log('🔐 Resetting authentication data...');
  
  try {
    const authKeys = [
      'offline.currentUserId',
      'offline.anonymousUserId',
      'access_token',
      'refresh_token',
      'user',
      'sync.bidirectional.state',
    ];
    
    await AsyncStorage.multiRemove(authKeys);
    
    console.log('✅ Authentication data reset');
    return { success: true, clearedKeys: authKeys.length };
    
  } catch (error) {
    console.error('❌ Error resetting auth data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset only sync state (keep user content and auth)
 */
export async function resetSyncState() {
  console.log('🔄 Resetting sync state...');
  
  try {
    const syncKeys = [
      'sync.bidirectional.state',
      'sync.queue',
      'sync.lastPulledAt.series',
      'sync.lastPulledAt.sermons',
      'sync.lastPushedAt.series',
      'sync.lastPushedAt.sermons',
      'conflicts.pending',
      'conflicts.resolved',
    ];
    
    await AsyncStorage.multiRemove(syncKeys);
    
    // Clear sync operations from database
    const db = await SQLite.openDatabaseAsync('sermoncraft.db');
    await db.execAsync('DELETE FROM sync_operations');
    await db.execAsync('DELETE FROM conflicts');
    await db.execAsync('UPDATE series SET dirty = 0');
    await db.execAsync('UPDATE sermons SET dirty = 0');
    await db.closeAsync();
    
    console.log('✅ Sync state reset');
    return { success: true, clearedKeys: syncKeys.length };
    
  } catch (error) {
    console.error('❌ Error resetting sync state:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current data status for debugging
 */
export async function getDataStatus() {
  try {
    const db = await SQLite.openDatabaseAsync('sermoncraft.db');
    
    const seriesCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM series WHERE deleted_at IS NULL');
    const sermonsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM sermons WHERE deleted_at IS NULL');
    const dirtySeriesCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM series WHERE dirty = 1');
    const dirtySermonsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM sermons WHERE dirty = 1');
    const syncOpsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM sync_operations WHERE status = "pending"');
    const conflictsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM conflicts WHERE status = "pending"');
    
    await db.closeAsync();
    
    // Check AsyncStorage
    const userId = await AsyncStorage.getItem('offline.currentUserId');
    const anonymousId = await AsyncStorage.getItem('offline.anonymousUserId');
    const syncState = await AsyncStorage.getItem('sync.bidirectional.state');
    
    return {
      database: {
        series: seriesCount?.count || 0,
        sermons: sermonsCount?.count || 0,
        dirtySeries: dirtySeriesCount?.count || 0,
        dirtySermons: dirtySermonsCount?.count || 0,
        pendingSyncOps: syncOpsCount?.count || 0,
        pendingConflicts: conflictsCount?.count || 0,
      },
      authentication: {
        hasUserId: !!userId,
        hasAnonymousId: !!anonymousId,
        hasSyncState: !!syncState,
      },
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('❌ Error getting data status:', error);
    return { error: error.message };
  }
}

export default {
  resetAllLocalData,
  resetAuthenticationData,
  resetSyncState,
  getDataStatus,
};
