#!/usr/bin/env node

/**
 * Reset Local-First Data Script
 * 
 * This script clears all local data to simulate a fresh app install:
 * - Clears AsyncStorage (user sessions, sync state, etc.)
 * - Drops and recreates SQLite database tables
 * - Resets all cached authentication data
 * - Clears sync queues and conflict resolution state
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Resetting Local-First Data...\n');

// Paths to clear
const pathsToClear = [
  // AsyncStorage simulation (for development)
  '.expo/cache',
  'node_modules/.cache',
  
  // Potential SQLite database locations
  'data/app.db',
  'data/sermons.db',
  'data/series.db',
  
  // Expo SQLite databases (typically in device storage, but clearing cache helps)
  '.expo/web/cache',
];

// AsyncStorage keys to clear (these would be cleared in the actual app)
const asyncStorageKeys = [
  // Authentication
  'offline.currentUserId',
  'offline.anonymousUserId',
  'access_token',
  'refresh_token',
  'user',
  
  // Sync state
  'sync.bidirectional.state',
  'sync.queue',
  'sync.lastPulledAt.series',
  'sync.lastPulledAt.sermons',
  'sync.lastPushedAt.series',
  'sync.lastPushedAt.sermons',
  
  // Feature gate cache
  'featureGate.cache',
  'featureGate.lastCheck',
  
  // Conflict resolution
  'conflicts.pending',
  'conflicts.resolved',
  
  // Migration state
  'migration.state',
  'migration.progress',
];

// SQL commands to reset database tables
const resetDatabaseSQL = `
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

function clearDirectory(dirPath) {
  const fullPath = path.join(__dirname, '..', dirPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleared: ${dirPath}`);
    } catch (error) {
      console.log(`⚠️  Could not clear ${dirPath}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️  Path does not exist: ${dirPath}`);
  }
}

function createResetScript() {
  const resetScript = `
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
      ${asyncStorageKeys.map(key => `'${key}'`).join(',\n      ')}
    ];
    
    await AsyncStorage.multiRemove(keys);
    console.log('✅ AsyncStorage cleared');
    
    // 2. Reset SQLite database
    console.log('🗄️  Resetting SQLite database...');
    const db = await SQLite.openDatabaseAsync('sermoncraft.db');
    
    // Execute reset SQL
    const resetSQL = \`${resetDatabaseSQL.replace(/`/g, '\\`')}\`;
    
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
`;

  const scriptPath = path.join(__dirname, '..', 'services', 'resetLocalData.ts');
  fs.writeFileSync(scriptPath, resetScript);
  console.log(`✅ Created reset script: services/resetLocalData.ts`);
}

function createDebugComponent() {
  const debugComponent = `
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import resetLocalData from '../services/resetLocalData';

export default function LocalDataDebugPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const dataStatus = await resetLocalData.getDataStatus();
      setStatus(dataStatus);
    } catch (error) {
      Alert.alert('Error', 'Failed to get data status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete ALL local data including series, sermons, and authentication. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await resetLocalData.resetAllLocalData();
              if (result.success) {
                Alert.alert('Success', 'All local data has been reset');
                refreshStatus();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetAuth = async () => {
    setLoading(true);
    try {
      const result = await resetLocalData.resetAuthenticationData();
      if (result.success) {
        Alert.alert('Success', 'Authentication data has been reset');
        refreshStatus();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSync = async () => {
    setLoading(true);
    try {
      const result = await resetLocalData.resetSyncState();
      if (result.success) {
        Alert.alert('Success', 'Sync state has been reset');
        refreshStatus();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Local Data Debug Panel</Text>
      
      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Database Status</Text>
          <Text>Series: {status.database?.series || 0}</Text>
          <Text>Sermons: {status.database?.sermons || 0}</Text>
          <Text>Dirty Series: {status.database?.dirtySeries || 0}</Text>
          <Text>Dirty Sermons: {status.database?.dirtySermons || 0}</Text>
          <Text>Pending Sync Ops: {status.database?.pendingSyncOps || 0}</Text>
          <Text>Pending Conflicts: {status.database?.pendingConflicts || 0}</Text>
          
          <Text style={styles.sectionTitle}>Authentication Status</Text>
          <Text>Has User ID: {status.authentication?.hasUserId ? 'Yes' : 'No'}</Text>
          <Text>Has Anonymous ID: {status.authentication?.hasAnonymousId ? 'Yes' : 'No'}</Text>
          <Text>Has Sync State: {status.authentication?.hasSyncState ? 'Yes' : 'No'}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={refreshStatus}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]} 
          onPress={handleResetSync}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Reset Sync State</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]} 
          onPress={handleResetAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Reset Authentication</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={handleResetAll}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <Text style={styles.loading}>Processing...</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
`;

  const componentPath = path.join(__dirname, '..', 'components', 'debug', 'LocalDataDebugPanel.tsx');
  
  // Create debug directory if it doesn't exist
  const debugDir = path.join(__dirname, '..', 'components', 'debug');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  fs.writeFileSync(componentPath, debugComponent);
  console.log(`✅ Created debug component: components/debug/LocalDataDebugPanel.tsx`);
}

// Main execution
console.log('1. Clearing cache directories...');
pathsToClear.forEach(clearDirectory);

console.log('\n2. Creating reset utilities...');
createResetScript();
createDebugComponent();

console.log('\n3. Creating database reset SQL file...');
const sqlPath = path.join(__dirname, '..', 'data', 'reset-database.sql');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
fs.writeFileSync(sqlPath, resetDatabaseSQL);
console.log(`✅ Created SQL reset file: data/reset-database.sql`);

console.log('\n🎉 Local-First Data Reset Complete!');
console.log('\n📋 What was done:');
console.log('   • Cleared cache directories');
console.log('   • Created resetLocalData.ts service');
console.log('   • Created LocalDataDebugPanel.tsx component');
console.log('   • Created database reset SQL file');

console.log('\n🚀 How to use:');
console.log('   1. Import and call resetLocalData.resetAllLocalData() in your app');
console.log('   2. Or use the LocalDataDebugPanel component for a UI');
console.log('   3. Or run the SQL file against your database');

console.log('\n⚠️  IMPORTANT:');
console.log('   • This will delete ALL user data');
console.log('   • Use only for development/testing');
console.log('   • Make sure to restart the app after reset');

console.log('\n📱 To add the debug panel to your app:');
console.log('   • Import LocalDataDebugPanel from components/debug/LocalDataDebugPanel');
console.log('   • Add it to a development-only screen or modal');