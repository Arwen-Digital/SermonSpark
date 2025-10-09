import { httpClient } from '../httpClient';
import { getCurrentUserId } from '../authSession';
import { DataTransformer, APISeriesRecord, APISermonRecord } from './dataTransformer';

// Web implementation uses localStorage instead of AsyncStorage
const LP_KEYS = {
  series: (userId: string) => `offline.lastPulledAt.series:${userId}`,
  sermons: (userId: string) => `offline.lastPulledAt.sermons:${userId}`,
  syncState: (userId: string) => `sync.state:${userId}`,
};

const nowIso = () => new Date().toISOString();

// Web-specific sync state management (stored in localStorage)
interface WebSyncState {
  lastSyncAt: string | null;
  pendingOperations: {
    series: PendingOperation[];
    sermons: PendingOperation[];
  };
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: string;
  retryCount: number;
}

// Web sync state management
class WebSyncStateManager {
  private userId: string | null = null;

  async initialize(): Promise<void> {
    this.userId = await getCurrentUserId();
  }

  private getStateKey(): string {
    if (!this.userId) throw new Error('User ID not initialized');
    return LP_KEYS.syncState(this.userId);
  }

  getSyncState(): WebSyncState {
    try {
      const stored = localStorage.getItem(this.getStateKey());
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse sync state:', error);
    }
    
    return {
      lastSyncAt: null,
      pendingOperations: {
        series: [],
        sermons: []
      }
    };
  }

