/**
 * Sync service exports
 * Simplified for Convex backend
 */

export {
    setSyncProgressCallback, syncAll,
    syncSeries,
    syncSermons
} from './syncService';

export type {
    SyncProgress, SyncProgressCallback, SyncResult
} from './syncService';
