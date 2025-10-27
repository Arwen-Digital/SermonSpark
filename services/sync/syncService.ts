/**
 * Platform-specific sync service exports
 * Note: Web sync service removed as part of Convex migration
 */

// For now, only export native sync service
// TODO: Add Convex integration when online
export {
    setSyncProgressCallback, syncAll,
    syncSeries,
    syncSermons
} from './syncService.native';

export type {
    SyncProgress, SyncProgressCallback, SyncResult
} from './syncService.native';