  setSyncState(state: WebSyncState): void {
    try {
      localStorage.setItem(this.getStateKey(), JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save sync state:', error);
    }
  }

  addPendingOperation(entity: 'series' | 'sermons', operation: PendingOperation): void {
    const state = this.getSyncState();
    state.pendingOperations[entity].push(operation);
    this.setSyncState(state);
  }

  removePendingOperation(entity: 'series' | 'sermons', operationId: string): void {
    const state = this.getSyncState();
    state.pendingOperations[entity] = state.pendingOperations[entity].filter(op => op.id !== operationId);
    this.setSyncState(state);
  }

  updateLastSyncTime(): void {
    const state = this.getSyncState();
    state.lastSyncAt = nowIso();
    this.setSyncState(state);
  }

  getLastPulledTime(entity: 'series' | 'sermons'): string | null {
    if (!this.userId) return null;
    const key = entity === 'series' ? LP_KEYS.series(this.userId) : LP_KEYS.sermons(this.userId);
    return localStorage.getItem(key);
  }

  setLastPulledTime(entity: 'series' | 'sermons', timestamp: string): void {
    if (!this.userId) return;
    const key = entity === 'series' ? LP_KEYS.series(this.userId) : LP_KEYS.sermons(this.userId);
    localStorage.setItem(key, timestamp);
  }
}

const syncStateManager = new WebSyncStateManager();

// Progress tracking types (same as native)
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

// Progress callback type
export type SyncProgressCallback = (progress: SyncProgress) => void;

// Global progress callback
let globalProgressCallback: SyncProgressCallback | null = null;

export function setSyncProgressCallback(callback: SyncProgressCallback | null): void {
  globalProgressCallback = callback;
}

function reportProgress(progress: SyncProgress): void {
  if (globalProgressCallback) {
    globalProgressCallback(progress);
  }
  console.log(`Web Sync Progress: ${progress.phase} - ${progress.current}/${progress.total} - ${progress.message}`);
}

export async function syncAll(): Promise<SyncResult> {
  const startTime = nowIso();
  let totalErrors: string[] = [];
  
  try {
    await syncStateManager.initialize();
    
    reportProgress({
      phase: 'series_push',
      current: 0,
      total: 0,
      message: 'Starting web sync process',
      timestamp: nowIso()
    });

    // Sync series first to maintain referential integrity
    const seriesResult = await syncSeries();
    totalErrors.push(...seriesResult.errors);

    // Then sync sermons
    const sermonResult = await syncSermons();
    totalErrors.push(...sermonResult.errors);

    // Update last sync timestamp
    syncStateManager.updateLastSyncTime();

    reportProgress({
      phase: 'complete',
      current: 1,
      total: 1,
      message: 'Web sync completed successfully',
      timestamp: nowIso()
    });

    const endTime = nowIso();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    return {
      success: totalErrors.length === 0,
      startTime,
      endTime,
      duration,
      seriesStats: seriesResult,
      sermonStats: sermonResult,
      totalErrors
    };
  } catch (error) {
    const errorMsg = `Web sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    totalErrors.push(errorMsg);
    
    reportProgress({
      phase: 'error',
      current: 0,
      total: 0,
      message: errorMsg,
      timestamp: nowIso()
    });

    const endTime = nowIso();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    return {
      success: false,
      startTime,
      endTime,
      duration,
      seriesStats: {
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: [errorMsg]
      },
      sermonStats: {
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: [errorMsg]
      },
      totalErrors
    };
  }
}

export async function syncSeries(): Promise<{ pushed: number; pulled: number; conflicts: number; errors: string[] }> {
  let pushed = 0;
  let pulled = 0;
  let conflicts = 0;
  const errors: string[] = [];

  try {
    await syncStateManager.initialize();
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    reportProgress({
      phase: 'series_push',
      current: 0,
      total: 0,
      message: 'Processing pending series operations',
      timestamp: nowIso()
    });

    // Process pending operations (push)
    const syncState = syncStateManager.getSyncState();
    const pendingOps = syncState.pendingOperations.series;
    
    for (let i = 0; i < pendingOps.length; i++) {
      const operation = pendingOps[i];
      
      try {
        reportProgress({
          phase: 'series_push',
          current: i + 1,
          total: pendingOps.length,
          message: `Processing ${operation.type} operation for series ${operation.id}`,
          timestamp: nowIso()
        });

        switch (operation.type) {
          case 'create':
            await httpClient.post<APISeriesRecord>('/api/series', operation.data);
            break;
          case 'update':
            await httpClient.put<APISeriesRecord>(`/api/series/${operation.id}`, operation.data);
            break;
          case 'delete':
            await httpClient.delete(`/api/series/${operation.id}`);
            break;
        }

        // Remove successful operation
        syncStateManager.removePendingOperation('series', operation.id);
        pushed++;
      } catch (error) {
        const errorMsg = `Failed to ${operation.type} series ${operation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        
        // Increment retry count
        operation.retryCount++;
        if (operation.retryCount >= 3) {
          // Remove after max retries
          syncStateManager.removePendingOperation('series', operation.id);
          console.error(`Removing series operation ${operation.id} after ${operation.retryCount} retries`);
        }
      }
    }

    // Pull latest data from server
    reportProgress({
      phase: 'series_pull',
      current: 0,
      total: 0,
      message: 'Fetching latest series from server',
      timestamp: nowIso()
    });

    const since = syncStateManager.getLastPulledTime('series');
    const params: Record<string, any> = {
      include_deleted: true
    };
    if (since) {
      params.updated_at = since;
    }

    // Fetch series with pagination
    let allSeries: APISeriesRecord[] = [];
    let page = 1;
    const limit = 100;

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
        message: `Fetched ${allSeries.length} series records`,
        timestamp: nowIso()
      });

      if (!response.pagination?.hasMore || series.length < limit) {
        break;
      }
      page++;
    }

    // For web, we don't store locally - just count as pulled
    pulled = allSeries.length;

    // Update last pulled timestamp
    syncStateManager.setLastPulledTime('series', nowIso());

    reportProgress({
      phase: 'series_pull',
      current: allSeries.length,
      total: allSeries.length,
      message: `Series sync completed: ${pushed} pushed, ${pulled} pulled`,
      timestamp: nowIso()
    });

    return { pushed, pulled, conflicts, errors };
  } catch (error) {
    const errorMsg = `Series sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    console.error('Series sync error:', error);
    return { pushed, pulled, conflicts, errors };
  }
}

export async function syncSermons(): Promise<{ pushed: number; pulled: number; conflicts: number; errors: string[] }> {
  let pushed = 0;
  let pulled = 0;
  let conflicts = 0;
  const errors: string[] = [];

  try {
    await syncStateManager.initialize();
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    reportProgress({
      phase: 'sermons_push',
      current: 0,
      total: 0,
      message: 'Processing pending sermon operations',
      timestamp: nowIso()
    });

    // Process pending operations (push)
    const syncState = syncStateManager.getSyncState();
    const pendingOps = syncState.pendingOperations.sermons;
    
    for (let i = 0; i < pendingOps.length; i++) {
      const operation = pendingOps[i];
      
      try {
        reportProgress({
          phase: 'sermons_push',
          current: i + 1,
          total: pendingOps.length,
          message: `Processing ${operation.type} operation for sermon ${operation.id}`,
          timestamp: nowIso()
        });

        // Validate data before sending
        if (operation.data && (operation.type === 'create' || operation.type === 'update')) {
          const validationErrors = DataTransformer.validateSermonForApi(operation.data);
          if (validationErrors.length > 0) {
            const errorMsg = `Validation failed for sermon ${operation.id}: ${validationErrors.join(', ')}`;
            errors.push(errorMsg);
            syncStateManager.removePendingOperation('sermons', operation.id);
            continue;
          }
        }

        switch (operation.type) {
          case 'create':
            await httpClient.post<APISermonRecord>('/api/sermons', operation.data);
            break;
          case 'update':
            await httpClient.put<APISermonRecord>(`/api/sermons/${operation.id}`, operation.data);
            break;
          case 'delete':
            await httpClient.delete(`/api/sermons/${operation.id}`);
            break;
        }

        // Remove successful operation
        syncStateManager.removePendingOperation('sermons', operation.id);
        pushed++;
      } catch (error) {
        const errorMsg = `Failed to ${operation.type} sermon ${operation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        
        // Increment retry count
        operation.retryCount++;
        if (operation.retryCount >= 3) {
          // Remove after max retries
          syncStateManager.removePendingOperation('sermons', operation.id);
          console.error(`Removing sermon operation ${operation.id} after ${operation.retryCount} retries`);
        }
      }
    }

    // Pull latest data from server
    reportProgress({
      phase: 'sermons_pull',
      current: 0,
      total: 0,
      message: 'Fetching latest sermons from server',
      timestamp: nowIso()
    });

    const since = syncStateManager.getLastPulledTime('sermons');
    const params: Record<string, any> = {
      include_deleted: true
    };
    if (since) {
      params.updated_at = since;
    }

    // Fetch sermons with pagination
    let allSermons: APISermonRecord[] = [];
    let page = 1;
    const limit = 100;

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
        message: `Fetched ${allSermons.length} sermon records`,
        timestamp: nowIso()
      });

      if (!response.pagination || page >= response.pagination.totalPages || sermons.length < limit) {
        break;
      }
      page++;
    }

    // For web, we don't store locally - just count as pulled
    pulled = allSermons.length;

    // Update last pulled timestamp
    syncStateManager.setLastPulledTime('sermons', nowIso());

    reportProgress({
      phase: 'sermons_pull',
      current: allSermons.length,
      total: allSermons.length,
      message: `Sermon sync completed: ${pushed} pushed, ${pulled} pulled`,
      timestamp: nowIso()
    });

    return { pushed, pulled, conflicts, errors };
  } catch (error) {
    const errorMsg = `Sermon sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    console.error('Sermon sync error:', error);
    return { pushed, pulled, conflicts, errors };
  }
}

// Web-specific helper functions for managing sync operations

/**
 * Queue a series operation for sync
 */
export async function queueSeriesOperation(
  id: string,
  type: 'create' | 'update' | 'delete',
  data?: any
): Promise<void> {
  try {
    await syncStateManager.initialize();
    
    const operation: PendingOperation = {
      id,
      type,
      data,
      timestamp: nowIso(),
      retryCount: 0
    };
    
    syncStateManager.addPendingOperation('series', operation);
    console.log(`Queued series ${type} operation for ${id}`);
  } catch (error) {
    console.error(`Failed to queue series operation:`, error);
  }
}

/**
 * Queue a sermon operation for sync
 */
export async function queueSermonOperation(
  id: string,
  type: 'create' | 'update' | 'delete',
  data?: any
): Promise<void> {
  try {
    await syncStateManager.initialize();
    
    const operation: PendingOperation = {
      id,
      type,
      data,
      timestamp: nowIso(),
      retryCount: 0
    };
    
    syncStateManager.addPendingOperation('sermons', operation);
    console.log(`Queued sermon ${type} operation for ${id}`);
  } catch (error) {
    console.error(`Failed to queue sermon operation:`, error);
  }
}

/**
 * Get sync status for web platform
 */
export async function getSyncStatus(): Promise<{
  lastSyncAt: string | null;
  pendingOperations: {
    series: number;
    sermons: number;
  };
  isOnline: boolean;
}> {
  try {
    await syncStateManager.initialize();
    const state = syncStateManager.getSyncState();
    
    return {
      lastSyncAt: state.lastSyncAt,
      pendingOperations: {
        series: state.pendingOperations.series.length,
        sermons: state.pendingOperations.sermons.length
      },
      isOnline: navigator.onLine
    };
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return {
      lastSyncAt: null,
      pendingOperations: { series: 0, sermons: 0 },
      isOnline: navigator.onLine
    };
  }
}

/**
 * Clear all pending operations (useful for debugging or reset)
 */
export async function clearPendingOperations(): Promise<void> {
  try {
    await syncStateManager.initialize();
    const state = syncStateManager.getSyncState();
    state.pendingOperations = { series: [], sermons: [] };
    syncStateManager.setSyncState(state);
    console.log('Cleared all pending sync operations');
  } catch (error) {
    console.error('Failed to clear pending operations:', error);
  }
}

/**
 * Force a full sync (ignores last pulled timestamps)
 */
export async function forceFullSync(): Promise<SyncResult> {
  try {
    await syncStateManager.initialize();
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Clear last pulled timestamps to force full sync
    syncStateManager.setLastPulledTime('series', '');
    syncStateManager.setLastPulledTime('sermons', '');
    
    console.log('Starting forced full sync');
    return await syncAll();
  } catch (error) {
    console.error('Force full sync failed:', error);
    throw error;
  }
}

/**
 * Web-specific network status monitoring
 */
export function setupNetworkMonitoring(): (() => void) | void {
  if (typeof window !== 'undefined') {
    const handleOnline = () => {
      console.log('Network came online, triggering sync');
      // Auto-sync when coming back online
      syncAll().catch(error => {
        console.error('Auto-sync on network recovery failed:', error);
      });
    };

    const handleOffline = () => {
      console.log('Network went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

export default { 
  syncAll, 
  syncSeries, 
  syncSermons,
  queueSeriesOperation,
  queueSermonOperation,
  getSyncStatus,
  clearPendingOperations,
  forceFullSync,
  setupNetworkMonitoring
};

