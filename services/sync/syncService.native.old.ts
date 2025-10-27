import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, isAuthenticatedOnline } from '../authSession';
import { exec, queryAll, queryFirst } from '../db/index.native';
import { httpClient } from '../httpClient';
import { DataTransformer, SQLiteSeriesRecord, APISeriesRecord, SQLiteSermonRecord, APISermonRecord } from './dataTransformer';

const LP_KEYS = {
  series: (userId: string) => `offline.lastPulledAt.series:${userId}`,
  sermons: (userId: string) => `offline.lastPulledAt.sermons:${userId}`,
};

const nowIso = () => new Date().toISOString();

// Progress tracking types
export interface SyncProgress {
  phase: 'series_push' | 'series_pull' | 'sermons_push' | 'sermons_pull' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number; // milliseconds
  seriesStats: {
    pushed: number;
    pulled: number;
    conflicts: number;
    errors: string[];
  };
  sermonStats: {
    pushed: number;
    pulled: number;
    conflicts: number;
    errors: string[];
  };
  totalErrors: string[];
}

export interface SyncError {
  id: string;
  type: 'push' | 'pull' | 'conflict' | 'validation' | 'network' | 'auth';
  entity: 'series' | 'sermon';
  entityId?: string;
  message: string;
  timestamp: string;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isAuthenticated: boolean;
  pendingOperations: number;
  lastSyncTime?: string;
  syncInProgress: boolean;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'sermon' | 'series';
  entityId: string;
  data: any;
  userId: string;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

// Progress callback type
export type SyncProgressCallback = (progress: SyncProgress) => void;

// Sync completion callback type
export type SyncCompletionCallback = (result: SyncResult) => void;

// Global progress callback
let globalProgressCallback: SyncProgressCallback | null = null;

// Global completion callback
let globalCompletionCallback: SyncCompletionCallback | null = null;

// Sync status tracking
let currentSyncStatus: SyncStatus = {
  isOnline: false,
  isAuthenticated: false,
  pendingOperations: 0,
  syncInProgress: false,
};

// Sync queue for offline operations
const SYNC_QUEUE_KEY = 'sync.queue';
let syncQueue: SyncOperation[] = [];
let syncQueueInitialized = false;

// Bidirectional sync state tracking
const BIDIRECTIONAL_SYNC_KEY = 'sync.bidirectional.state';
interface BidirectionalSyncState {
  lastWebPullAt: string | null;
  lastMobilePushAt: string | null;
  conflictResolutionMode: 'auto' | 'manual';
  pendingConflicts: DataConflict[];
}

interface DataConflict {
  id: string;
  entityType: 'series' | 'sermon';
  entityId: string;
  localRecord: any;
  remoteRecord: any;
  conflictFields: string[];
  timestamp: string;
  resolved: boolean;
}

let bidirectionalSyncState: BidirectionalSyncState = {
  lastWebPullAt: null,
  lastMobilePushAt: null,
  conflictResolutionMode: 'auto',
  pendingConflicts: [],
};

// Sync status change listeners
type SyncStatusChangeCallback = (status: SyncStatus) => void;
let syncStatusListeners: SyncStatusChangeCallback[] = [];

export function setSyncProgressCallback(callback: SyncProgressCallback | null): void {
  globalProgressCallback = callback;
}

export function setSyncCompletionCallback(callback: SyncCompletionCallback | null): void {
  globalCompletionCallback = callback;
}

function reportProgress(progress: SyncProgress): void {
  if (globalProgressCallback) {
    globalProgressCallback(progress);
  }
  console.log(`Sync Progress: ${progress.phase} - ${progress.current}/${progress.total} - ${progress.message}`);
}

function reportError(error: SyncError): void {
  const msg = `Sync Error [${error.type}] ${error.entity}:${error.entityId || 'unknown'} - ${error.message}`;
  // Downgrade non-fatal issues to warnings to avoid red error overlay in-app
  if (error.type === 'conflict' || error.type === 'validation') {
    console.warn(msg);
  } else {
    console.error(msg);
  }
  // TODO: Optionally persist error to a local table for diagnostics
}

// Initialize sync queue from storage
async function initializeSyncQueue(): Promise<void> {
  if (syncQueueInitialized) return;
  
  try {
    const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (stored) {
      syncQueue = JSON.parse(stored);
    }
    syncQueueInitialized = true;
    currentSyncStatus.pendingOperations = syncQueue.length;
  } catch (error) {
    console.error('Failed to initialize sync queue:', error);
    syncQueue = [];
    syncQueueInitialized = true;
  }
}

// Save sync queue to storage
async function saveSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue));
    currentSyncStatus.pendingOperations = syncQueue.length;
  } catch (error) {
    console.error('Failed to save sync queue:', error);
  }
}

// Add operation to sync queue
export async function queueSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
  await initializeSyncQueue();
  
  const syncOperation: SyncOperation = {
    ...operation,
    id: `${operation.entityType}_${operation.entityId}_${Date.now()}`,
    timestamp: nowIso(),
    status: 'pending',
    retryCount: 0,
  };
  
  // Remove any existing operations for the same entity to avoid duplicates
  syncQueue = syncQueue.filter(op => !(op.entityType === operation.entityType && op.entityId === operation.entityId));
  
  syncQueue.push(syncOperation);
  await saveSyncQueue();
  
  console.log(`Queued ${operation.type} operation for ${operation.entityType} ${operation.entityId}`);
}

// Process sync queue (only when authenticated and online)
export async function processSyncQueue(): Promise<void> {
  await initializeSyncQueue();
  
  const isOnline = await isAuthenticatedOnline();
  if (!isOnline) {
    console.log('Skipping sync queue processing - not authenticated online');
    return;
  }
  
  if (syncQueue.length === 0) {
    console.log('Sync queue is empty');
    return;
  }
  
  currentSyncStatus.syncInProgress = true;
  
  const processedOperations: string[] = [];
  const failedOperations: string[] = [];
  
  for (const operation of syncQueue) {
    try {
      await processQueuedOperation(operation);
      processedOperations.push(operation.id);
    } catch (error) {
      const { handleError } = await import('../errorHandler');
      const errorResponse = handleError(
        error instanceof Error ? error : new Error('Unknown sync operation error'), 
        'sync', 
        { operationId: operation.id, operationType: operation.type, entityType: operation.entityType }
      );
      console.error(`Failed to process queued operation ${operation.id}:`, errorResponse.technicalMessage);
      operation.retryCount++;
      operation.status = 'failed';
      
      // Remove operations that have exceeded retry limit
      if (operation.retryCount >= 3) {
        failedOperations.push(operation.id);
      }
    }
  }
  
  // Remove processed and failed operations from queue
  syncQueue = syncQueue.filter(op => 
    !processedOperations.includes(op.id) && !failedOperations.includes(op.id)
  );
  
  await saveSyncQueue();
  currentSyncStatus.syncInProgress = false;
  
  console.log(`Processed sync queue: ${processedOperations.length} successful, ${failedOperations.length} failed`);
}

