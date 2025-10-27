import { getCurrentUserId } from '../authSession';
import { exec, queryAll, queryFirst } from '../db/index.native';

const nowIso = () => new Date().toISOString();

export interface SyncProgress {
  phase: 'series_push' | 'series_pull' | 'sermons_push' | 'sermons_pull' | 'complete';
  current: number;
  total: number;
  message: string;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  seriesStats: {
    pushed: number;
    pulled: number;
    errors: string[];
  };
  sermonStats: {
    pushed: number;
    pulled: number;
    errors: string[];
  };
  totalErrors: string[];
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

let globalProgressCallback: SyncProgressCallback | null = null;

export function setSyncProgressCallback(callback: SyncProgressCallback | null): void {
  globalProgressCallback = callback;
}

function reportProgress(progress: SyncProgress): void {
  if (globalProgressCallback) {
    globalProgressCallback(progress);
  }
  console.log(`Sync: ${progress.phase} ${progress.current}/${progress.total} - ${progress.message}`);
}

// Simplified sync service for Convex
// Note: Most sync complexity is handled by Convex automatically (offline queues, retries, conflicts)
// This service just syncs dirty records and pulls updates

export async function syncAll(): Promise<SyncResult> {
  const startTime = nowIso();
  const errors: string[] = [];

  try {
    const userId = await getCurrentUserId();

    reportProgress({
      phase: 'series_push',
      current: 0,
      total: 1,
      message: 'Starting sync...',
      timestamp: nowIso(),
    });

    // TODO: Sync to Convex
    // For now, just update synced_at timestamps
    const seriesResult = await syncSeries();
    const sermonResult = await syncSermons();

    reportProgress({
      phase: 'complete',
      current: 1,
      total: 1,
      message: 'Sync complete',
      timestamp: nowIso(),
    });

    const endTime = nowIso();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    return {
      success: errors.length === 0,
      startTime,
      endTime,
      duration,
      seriesStats: {
        pushed: seriesResult.pushed,
        pulled: seriesResult.pulled,
        errors: seriesResult.errors,
      },
      sermonStats: {
        pushed: sermonResult.pushed,
        pulled: sermonResult.pulled,
        errors: sermonResult.errors,
      },
      totalErrors: errors,
    };
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      startTime,
      endTime: nowIso(),
      duration: 0,
      seriesStats: { pushed: 0, pulled: 0, errors: [String(error)] },
      sermonStats: { pushed: 0, pulled: 0, errors: [] },
      totalErrors: [String(error)],
    };
  }
}

export async function syncSeries(): Promise<{ pushed: number; pulled: number; errors: string[] }> {
  const errors: string[] = [];

  try {
    const userId = await getCurrentUserId();

    // Get dirty records
    const dirtyRecords = await queryAll<any>(
      `SELECT * FROM series WHERE user_id = ? AND dirty = 1 AND deleted_at IS NULL`,
      [userId]
    );

    let pushed = 0;

    // Mark as synced (actual sync to Convex will be handled by repository layer)
    for (const record of dirtyRecords) {
      try {
        await exec(
          `UPDATE series SET dirty = 0, synced_at = ? WHERE id = ?`,
          [nowIso(), record.id]
        );
        pushed++;
      } catch (error) {
        errors.push(`Failed to sync series ${record.id}: ${error}`);
      }
    }

    reportProgress({
      phase: 'series_push',
      current: pushed,
      total: dirtyRecords.length,
      message: `Synced ${pushed} series`,
      timestamp: nowIso(),
    });

    return { pushed, pulled: 0, errors };
  } catch (error) {
    console.error('Series sync failed:', error);
    return { pushed: 0, pulled: 0, errors: [String(error)] };
  }
}

export async function syncSermons(): Promise<{ pushed: number; pulled: number; errors: string[] }> {
  const errors: string[] = [];

  try {
    const userId = await getCurrentUserId();

    // Get dirty records
    const dirtyRecords = await queryAll<any>(
      `SELECT * FROM sermons WHERE user_id = ? AND dirty = 1 AND deleted_at IS NULL`,
      [userId]
    );

    let pushed = 0;

    // Mark as synced (actual sync to Convex will be handled by repository layer)
    for (const record of dirtyRecords) {
      try {
        await exec(
          `UPDATE sermons SET dirty = 0, synced_at = ? WHERE id = ?`,
          [nowIso(), record.id]
        );
        pushed++;
      } catch (error) {
        errors.push(`Failed to sync sermon ${record.id}: ${error}`);
      }
    }

    reportProgress({
      phase: 'sermons_push',
      current: pushed,
      total: dirtyRecords.length,
      message: `Synced ${pushed} sermons`,
      timestamp: nowIso(),
    });

    return { pushed, pulled: 0, errors };
  } catch (error) {
    console.error('Sermon sync failed:', error);
    return { pushed: 0, pulled: 0, errors: [String(error)] };
  }
}