// Process individual queued operation
async function processQueuedOperation(operation: SyncOperation): Promise<void> {
  const { entityType, entityId, type, data } = operation;
  
  switch (entityType) {
    case 'series':
      switch (type) {
        case 'create':
          await httpClient.post('/api/series', data);
          break;
        case 'update':
          await httpClient.put(`/api/series/${entityId}`, data);
          break;
        case 'delete':
          await httpClient.delete(`/api/series/${entityId}`);
          break;
      }
      break;
      
    case 'sermon':
      switch (type) {
        case 'create':
          await httpClient.post('/api/sermons', data);
          break;
        case 'update':
          await httpClient.put(`/api/sermons/${entityId}`, data);
          break;
        case 'delete':
          await httpClient.delete(`/api/sermons/${entityId}`);
          break;
      }
      break;
      
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

// Get current sync status
export async function getSyncStatus(): Promise<SyncStatus> {
  await initializeSyncQueue();
  
  const isOnline = await isAuthenticatedOnline();
  const lastSyncTime = await AsyncStorage.getItem('sync.lastSyncTime');
  
  return {
    ...currentSyncStatus,
    isOnline,
    isAuthenticated: isOnline,
    lastSyncTime: lastSyncTime || undefined,
  };
}

// Clear sync queue (useful for debugging)
export async function clearSyncQueue(): Promise<void> {
  syncQueue = [];
  await saveSyncQueue();
  console.log('Sync queue cleared');
}

// Initialize bidirectional sync state
async function initializeBidirectionalSyncState(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(BIDIRECTIONAL_SYNC_KEY);
    if (stored) {
      bidirectionalSyncState = { ...bidirectionalSyncState, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to initialize bidirectional sync state:', error);
  }
}

// Save bidirectional sync state
async function saveBidirectionalSyncState(): Promise<void> {
  try {
    await AsyncStorage.setItem(BIDIRECTIONAL_SYNC_KEY, JSON.stringify(bidirectionalSyncState));
  } catch (error) {
    console.error('Failed to save bidirectional sync state:', error);
  }
}

// Add sync status change listener
export function addSyncStatusListener(callback: SyncStatusChangeCallback): () => void {
  syncStatusListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = syncStatusListeners.indexOf(callback);
    if (index > -1) {
      syncStatusListeners.splice(index, 1);
    }
  };
}

// Notify sync status change
function notifySyncStatusChange(status: SyncStatus): void {
  currentSyncStatus = { ...currentSyncStatus, ...status };
  syncStatusListeners.forEach(callback => {
    try {
      callback(currentSyncStatus);
    } catch (error) {
      console.error('Error in sync status listener:', error);
    }
  });
}

// Enhanced conflict resolution for bidirectional sync
function resolveBidirectionalConflict(
  local: { updated_at: string; dirty: number; deleted_at: string | null },
  remote: { updated_at: string; deleted_at?: string | null },
  entityType: 'series' | 'sermon',
  entityId: string
): { keepLocal: boolean; reason: string; requiresManualResolution: boolean } {
  const localUpdated = new Date(local.updated_at);
  const remoteUpdated = new Date(remote.updated_at);
  
  // Check for complex conflicts that require manual resolution
  const timeDiffMinutes = Math.abs(localUpdated.getTime() - remoteUpdated.getTime()) / (1000 * 60);
  const isCloseTimestamp = timeDiffMinutes < 5; // Within 5 minutes
  const hasLocalChanges = local.dirty === 1;
  const hasDeletionConflict = (local.deleted_at && !remote.deleted_at) || (!local.deleted_at && remote.deleted_at);
  
  // If timestamps are very close and both have changes, require manual resolution
  if (isCloseTimestamp && hasLocalChanges && !hasDeletionConflict) {
    return {
      keepLocal: true, // Temporarily keep local until manual resolution
      reason: 'Timestamps too close, requires manual conflict resolution',
      requiresManualResolution: true,
    };
  }
  
  // Handle deletion conflicts
  if (hasDeletionConflict) {
    if (local.deleted_at && !remote.deleted_at) {
      return {
        keepLocal: true,
        reason: 'Local record is deleted but remote is not - keeping local deletion',
        requiresManualResolution: false,
      };
    } else if (!local.deleted_at && remote.deleted_at) {
      return {
        keepLocal: false,
        reason: 'Remote record is deleted but local is not - accepting remote deletion',
        requiresManualResolution: false,
      };
    }
  }
  
  // If local record has unsaved changes, prefer local
  if (hasLocalChanges) {
    return {
      keepLocal: true,
      reason: 'Local record has unsaved changes (dirty=1)',
      requiresManualResolution: false,
    };
  }
  
  // Use timestamp-based resolution for clean records
  if (localUpdated > remoteUpdated) {
    return {
      keepLocal: true,
      reason: `Local record is newer (${local.updated_at} > ${remote.updated_at})`,
      requiresManualResolution: false,
    };
  } else if (remoteUpdated > localUpdated) {
    return {
      keepLocal: false,
      reason: `Remote record is newer (${remote.updated_at} > ${local.updated_at})`,
      requiresManualResolution: false,
    };
  }
  
  // If timestamps are equal, prefer remote (server wins)
  return {
    keepLocal: false,
    reason: 'Timestamps are equal, preferring remote record',
    requiresManualResolution: false,
  };
}

// Add conflict to pending list for manual resolution
async function addPendingConflict(
  entityType: 'series' | 'sermon',
  entityId: string,
  localRecord: any,
  remoteRecord: any,
  conflictFields: string[]
): Promise<void> {
  await initializeBidirectionalSyncState();
  
  const conflict: DataConflict = {
    id: `${entityType}_${entityId}_${Date.now()}`,
    entityType,
    entityId,
    localRecord,
    remoteRecord,
    conflictFields,
    timestamp: nowIso(),
    resolved: false,
  };
  
  bidirectionalSyncState.pendingConflicts.push(conflict);
  await saveBidirectionalSyncState();
  
  console.log(`Added pending conflict for ${entityType} ${entityId}:`, conflictFields);
}

// Get pending conflicts
export async function getPendingConflicts(): Promise<DataConflict[]> {
  await initializeBidirectionalSyncState();
  return bidirectionalSyncState.pendingConflicts.filter(c => !c.resolved);
}

// Resolve conflict manually
export async function resolveConflictManually(
  conflictId: string,
  resolution: 'keep_local' | 'keep_remote' | 'merge',
  mergedData?: any
): Promise<void> {
  await initializeBidirectionalSyncState();
  
  const conflict = bidirectionalSyncState.pendingConflicts.find(c => c.id === conflictId);
  if (!conflict) {
    throw new Error(`Conflict ${conflictId} not found`);
  }
  
  conflict.resolved = true;
  
  // Apply the resolution
  switch (resolution) {
    case 'keep_local':
      // Local record is already in place, just mark as resolved
      break;
    case 'keep_remote':
      // Update local record with remote data
      if (conflict.entityType === 'series') {
        const sqliteData = DataTransformer.seriesFromApi(conflict.remoteRecord);
        await exec(
          `UPDATE series SET title = ?, description = ?, start_date = ?, end_date = ?, 
           image_url = ?, tags = ?, status = ?, updated_at = ?, synced_at = ?, dirty = 0 
           WHERE id = ?`,
          [
            sqliteData.title, sqliteData.description, sqliteData.start_date,
            sqliteData.end_date, sqliteData.image_url, sqliteData.tags,
            sqliteData.status, sqliteData.updated_at, sqliteData.synced_at,
            conflict.entityId
          ]
        );
      } else if (conflict.entityType === 'sermon') {
        const sqliteData = DataTransformer.sermonFromApi(conflict.remoteRecord);
        await exec(
          `UPDATE sermons SET title = ?, content = ?, outline = ?, scripture = ?, 
           tags = ?, status = ?, visibility = ?, date = ?, notes = ?, series_id = ?,
           updated_at = ?, synced_at = ?, dirty = 0 WHERE id = ?`,
          [
            sqliteData.title, sqliteData.content, sqliteData.outline,
            sqliteData.scripture, sqliteData.tags, sqliteData.status,
            sqliteData.visibility, sqliteData.date, sqliteData.notes,
            sqliteData.series_id, sqliteData.updated_at, sqliteData.synced_at,
            conflict.entityId
          ]
        );
      }
      break;
    case 'merge':
      if (!mergedData) {
        throw new Error('Merged data is required for merge resolution');
      }
      // Apply merged data to local record
      if (conflict.entityType === 'series') {
        const sqliteData = DataTransformer.seriesFromApi(mergedData);
        await exec(
          `UPDATE series SET title = ?, description = ?, start_date = ?, end_date = ?, 
           image_url = ?, tags = ?, status = ?, updated_at = ?, synced_at = ?, dirty = 1, op = 'upsert'
           WHERE id = ?`,
          [
            sqliteData.title, sqliteData.description, sqliteData.start_date,
            sqliteData.end_date, sqliteData.image_url, sqliteData.tags,
            sqliteData.status, nowIso(), nowIso(),
            conflict.entityId
          ]
        );
      } else if (conflict.entityType === 'sermon') {
        const sqliteData = DataTransformer.sermonFromApi(mergedData);
        await exec(
          `UPDATE sermons SET title = ?, content = ?, outline = ?, scripture = ?, 
           tags = ?, status = ?, visibility = ?, date = ?, notes = ?, series_id = ?,
           updated_at = ?, synced_at = ?, dirty = 1, op = 'upsert' WHERE id = ?`,
          [
            sqliteData.title, sqliteData.content, sqliteData.outline,
            sqliteData.scripture, sqliteData.tags, sqliteData.status,
            sqliteData.visibility, sqliteData.date, sqliteData.notes,
            sqliteData.series_id, nowIso(), nowIso(),
            conflict.entityId
          ]
        );
      }
      break;
  }
  
  await saveBidirectionalSyncState();
  console.log(`Resolved conflict ${conflictId} with resolution: ${resolution}`);
}

// Incremental sync from web platform changes
export async function syncFromWebPlatform(): Promise<{ 
  seriesSynced: number; 
  sermonsSynced: number; 
  conflicts: number; 
  errors: string[] 
}> {
  await initializeBidirectionalSyncState();
  
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  let seriesSynced = 0;
  let sermonsSynced = 0;
  let conflicts = 0;
  const errors: string[] = [];
  
  try {
    notifySyncStatusChange({ syncInProgress: true });
    
    // Pull changes made on web platform since last sync
    const webSyncParams: Record<string, any> = {
      include_deleted: true,
      platform_source: 'web', // Request only web-originated changes
    };
    
    if (bidirectionalSyncState.lastWebPullAt) {
      webSyncParams.updated_at = bidirectionalSyncState.lastWebPullAt;
    }
    
    reportProgress({
      phase: 'series_pull',
      current: 0,
      total: 0,
      message: 'Syncing series changes from web platform',
      timestamp: nowIso()
    });
    
    // Fetch series changes from web
    const seriesResponse = await httpClient.get<{
      series: APISeriesRecord[];
      pagination?: { total: number; hasMore: boolean };
    }>('/api/sync/series', webSyncParams);
    
    const webSeries = seriesResponse.series || [];
    
    for (let i = 0; i < webSeries.length; i++) {
      const remoteRecord = webSeries[i];
      
      try {
        reportProgress({
          phase: 'series_pull',
          current: i + 1,
          total: webSeries.length,
          message: `Processing web series: ${remoteRecord.title}`,
          timestamp: nowIso()
        });
        
        // Check for local record
        const local = await queryFirst<{
          id: string;
          updated_at: string;
          dirty: number;
          deleted_at: string | null;
        }>(`SELECT id, updated_at, dirty, deleted_at FROM series WHERE id = ?`, [remoteRecord.id]);
        
        if (!local) {
          // New record from web - insert it
          const sqliteData = DataTransformer.seriesFromApi(remoteRecord);
          await exec(
            `INSERT OR REPLACE INTO series (id, user_id, title, description, start_date, end_date, 
             image_url, tags, status, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sqliteData.id, sqliteData.user_id, sqliteData.title, sqliteData.description,
              sqliteData.start_date, sqliteData.end_date, sqliteData.image_url, sqliteData.tags,
              sqliteData.status, sqliteData.created_at, sqliteData.updated_at, sqliteData.deleted_at,
              sqliteData.synced_at, sqliteData.dirty, sqliteData.op, sqliteData.version
            ]
          );
          seriesSynced++;
        } else {
          // Resolve conflict using bidirectional strategy
          const conflictResolution = resolveBidirectionalConflict(local, remoteRecord, 'series', remoteRecord.id);
          
          if (conflictResolution.requiresManualResolution) {
            await addPendingConflict('series', remoteRecord.id, local, remoteRecord, ['updated_at']);
            conflicts++;
          } else if (!conflictResolution.keepLocal) {
            // Accept remote changes
            const sqliteData = DataTransformer.seriesFromApi(remoteRecord);
            await exec(
              `UPDATE series SET title = ?, description = ?, start_date = ?, end_date = ?, 
               image_url = ?, tags = ?, status = ?, updated_at = ?, synced_at = ?, dirty = 0 
               WHERE id = ?`,
              [
                sqliteData.title, sqliteData.description, sqliteData.start_date,
                sqliteData.end_date, sqliteData.image_url, sqliteData.tags,
                sqliteData.status, sqliteData.updated_at, sqliteData.synced_at,
                remoteRecord.id
              ]
            );
            seriesSynced++;
          }
          // If keepLocal is true, no action needed - local record is preserved
        }
      } catch (error) {
        const errorMsg = `Failed to sync web series ${remoteRecord.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    // Sync sermons from web
    reportProgress({
      phase: 'sermons_pull',
      current: 0,
      total: 0,
      message: 'Syncing sermon changes from web platform',
      timestamp: nowIso()
    });
    
    const sermonsResponse = await httpClient.get<{
      sermons: APISermonRecord[];
      pagination?: { total: number; hasMore: boolean };
    }>('/api/sync/sermons', webSyncParams);
    
    const webSermons = sermonsResponse.sermons || [];
    
    for (let i = 0; i < webSermons.length; i++) {
      const remoteRecord = webSermons[i];
      
      try {
        reportProgress({
          phase: 'sermons_pull',
          current: i + 1,
          total: webSermons.length,
          message: `Processing web sermon: ${remoteRecord.title}`,
          timestamp: nowIso()
        });
        
        // Check for local record
        const local = await queryFirst<{
          id: string;
          updated_at: string;
          dirty: number;
          deleted_at: string | null;
          series_id: string | null;
        }>(`SELECT id, updated_at, dirty, deleted_at, series_id FROM sermons WHERE id = ?`, [remoteRecord.id]);
        
        if (!local) {
          // New record from web - insert it
          const sqliteData = DataTransformer.sermonFromApi(remoteRecord);
          await exec(
            `INSERT OR REPLACE INTO sermons (id, user_id, title, content, outline, scripture, 
             tags, status, visibility, date, notes, series_id, created_at, updated_at, deleted_at, 
             synced_at, dirty, op, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sqliteData.id, sqliteData.user_id, sqliteData.title, sqliteData.content,
              sqliteData.outline, sqliteData.scripture, sqliteData.tags, sqliteData.status,
              sqliteData.visibility, sqliteData.date, sqliteData.notes, sqliteData.series_id,
              sqliteData.created_at, sqliteData.updated_at, sqliteData.deleted_at,
              sqliteData.synced_at, sqliteData.dirty, sqliteData.op, sqliteData.version
            ]
          );
          sermonsSynced++;
        } else {
          // Resolve conflict using bidirectional strategy
          const conflictResolution = resolveBidirectionalConflict(local, remoteRecord, 'sermon', remoteRecord.id);
          
          if (conflictResolution.requiresManualResolution) {
            await addPendingConflict('sermon', remoteRecord.id, local, remoteRecord, ['updated_at', 'content']);
            conflicts++;
          } else if (!conflictResolution.keepLocal) {
            // Accept remote changes
            const sqliteData = DataTransformer.sermonFromApi(remoteRecord);
            await exec(
              `UPDATE sermons SET title = ?, content = ?, outline = ?, scripture = ?, 
               tags = ?, status = ?, visibility = ?, date = ?, notes = ?, series_id = ?,
               updated_at = ?, synced_at = ?, dirty = 0 WHERE id = ?`,
              [
                sqliteData.title, sqliteData.content, sqliteData.outline,
                sqliteData.scripture, sqliteData.tags, sqliteData.status,
                sqliteData.visibility, sqliteData.date, sqliteData.notes,
                sqliteData.series_id, sqliteData.updated_at, sqliteData.synced_at,
                remoteRecord.id
              ]
            );
            sermonsSynced++;
          }
          // If keepLocal is true, no action needed - local record is preserved
        }
      } catch (error) {
        const errorMsg = `Failed to sync web sermon ${remoteRecord.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    // Update last web pull timestamp
    bidirectionalSyncState.lastWebPullAt = nowIso();
    await saveBidirectionalSyncState();
    
    reportProgress({
      phase: 'complete',
      current: 1,
      total: 1,
      message: `Web sync completed: ${seriesSynced} series, ${sermonsSynced} sermons, ${conflicts} conflicts`,
      timestamp: nowIso()
    });
    
    return { seriesSynced, sermonsSynced, conflicts, errors };
    
  } catch (error) {
    const errorMsg = `Web platform sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    console.error(errorMsg);
    return { seriesSynced, sermonsSynced, conflicts, errors };
  } finally {
    notifySyncStatusChange({ syncInProgress: false });
  }
}

// Enhanced sync status with progress indicators
export async function getEnhancedSyncStatus(): Promise<SyncStatus & {
  lastWebSyncAt: string | null;
  pendingConflicts: number;
  syncProgress?: SyncProgress;
}> {
  await initializeSyncQueue();
  await initializeBidirectionalSyncState();
  
  const isOnline = await isAuthenticatedOnline();
  const lastSyncTime = await AsyncStorage.getItem('sync.lastSyncTime');
  
  return {
    ...currentSyncStatus,
    isOnline,
    isAuthenticated: isOnline,
    lastSyncTime: lastSyncTime || undefined,
    lastWebSyncAt: bidirectionalSyncState.lastWebPullAt,
    pendingConflicts: bidirectionalSyncState.pendingConflicts.filter(c => !c.resolved).length,
  };
}



/**
 * Conflict resolution strategy for series records
 * Returns true if local record should be preserved, false if remote should be accepted
 */
function resolveSeriesConflict(
  local: { updated_at: string; dirty: number; deleted_at: string | null },
  remote: { updated_at: string; deleted_at?: string | null }
): { keepLocal: boolean; reason: string } {
  const localUpdated = new Date(local.updated_at);
  const remoteUpdated = new Date(remote.updated_at);
  
  // If local record is dirty (has unsaved changes), prefer local
  if (local.dirty === 1) {
    return {
      keepLocal: true,
      reason: 'Local record has unsaved changes (dirty=1)'
    };
  }
  
  // If local record is deleted but remote is not, prefer local deletion
  if (local.deleted_at && !remote.deleted_at) {
    return {
      keepLocal: true,
      reason: 'Local record is deleted but remote is not'
    };
  }
  
  // If remote record is deleted but local is not, accept remote deletion
  if (!local.deleted_at && remote.deleted_at) {
    return {
      keepLocal: false,
      reason: 'Remote record is deleted but local is not'
    };
  }
  
  // Compare timestamps - prefer newer record
  if (localUpdated > remoteUpdated) {
    return {
      keepLocal: true,
      reason: `Local record is newer (${local.updated_at} > ${remote.updated_at})`
    };
  } else if (remoteUpdated > localUpdated) {
    return {
      keepLocal: false,
      reason: `Remote record is newer (${remote.updated_at} > ${local.updated_at})`
    };
  }
  
  // If timestamps are equal, prefer remote (server wins)
  return {
    keepLocal: false,
    reason: 'Timestamps are equal, preferring remote record'
  };
}

/**
 * Conflict resolution strategy for sermon records
 * Returns true if local record should be preserved, false if remote should be accepted
 */
function resolveSermonConflict(
  local: { updated_at: string; dirty: number; deleted_at: string | null; series_id: string | null },
  remote: { updated_at: string; deleted_at?: string | null; series_id?: string | null }
): { keepLocal: boolean; reason: string } {
  const localUpdated = new Date(local.updated_at);
  const remoteUpdated = new Date(remote.updated_at);
  
  // If local record is dirty (has unsaved changes), prefer local
  if (local.dirty === 1) {
    return {
      keepLocal: true,
      reason: 'Local record has unsaved changes (dirty=1)'
    };
  }
  
  // If local record is deleted but remote is not, prefer local deletion
  if (local.deleted_at && !remote.deleted_at) {
    return {
      keepLocal: true,
      reason: 'Local record is deleted but remote is not'
    };
  }
  
  // If remote record is deleted but local is not, accept remote deletion
  if (!local.deleted_at && remote.deleted_at) {
    return {
      keepLocal: false,
      reason: 'Remote record is deleted but local is not'
    };
  }
  
  // Handle series relationship conflicts
  if (local.series_id !== remote.series_id) {
    // If local record is dirty, prefer local series relationship
    if (local.dirty === 1) {
      return {
        keepLocal: true,
        reason: `Local record has different series relationship and is dirty (local: ${local.series_id}, remote: ${remote.series_id})`
      };
    }
    // Otherwise, log the conflict but continue with timestamp comparison
    console.warn(`Series relationship conflict for sermon: local=${local.series_id}, remote=${remote.series_id}`);
  }
  
  // Compare timestamps - prefer newer record
  if (localUpdated > remoteUpdated) {
    return {
      keepLocal: true,
      reason: `Local record is newer (${local.updated_at} > ${remote.updated_at})`
    };
  } else if (remoteUpdated > localUpdated) {
    return {
      keepLocal: false,
      reason: `Remote record is newer (${remote.updated_at} > ${local.updated_at})`
    };
  }
  
  // If timestamps are equal, prefer remote (server wins)
  return {
    keepLocal: false,
    reason: 'Timestamps are equal, preferring remote record'
  };
}

async function pushSeries(userId: string): Promise<{ pushed: number; errors: string[] }> {
  const rows = await queryAll<SQLiteSeriesRecord>(
    `SELECT * FROM series WHERE user_id = ? AND dirty = 1`,
    [userId]
  );
  
  if (rows.length === 0) {
    return { pushed: 0, errors: [] };
  }

  const upserts = rows.filter(r => r.op === 'upsert');
  const deletes = rows.filter(r => r.op === 'delete');
  const total = rows.length;

  const successIds: string[] = [];
  const errors: string[] = [];
  let current = 0;

  reportProgress({
    phase: 'series_push',
    current: 0,
    total,
    message: `Starting to push ${total} series records`,
    timestamp: nowIso()
  });

  // Handle upsert operations (create/update)
  for (const record of upserts) {
    current++;
    try {
      reportProgress({
        phase: 'series_push',
        current,
        total,
        message: `Pushing series: ${record.title || record.id}`,
        timestamp: nowIso()
      });

      const apiData = DataTransformer.seriesToApi(record);
      
      // Validate data before sending
      const validationErrors = DataTransformer.validateSeriesForApi(apiData);
      if (validationErrors.length > 0) {
        const errorMsg = `Validation failed for series ${record.id}: ${validationErrors.join(', ')}`;
        errors.push(errorMsg);
        reportError({
          id: `series_validation_${record.id}`,
          type: 'validation',
          entity: 'series',
          entityId: record.id,
          message: errorMsg,
          timestamp: nowIso(),
          retryCount: 0
        });
        continue; // Skip this record but continue with others
      }

      // Check if series exists by trying to get it first
      let isUpdate = false;
      try {
        await httpClient.get<APISeriesRecord>(`/api/series/${record.id}`);
        isUpdate = true;
      } catch (error) {
        // Series doesn't exist, will create new one
        isUpdate = false;
      }

      if (isUpdate) {
        // Update existing series
        await httpClient.put<APISeriesRecord>(`/api/series/${record.id}`, apiData);
      } else {
        // Create new series
        await httpClient.post<APISeriesRecord>('/api/series', apiData);
      }

      successIds.push(record.id);
    } catch (error) {
      const errorMsg = `Failed to push series ${record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      reportError({
        id: `series_push_${record.id}`,
        type: error instanceof Error && error.message.includes('Network') ? 'network' : 'push',
        entity: 'series',
        entityId: record.id,
        message: errorMsg,
        timestamp: nowIso(),
        retryCount: 0
      });
      // Continue with other records, keep dirty flag for retry
    }
  }

  // Handle delete operations (soft delete)
  for (const record of deletes) {
    current++;
    try {
      reportProgress({
        phase: 'series_push',
        current,
        total,
        message: `Deleting series: ${record.title || record.id}`,
        timestamp: nowIso()
      });

      // Perform soft delete via ExpressJS API
      try {
        await httpClient.delete(`/api/series/${record.id}`);
      } catch (deleteError) {
        // If series is already deleted (404) or not found, treat as success
        if (deleteError instanceof Error && 
            (deleteError.message.includes('404') || 
             deleteError.message.includes('HTTP 404') ||
             deleteError.message.includes('Series not found') ||
             deleteError.message.includes('not found'))) {
          console.log(`Series ${record.id} already deleted on server, marking as synced locally`);
        } else {
          // Re-throw other errors
          throw deleteError;
        }
      }
      
      // Handle cascade delete scenario - update dependent sermons to remove series reference
      // The ExpressJS API already handles this on the server side, but we need to sync locally
      await exec(
        `UPDATE sermons SET series_id = NULL, updated_at = ?, dirty = 1, op = 'upsert' WHERE series_id = ? AND deleted_at IS NULL`,
        [nowIso(), record.id]
      );
      
      // Mark series as successfully deleted locally
      await exec(
        `UPDATE series SET deleted_at = ?, synced_at = ?, dirty = 0 WHERE id = ?`,
        [record.deleted_at || nowIso(), nowIso(), record.id]
      );
      
      successIds.push(record.id);
    } catch (error) {
      const errorMsg = `Failed to delete series ${record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      reportError({
        id: `series_delete_${record.id}`,
        type: error instanceof Error && error.message.includes('Network') ? 'network' : 'push',
        entity: 'series',
        entityId: record.id,
        message: errorMsg,
        timestamp: nowIso(),
        retryCount: 0
      });
      // Continue with other records, keep dirty flag for retry
    }
  }

  // Mark successfully synced records as clean
  if (successIds.length > 0) {
    const placeholders = successIds.map(() => '?').join(',');
    await exec(`UPDATE series SET dirty = 0, synced_at = ? WHERE id IN (${placeholders})`, [nowIso(), ...successIds]);
  }

  reportProgress({
    phase: 'series_push',
    current: total,
    total,
    message: `Series push completed: ${successIds.length} successful, ${errors.length} errors`,
    timestamp: nowIso()
  });

  return { pushed: successIds.length, errors };
}

async function pushSermons(userId: string): Promise<{ pushed: number; errors: string[] }> {
  const rows = await queryAll<SQLiteSermonRecord>(
    `SELECT * FROM sermons WHERE user_id = ? AND dirty = 1`,
    [userId]
  );
  
  if (rows.length === 0) {
    return { pushed: 0, errors: [] };
  }

  const upserts = rows.filter(r => r.op === 'upsert');
  const deletes = rows.filter(r => r.op === 'delete');
  const total = rows.length;

  const successIds: string[] = [];
  const errors: string[] = [];
  let current = 0;

  reportProgress({
    phase: 'sermons_push',
    current: 0,
    total,
    message: `Starting to push ${total} sermon records`,
    timestamp: nowIso()
  });

  // Handle upsert operations (create/update)
  for (const record of upserts) {
    current++;
    try {
      reportProgress({
        phase: 'sermons_push',
        current,
        total,
        message: `Pushing sermon: ${record.title || record.id}`,
        timestamp: nowIso()
      });

      const apiData = DataTransformer.sermonToApi(record);
      
      // Validate data before sending
      const validationErrors = DataTransformer.validateSermonForApi(apiData);
      if (validationErrors.length > 0) {
        const errorMsg = `Validation failed for sermon ${record.id}: ${validationErrors.join(', ')}`;
        errors.push(errorMsg);
        reportError({
          id: `sermon_validation_${record.id}`,
          type: 'validation',
          entity: 'sermon',
          entityId: record.id,
          message: errorMsg,
          timestamp: nowIso(),
          retryCount: 0
        });
        continue; // Skip this record but continue with others
      }

      // Validate series relationship if present
      if (apiData.series_id) {
        try {
          // Check if the series exists locally and is synced
          const localSeries = await queryFirst<{ id: string; dirty: number }>(
            `SELECT id, dirty FROM series WHERE id = ? AND user_id = ?`,
            [apiData.series_id, userId]
          );
          
          if (!localSeries) {
            const errorMsg = `Series ${apiData.series_id} not found locally for sermon ${record.id}`;
            errors.push(errorMsg);
            reportError({
              id: `sermon_series_ref_${record.id}`,
              type: 'validation',
              entity: 'sermon',
              entityId: record.id,
              message: errorMsg,
              timestamp: nowIso(),
              retryCount: 0
            });
            continue; // Skip this sermon until series is synced
          }
          
          if (localSeries.dirty === 1) {
            console.warn(`Series ${apiData.series_id} has unsaved changes, sermon ${record.id} may have stale series reference`);
            // Continue anyway - the series will be synced in its own push operation
          }
        } catch (error) {
          const errorMsg = `Failed to validate series relationship for sermon ${record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          reportError({
            id: `sermon_series_validation_${record.id}`,
            type: 'validation',
            entity: 'sermon',
            entityId: record.id,
            message: errorMsg,
            timestamp: nowIso(),
            retryCount: 0
          });
          continue;
        }
      }

      // Check if sermon exists by trying to get it first
      let isUpdate = false;
      try {
        await httpClient.get<APISermonRecord>(`/api/sermons/${record.id}`);
        isUpdate = true;
      } catch (error) {
        // Sermon doesn't exist, will create new one
        isUpdate = false;
      }

      if (isUpdate) {
        // Update existing sermon
        await httpClient.put<APISermonRecord>(`/api/sermons/${record.id}`, apiData);
      } else {
        // Create new sermon
        await httpClient.post<APISermonRecord>('/api/sermons', apiData);
      }

      successIds.push(record.id);
    } catch (error) {
      const errorMsg = `Failed to push sermon ${record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      reportError({
        id: `sermon_push_${record.id}`,
        type: error instanceof Error && error.message.includes('Network') ? 'network' : 'push',
        entity: 'sermon',
        entityId: record.id,
        message: errorMsg,
        timestamp: nowIso(),
        retryCount: 0
      });
      // Continue with other records, keep dirty flag for retry
    }
  }

  // Handle delete operations (soft delete)
  for (const record of deletes) {
    current++;
    try {
      reportProgress({
        phase: 'sermons_push',
        current,
        total,
        message: `Deleting sermon: ${record.title || record.id}`,
        timestamp: nowIso()
      });

      // Perform soft delete via ExpressJS API
      try {
        await httpClient.delete(`/api/sermons/${record.id}`);
      } catch (deleteError) {
        // If sermon is already deleted (404) or not found, treat as success
        if (deleteError instanceof Error && 
            (deleteError.message.includes('404') || 
             deleteError.message.includes('HTTP 404') ||
             deleteError.message.includes('Sermon not found') ||
             deleteError.message.includes('not found'))) {
          console.log(`Sermon ${record.id} already deleted on server, marking as synced locally`);
        } else {
          // Re-throw other errors
          throw deleteError;
        }
      }
      
      // Mark as successfully deleted locally
      await exec(
        `UPDATE sermons SET deleted_at = ?, synced_at = ?, dirty = 0 WHERE id = ?`,
        [record.deleted_at || nowIso(), nowIso(), record.id]
      );
      
      successIds.push(record.id);
    } catch (error) {
      const errorMsg = `Failed to delete sermon ${record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      reportError({
        id: `sermon_delete_${record.id}`,
        type: error instanceof Error && error.message.includes('Network') ? 'network' : 'push',
        entity: 'sermon',
        entityId: record.id,
        message: errorMsg,
        timestamp: nowIso(),
        retryCount: 0
      });
      // Continue with other records, keep dirty flag for retry
    }
  }

  // Mark successfully synced records as clean
  if (successIds.length > 0) {
    const placeholders = successIds.map(() => '?').join(',');
    await exec(`UPDATE sermons SET dirty = 0, synced_at = ? WHERE id IN (${placeholders})`, [nowIso(), ...successIds]);
  }

  reportProgress({
    phase: 'sermons_push',
    current: total,
    total,
    message: `Sermon push completed: ${successIds.length} successful, ${errors.length} errors`,
    timestamp: nowIso()
  });

  return { pushed: successIds.length, errors };
}

async function pullSeries(userId: string): Promise<{ pulled: number; conflicts: number; errors: string[] }> {
  const key = LP_KEYS.series(userId);
  const since = (await AsyncStorage.getItem(key)) || null;
  
  let pulled = 0;
  let conflicts = 0;
  const errors: string[] = [];
  
  try {
    reportProgress({
      phase: 'series_pull',
      current: 0,
      total: 0,
      message: 'Starting series pull from server',
      timestamp: nowIso()
    });

    // Build query parameters for incremental sync
    const params: Record<string, any> = {
      include_deleted: true // Request deleted records for sync purposes
    };
    if (since) {
      params.updated_at = since;
    }
    
    // Fetch series from ExpressJS API with pagination support
    let allSeries: APISeriesRecord[] = [];
    let page = 1;
    const limit = 100; // Process in batches to handle large datasets
    
    while (true) {
      const queryParams = { ...params, page, limit };
      const response = await httpClient.get<{
        series: APISeriesRecord[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          hasMore: boolean;
        };
      }>('/api/series', queryParams);
      
      const series = response.series || [];
      allSeries.push(...series);
      
      reportProgress({
        phase: 'series_pull',
        current: allSeries.length,
        total: response.pagination?.total || allSeries.length,
        message: `Fetched ${allSeries.length} series records from server`,
        timestamp: nowIso()
      });
      
      // Check if there are more pages
      if (!response.pagination?.hasMore || series.length < limit) {
        break;
      }
      page++;
    }

    const total = allSeries.length;
    let current = 0;

    // Process each series record
    for (const remoteRecord of allSeries) {
      current++;
      try {
        reportProgress({
          phase: 'series_pull',
          current,
          total,
          message: `Processing series: ${remoteRecord.title || remoteRecord.id}`,
          timestamp: nowIso()
        });

        // Check local record
        const local = await queryFirst<{
          id: string;
          updated_at: string;
          dirty: number;
          deleted_at: string | null;
        }>(`SELECT id, updated_at, dirty, deleted_at FROM series WHERE id = ?`, [remoteRecord.id]);
        
        const remoteUpdated = remoteRecord.updated_at || remoteRecord.created_at || nowIso();
        
        if (!local) {
          // New record from remote - insert it
          const sqliteData = DataTransformer.seriesFromApi(remoteRecord);
          
          // Handle deleted records from remote
          if (remoteRecord.deleted_at) {
            // Insert as deleted record
            await exec(
              `INSERT OR REPLACE INTO series (id, user_id, title, description, start_date, end_date, image_url, tags, status, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sqliteData.id || '',
                sqliteData.user_id || '',
                sqliteData.title || '',
                sqliteData.description || null,
                sqliteData.start_date || null,
                sqliteData.end_date || null,
                sqliteData.image_url || null,
                sqliteData.tags || '[]',
                sqliteData.status || 'planning',
                sqliteData.created_at || nowIso(),
                sqliteData.updated_at || nowIso(),
                sqliteData.deleted_at || null,
                sqliteData.synced_at || nowIso(),
                sqliteData.dirty || 0,
                'delete',
                sqliteData.version || 0
              ]
            );
          } else {
            // Insert as active record
            await exec(
              `INSERT OR REPLACE INTO series (id, user_id, title, description, start_date, end_date, image_url, tags, status, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sqliteData.id || '',
                sqliteData.user_id || '',
                sqliteData.title || '',
                sqliteData.description || null,
                sqliteData.start_date || null,
                sqliteData.end_date || null,
                sqliteData.image_url || null,
                sqliteData.tags || '[]',
                sqliteData.status || 'planning',
                sqliteData.created_at || nowIso(),
                sqliteData.updated_at || nowIso(),
                null,
                sqliteData.synced_at || nowIso(),
                sqliteData.dirty || 0,
                sqliteData.op || 'upsert',
                sqliteData.version || 0
              ]
            );
          }
          pulled++;
        } else {
          // Record exists locally - resolve conflicts using bidirectional strategy
          const conflictResolution = resolveBidirectionalConflict(local, remoteRecord, 'series', remoteRecord.id);
          
          if (conflictResolution.requiresManualResolution) {
            // Add to pending conflicts for manual resolution
            await addPendingConflict('series', remoteRecord.id, local, remoteRecord, ['updated_at']);
            conflicts++;
            console.log(`Series conflict requires manual resolution for ${remoteRecord.id}: ${conflictResolution.reason}`);
            reportError({
              id: `series_conflict_${remoteRecord.id}`,
              type: 'conflict',
              entity: 'series',
              entityId: remoteRecord.id,
              message: `Manual conflict resolution required: ${conflictResolution.reason}`,
              timestamp: nowIso(),
              retryCount: 0
            });
          } else if (conflictResolution.keepLocal) {
            // Log conflict for monitoring but keep local
            conflicts++;
            console.log(`Series conflict resolved for ${remoteRecord.id}: ${conflictResolution.reason}`);
            reportError({
              id: `series_conflict_${remoteRecord.id}`,
              type: 'conflict',
              entity: 'series',
              entityId: remoteRecord.id,
              message: `Conflict resolved (kept local): ${conflictResolution.reason}`,
              timestamp: nowIso(),
              retryCount: 0
            });
          } else {
            // Accept remote record
            const sqliteData = DataTransformer.seriesFromApi(remoteRecord);
            
            if (remoteRecord.deleted_at) {
              // Handle remote deletion
              await exec(
                `UPDATE series SET deleted_at = ?, synced_at = ?, dirty = 0, op = 'delete' WHERE id = ?`,
                [remoteRecord.deleted_at, nowIso(), remoteRecord.id]
              );
            } else {
              // Update with remote data
              await exec(
                `UPDATE series SET title = ?, description = ?, start_date = ?, end_date = ?, 
                 image_url = ?, tags = ?, status = ?, updated_at = ?, synced_at = ?, dirty = 0 
                 WHERE id = ?`,
                [
                  sqliteData.title, sqliteData.description, sqliteData.start_date,
                  sqliteData.end_date, sqliteData.image_url, sqliteData.tags,
                  sqliteData.status, sqliteData.updated_at, sqliteData.synced_at,
                  remoteRecord.id
                ]
              );
            }
            pulled++;
            console.log(`Series conflict resolved for ${remoteRecord.id}: ${conflictResolution.reason}`);
          }
          
          // If conflict was resolved (kept local), continue to next record
          if (conflictResolution.resolution === 'keep_local') {
            continue;
          }
          
          // Log when accepting remote changes
          console.log(`Accepting remote changes for series ${remoteRecord.id}: ${conflictResolution.reason}`);
          
          // Remote changes are newer - update local record
          const sqliteData = DataTransformer.seriesFromApi(remoteRecord);
          
          // Handle soft delete from remote
          if (remoteRecord.deleted_at) {
            // Update local record to mark as deleted
            await exec(
              `UPDATE series SET title = ?, description = ?, start_date = ?, end_date = ?, image_url = ?, tags = ?, status = ?, updated_at = ?, deleted_at = ?, synced_at = ?, dirty = 0, op = 'delete' WHERE id = ?`,
              [
                sqliteData.title || '',
                sqliteData.description || null,
                sqliteData.start_date || null,
                sqliteData.end_date || null,
                sqliteData.image_url || null,
                sqliteData.tags || '[]',
                sqliteData.status || 'planning',
                sqliteData.updated_at || nowIso(),
                sqliteData.deleted_at || null,
                sqliteData.synced_at || nowIso(),
                remoteRecord.id
              ]
            );
            
            // Handle cascade effect - update dependent sermons to remove series reference
            await exec(
              `UPDATE sermons SET series_id = NULL, updated_at = ?, dirty = 1, op = 'upsert' WHERE series_id = ? AND deleted_at IS NULL`,
              [nowIso(), remoteRecord.id]
            );
          } else {
            // Update local record with remote changes
            await exec(
              `UPDATE series SET title = ?, description = ?, start_date = ?, end_date = ?, image_url = ?, tags = ?, status = ?, updated_at = ?, deleted_at = NULL, synced_at = ?, dirty = 0, op = 'upsert' WHERE id = ?`,
              [
                sqliteData.title || '',
                sqliteData.description || null,
                sqliteData.start_date || null,
                sqliteData.end_date || null,
                sqliteData.image_url || null,
                sqliteData.tags || '[]',
                sqliteData.status || 'planning',
                sqliteData.updated_at || nowIso(),
                sqliteData.synced_at || nowIso(),
                remoteRecord.id
              ]
            );
          }
          pulled++;
        }
      } catch (error) {
        const errorMsg = `Failed to process series ${remoteRecord.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        reportError({
          id: `series_pull_${remoteRecord.id}`,
          type: 'pull',
          entity: 'series',
          entityId: remoteRecord.id,
          message: errorMsg,
          timestamp: nowIso(),
          retryCount: 0
        });
      }
    }
    
    // Update last pulled timestamp
    await AsyncStorage.setItem(key, nowIso());

    reportProgress({
      phase: 'series_pull',
      current: total,
      total,
      message: `Series pull completed: ${pulled} pulled, ${conflicts} conflicts, ${errors.length} errors`,
      timestamp: nowIso()
    });

    return { pulled, conflicts, errors };
  } catch (error) {
    const errorMsg = `Failed to pull series: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    reportError({
      id: 'series_pull_general',
      type: 'pull',
      entity: 'series',
      message: errorMsg,
      timestamp: nowIso(),
      retryCount: 0
    });
    throw error;
  }
}

async function pullSermons(userId: string): Promise<{ pulled: number; conflicts: number; errors: string[] }> {
  const key = LP_KEYS.sermons(userId);
  const since = (await AsyncStorage.getItem(key)) || null;
  
  let pulled = 0;
  let conflicts = 0;
  const errors: string[] = [];
  
  try {
    reportProgress({
      phase: 'sermons_pull',
      current: 0,
      total: 0,
      message: 'Starting sermon pull from server',
      timestamp: nowIso()
    });

    // Build query parameters for incremental sync
    const params: Record<string, any> = {
      include_deleted: true // Request deleted records for sync purposes
    };
    if (since) {
      params.updated_at = since;
    }
    
    // Fetch sermons from ExpressJS API with pagination support
    let allSermons: APISermonRecord[] = [];
    let page = 1;
    const limit = 100; // Process in batches to handle large datasets
    
    while (true) {
      const queryParams = { ...params, page, limit };
      const response = await httpClient.get<{
        sermons: APISermonRecord[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>('/api/sermons', queryParams);
      
      const sermons = response.sermons || [];
      allSermons.push(...sermons);
      
      reportProgress({
        phase: 'sermons_pull',
        current: allSermons.length,
        total: response.pagination?.total || allSermons.length,
        message: `Fetched ${allSermons.length} sermon records from server`,
        timestamp: nowIso()
      });
      
      // Check if there are more pages
      if (!response.pagination || page >= response.pagination.totalPages || sermons.length < limit) {
        break;
      }
      page++;
    }

    const total = allSermons.length;
    let current = 0;

    // Process each sermon record
    for (const remoteRecord of allSermons) {
      current++;
      try {
        reportProgress({
          phase: 'sermons_pull',
          current,
          total,
          message: `Processing sermon: ${remoteRecord.title || remoteRecord.id}`,
          timestamp: nowIso()
        });

        // Check local record
        const local = await queryFirst<{
          id: string;
          updated_at: string;
          dirty: number;
          deleted_at: string | null;
          series_id: string | null;
        }>(`SELECT id, updated_at, dirty, deleted_at, series_id FROM sermons WHERE id = ?`, [remoteRecord.id]);
        
        const remoteUpdated = remoteRecord.updated_at || remoteRecord.created_at || nowIso();
        
        if (!local) {
          // New record from remote - insert it
          const sqliteData = DataTransformer.sermonFromApi(remoteRecord);
          
          // Validate series relationship if present and record is not deleted
          if (sqliteData.series_id && !remoteRecord.deleted_at) {
            const seriesExists = await queryFirst<{ id: string }>(
              `SELECT id FROM series WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
              [sqliteData.series_id, userId]
            );
            
            if (!seriesExists) {
              console.warn(`Sermon ${remoteRecord.id} references non-existent series ${sqliteData.series_id}, will sync series first`);
              // Temporarily clear the series reference and mark for re-sync
              sqliteData.series_id = null;
              sqliteData.dirty = 1; // Mark as dirty so it gets re-synced after series sync
              console.log(`Temporarily clearing series reference for sermon ${remoteRecord.id}, will be restored after series sync`);
            }
          }
          
          // Handle deleted records from remote
          if (remoteRecord.deleted_at) {
            // Insert as deleted record
            await exec(
              `INSERT OR REPLACE INTO sermons (id, user_id, title, content, outline, scripture, tags, status, visibility, date, notes, series_id, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sqliteData.id || '',
                sqliteData.user_id || '',
                sqliteData.title || '',
                sqliteData.content || null,
                sqliteData.outline || null,
                sqliteData.scripture || null,
                sqliteData.tags || '[]',
                sqliteData.status || 'draft',
                sqliteData.visibility || 'private',
                sqliteData.date || null,
                sqliteData.notes || null,
                sqliteData.series_id || null,
                sqliteData.created_at || nowIso(),
                sqliteData.updated_at || nowIso(),
                sqliteData.deleted_at || null,
                sqliteData.synced_at || nowIso(),
                sqliteData.dirty || 0,
                'delete',
                sqliteData.version || 0
              ]
            );
          } else {
            // Insert as active record
            await exec(
              `INSERT OR REPLACE INTO sermons (id, user_id, title, content, outline, scripture, tags, status, visibility, date, notes, series_id, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sqliteData.id || '',
                sqliteData.user_id || '',
                sqliteData.title || '',
                sqliteData.content || null,
                sqliteData.outline || null,
                sqliteData.scripture || null,
                sqliteData.tags || '[]',
                sqliteData.status || 'draft',
                sqliteData.visibility || 'private',
                sqliteData.date || null,
                sqliteData.notes || null,
                sqliteData.series_id || null,
                sqliteData.created_at || nowIso(),
                sqliteData.updated_at || nowIso(),
                null,
                sqliteData.synced_at || nowIso(),
                sqliteData.dirty || 0,
                sqliteData.op || 'upsert',
                sqliteData.version || 0
              ]
            );
          }
          pulled++;
        } else {
          // Record exists locally - resolve conflicts
          const conflictResolution = resolveSermonConflict(local, remoteRecord);
          
          if (conflictResolution.keepLocal) {
            // Log conflict for monitoring
            conflicts++;
            console.log(`Sermon conflict resolved for ${remoteRecord.id}: ${conflictResolution.reason}`);
            reportError({
              id: `sermon_conflict_${remoteRecord.id}`,
              type: 'conflict',
              entity: 'sermon',
              entityId: remoteRecord.id,
              message: `Conflict resolved (kept local): ${conflictResolution.reason}`,
              timestamp: nowIso(),
              retryCount: 0
            });
            continue;
          }
          
          // Log when accepting remote changes
          console.log(`Accepting remote changes for sermon ${remoteRecord.id}: ${conflictResolution.reason}`);
          
          // Remote changes are newer - update local record
          const sqliteData = DataTransformer.sermonFromApi(remoteRecord);
          
          // Validate series relationship if present in remote record and record is not deleted
          let shouldMarkDirty = false;
          if (sqliteData.series_id && !remoteRecord.deleted_at) {
            const seriesExists = await queryFirst<{ id: string }>(
              `SELECT id FROM series WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
              [sqliteData.series_id, userId]
            );
            
            if (!seriesExists) {
              console.warn(`Remote sermon ${remoteRecord.id} references non-existent series ${sqliteData.series_id}, will sync series first`);
              // Temporarily clear the series reference and mark for re-sync
              sqliteData.series_id = null;
              shouldMarkDirty = true;
              console.log(`Temporarily clearing series reference for sermon ${remoteRecord.id}, will be restored after series sync`);
            }
          }
          
          // Handle soft delete from remote
          if (remoteRecord.deleted_at) {
            // Update local record to mark as deleted
            await exec(
              `UPDATE sermons SET title = ?, content = ?, outline = ?, scripture = ?, tags = ?, status = ?, visibility = ?, date = ?, notes = ?, series_id = ?, updated_at = ?, deleted_at = ?, synced_at = ?, dirty = ?, op = 'delete' WHERE id = ?`,
              [
                sqliteData.title || '',
                sqliteData.content || null,
                sqliteData.outline || null,
                sqliteData.scripture || null,
                sqliteData.tags || '[]',
                sqliteData.status || 'draft',
                sqliteData.visibility || 'private',
                sqliteData.date || null,
                sqliteData.notes || null,
                sqliteData.series_id || null,
                sqliteData.updated_at || nowIso(),
                sqliteData.deleted_at || null,
                sqliteData.synced_at || nowIso(),
                shouldMarkDirty ? 1 : 0,
                remoteRecord.id
              ]
            );
          } else {
            // Update local record with remote changes
            await exec(
              `UPDATE sermons SET title = ?, content = ?, outline = ?, scripture = ?, tags = ?, status = ?, visibility = ?, date = ?, notes = ?, series_id = ?, updated_at = ?, deleted_at = NULL, synced_at = ?, dirty = ?, op = 'upsert' WHERE id = ?`,
              [
                sqliteData.title || '',
                sqliteData.content || null,
                sqliteData.outline || null,
                sqliteData.scripture || null,
                sqliteData.tags || '[]',
                sqliteData.status || 'draft',
                sqliteData.visibility || 'private',
                sqliteData.date || null,
                sqliteData.notes || null,
                sqliteData.series_id || null,
                sqliteData.updated_at || nowIso(),
                sqliteData.synced_at || nowIso(),
                shouldMarkDirty ? 1 : 0,
                remoteRecord.id
              ]
            );
          }
          pulled++;
        }
      } catch (error) {
        const errorMsg = `Failed to process sermon ${remoteRecord.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        reportError({
          id: `sermon_pull_${remoteRecord.id}`,
          type: 'pull',
          entity: 'sermon',
          entityId: remoteRecord.id,
          message: errorMsg,
          timestamp: nowIso(),
          retryCount: 0
        });
      }
    }
    
    // Update last pulled timestamp
    await AsyncStorage.setItem(key, nowIso());

    reportProgress({
      phase: 'sermons_pull',
      current: total,
      total,
      message: `Sermon pull completed: ${pulled} pulled, ${conflicts} conflicts, ${errors.length} errors`,
      timestamp: nowIso()
    });

    return { pulled, conflicts, errors };
  } catch (error) {
    const errorMsg = `Failed to pull sermons: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    reportError({
      id: 'sermon_pull_general',
      type: 'pull',
      entity: 'sermon',
      message: errorMsg,
      timestamp: nowIso(),
      retryCount: 0
    });
    throw error;
  }
}

export async function syncSeries(): Promise<{ pushed: number; pulled: number; conflicts: number; errors: string[] }> {
  const userId = await getCurrentUserId();
  const pushResult = await pushSeries(userId);
  const pullResult = await pullSeries(userId);
  
  return {
    pushed: pushResult.pushed,
    pulled: pullResult.pulled,
    conflicts: pullResult.conflicts,
    errors: [...pushResult.errors, ...pullResult.errors]
  };
}

export async function syncSermons(): Promise<{ pushed: number; pulled: number; conflicts: number; errors: string[] }> {
  const userId = await getCurrentUserId();
  const pushResult = await pushSermons(userId);
  const pullResult = await pullSermons(userId);
  
  return {
    pushed: pushResult.pushed,
    pulled: pullResult.pulled,
    conflicts: pullResult.conflicts,
    errors: [...pushResult.errors, ...pullResult.errors]
  };
}

export async function syncAll(): Promise<SyncResult> {
  const startTime = nowIso();
  
  // Check if user is authenticated online before attempting sync
  const isOnline = await isAuthenticatedOnline();
  if (!isOnline) {
    console.log('Skipping sync - user not authenticated online');
    
    const endTime = nowIso();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    
    return {
      success: true,
      startTime,
      endTime,
      duration,
      seriesStats: { pushed: 0, pulled: 0, conflicts: 0, errors: [] },
      sermonStats: { pushed: 0, pulled: 0, conflicts: 0, errors: [] },
      totalErrors: []
    };
  }
  
  const userId = await getCurrentUserId();
  currentSyncStatus.syncInProgress = true;
  
  let seriesStats = {
    pushed: 0,
    pulled: 0,
    conflicts: 0,
    errors: [] as string[]
  };
  
  let sermonStats = {
    pushed: 0,
    pulled: 0,
    conflicts: 0,
    errors: [] as string[]
  };
  
  const totalErrors: string[] = [];
  
  try {
    // Process any queued operations first
    await processSyncQueue();
    
    reportProgress({
      phase: 'series_push',
      current: 0,
      total: 0,
      message: 'Starting full sync - series first to maintain referential integrity',
      timestamp: nowIso()
    });

    // Sync series first to maintain referential integrity
    // Series must exist before sermons can reference them
    console.log('Starting series sync...');
    const seriesResult = await syncSeries();
    seriesStats = seriesResult;
    console.log(`Series sync completed: ${seriesResult.pushed} pushed, ${seriesResult.pulled} pulled, ${seriesResult.conflicts} conflicts, ${seriesResult.errors.length} errors`);
    
    // Sync sermons after series to ensure FK references exist
    console.log('Starting sermon sync...');
    const sermonResult = await syncSermons();
    sermonStats = sermonResult;
    console.log(`Sermon sync completed: ${sermonResult.pushed} pushed, ${sermonResult.pulled} pulled, ${sermonResult.conflicts} conflicts, ${sermonResult.errors.length} errors`);
    
    // Check if there are any sermons marked as dirty (possibly due to missing series references)
    const dirtySermons = await queryAll<{ id: string; series_id: string | null }>(
      `SELECT id, series_id FROM sermons WHERE user_id = ? AND dirty = 1 AND deleted_at IS NULL`,
      [userId]
    );
    
    if (dirtySermons.length > 0) {
      console.log(`Found ${dirtySermons.length} dirty sermons, checking for missing series references...`);
      
      // Count how many have missing series references
      const sermonsWithMissingRefs = dirtySermons.filter(s => s.series_id === null);
      
      if (sermonsWithMissingRefs.length > 0) {
        console.log(`Found ${sermonsWithMissingRefs.length} sermons with missing series references, attempting second sync pass...`);
        
        reportProgress({
          phase: 'sermons_pull',
          current: 0,
          total: sermonsWithMissingRefs.length,
          message: `Re-syncing ${sermonsWithMissingRefs.length} sermons to restore series references`,
          timestamp: nowIso()
        });
        
        // Re-fetch and update sermons that had missing series references
        console.log('Re-fetching sermon data from server to restore series references...');
        
        let restoredCount = 0;
        for (const sermon of sermonsWithMissingRefs) {
          try {
            // Fetch the latest sermon data from server
            const latestSermonData = await httpClient.get<APISermonRecord>(`/api/sermons/${sermon.id}`);
            
            if (latestSermonData && latestSermonData.series_id) {
              // Check if the series now exists locally
              const seriesExists = await queryFirst<{ id: string }>(
                `SELECT id FROM series WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
                [latestSermonData.series_id, userId]
              );
              
              if (seriesExists) {
                // Update the sermon with the correct series reference
                await exec(
                  `UPDATE sermons SET series_id = ?, dirty = 0, synced_at = ? WHERE id = ? AND user_id = ?`,
                  [latestSermonData.series_id, nowIso(), sermon.id, userId]
                );
                restoredCount++;
                console.log(`Restored series reference for sermon ${sermon.id}: ${latestSermonData.series_id}`);
              } else {
                console.warn(`Series ${latestSermonData.series_id} still not found for sermon ${sermon.id}`);
              }
            }
          } catch (error) {
            console.error(`Failed to re-fetch sermon ${sermon.id}:`, error);
          }
        }
        
        console.log(`Restored series references for ${restoredCount}/${sermonsWithMissingRefs.length} sermons`);
        
        // For compatibility, create a mock second sync result
        const secondSermonResult = {
          pushed: 0,
          pulled: restoredCount,
          conflicts: 0,
          errors: []
        };
        
        // Merge results
        sermonStats.pushed += secondSermonResult.pushed;
        sermonStats.pulled += secondSermonResult.pulled;
        sermonStats.conflicts += secondSermonResult.conflicts;
        sermonStats.errors.push(...secondSermonResult.errors);
        
        console.log(`Second sermon sync completed: ${secondSermonResult.pushed} pushed, ${secondSermonResult.pulled} pulled, ${secondSermonResult.conflicts} conflicts, ${secondSermonResult.errors.length} errors`);
      } else {
        console.log(`All ${dirtySermons.length} dirty sermons have series references, no second pass needed`);
      }
    } else {
      console.log('No dirty sermons found, skipping second sync pass');
    }
    
    const endTime = nowIso();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    
    totalErrors.push(...seriesStats.errors, ...sermonStats.errors);
    
    const result: SyncResult = {
      success: totalErrors.length === 0,
      startTime,
      endTime,
      duration,
      seriesStats,
      sermonStats,
      totalErrors
    };

    reportProgress({
      phase: 'complete',
      current: 1,
      total: 1,
      message: `Full sync completed: ${result.success ? 'SUCCESS' : 'WITH ERRORS'} - Duration: ${duration}ms`,
      timestamp: nowIso()
    });
    
    console.log('Full sync completed:', result);
    
    // Run debug check in development
    if (__DEV__) {
      try {
        const { runCompleteDebugCheck } = await import('./debug-sync-data');
        await runCompleteDebugCheck();
      } catch (debugError) {
        console.error('Debug check failed:', debugError);
      }
    }
    
    // Update sync status and save last sync time
    currentSyncStatus.syncInProgress = false;
    if (result.success) {
      await AsyncStorage.setItem('sync.lastSyncTime', endTime);
    }
    
    // Notify completion callback if set
    if (globalCompletionCallback) {
      try {
        globalCompletionCallback(result);
      } catch (callbackError) {
        console.error('Error in sync completion callback:', callbackError);
      }
    }
    
    return result;
  } catch (error) {
    const errorMsg = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    totalErrors.push(errorMsg);
    
    reportProgress({
      phase: 'error',
      current: 0,
      total: 0,
      message: errorMsg,
      timestamp: nowIso()
    });
    
    // Attempt to rollback any partial changes by marking dirty records for retry
    try {
      await rollbackPartialSync(userId);
    } catch (rollbackError) {
      const rollbackErrorMsg = `Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`;
      console.error(rollbackErrorMsg);
      totalErrors.push(rollbackErrorMsg);
    }
    
    const endTime = nowIso();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    
    const result: SyncResult = {
      success: false,
      startTime,
      endTime,
      duration,
      seriesStats,
      sermonStats,
      totalErrors
    };
    
    // Update sync status
    currentSyncStatus.syncInProgress = false;
    
    // Return the result instead of throwing to allow UI to handle the error gracefully
    return result;
  }
}

/**
 * Rollback mechanism for partial sync failures
 * Ensures data consistency by marking any records that may be in inconsistent state
 */
async function rollbackPartialSync(userId: string): Promise<void> {
  try {
    // Check for any records that might be in an inconsistent state
    // This includes records that were marked as clean but might not have been fully synced
    
    // Find series that were recently marked as clean but might need re-sync
    const recentlySyncedSeries = await queryAll<{ id: string }>(
      `SELECT id FROM series 
       WHERE user_id = ? 
       AND dirty = 0 
       AND synced_at > datetime('now', '-5 minutes')`,
      [userId]
    );
    
    // Find sermons that were recently marked as clean but might need re-sync
    const recentlySyncedSermons = await queryAll<{ id: string }>(
      `SELECT id FROM sermons 
       WHERE user_id = ? 
       AND dirty = 0 
       AND synced_at > datetime('now', '-5 minutes')`,
      [userId]
    );
    
    // Mark these records as dirty for re-sync if there were any recent changes
    if (recentlySyncedSeries.length > 0) {
      const seriesIds = recentlySyncedSeries.map(s => s.id);
      const placeholders = seriesIds.map(() => '?').join(',');
      await exec(
        `UPDATE series SET dirty = 1 WHERE id IN (${placeholders})`,
        seriesIds
      );
      console.log(`Marked ${seriesIds.length} series records as dirty for re-sync`);
    }
    
    if (recentlySyncedSermons.length > 0) {
      const sermonIds = recentlySyncedSermons.map(s => s.id);
      const placeholders = sermonIds.map(() => '?').join(',');
      await exec(
        `UPDATE sermons SET dirty = 1 WHERE id IN (${placeholders})`,
        sermonIds
      );
      console.log(`Marked ${sermonIds.length} sermon records as dirty for re-sync`);
    }
    
    console.log('Rollback completed - affected records marked for re-sync');
  } catch (error) {
    console.error('Failed to rollback partial sync:', error);
    throw error;
  }
}

export default { syncAll, syncSeries, syncSermons };
