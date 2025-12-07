/**
 * Convex Sync Handler
 * Handles Clerk authentication checks and bidirectional sync with Convex
 */

import { getStoredAccessToken, useAuth } from '@/services/customAuth';
import { api } from '../../convex/_generated/api';
import type { DataConflict } from '../conflictResolution';
import { convexClient } from '../convexClient';
import { exec, queryAll } from '../db/index.native';

export interface SyncResult {
  success: boolean;
  seriesStats: { pushed: number; pulled: number; conflicts: number; errors: string[] };
  sermonStats: { pushed: number; pulled: number; conflicts: number; errors: string[] };
  conflicts: DataConflict[];
  startTime: string;
  endTime: string;
}

/**
 * Check if user is authenticated with Clerk
 * Note: This needs to be called from a component with useAuth hook
 * For service-level calls, we'll need to pass auth state
 */
export async function checkClerkAuth(): Promise<{ isAuthenticated: boolean; userId: string | null }> {
  // Since this is a service function, we can't use hooks here
  // The auth check needs to be done at the component level
  // For now, check if we have a cached Clerk user ID (not starting with 'anon_')
  const { getCachedUserId } = await import('../authSession');
  const cachedUserId = await getCachedUserId();

  if (cachedUserId && !cachedUserId.startsWith('anon_')) {
    return { isAuthenticated: true, userId: cachedUserId };
  }

  return { isAuthenticated: false, userId: null };
}

/**
 * Get Clerk auth from component context
 * This should be called from a component
 */
export function useClerkAuthCheck() {
  const { isSignedIn, user } = useAuth();
  return { isAuthenticated: isSignedIn ?? false, userId: user?.id ?? null };
}

/**
 * Push local changes to Convex
 * TODO: Implement after running npx convex dev to generate API types
 */
async function pushLocalChangesToConvex(): Promise<{
  pushed: number;
  errors: string[]
}> {
  let pushed = 0;
  const errors: string[] = [];

  try {
    const token = await getStoredAccessToken();
    if (!token) throw new Error("Not authenticated");

    // Ensure mapping table exists
    await exec(
      `CREATE TABLE IF NOT EXISTS convex_id_mapping (
        local_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        convex_id TEXT NOT NULL,
        synced_at TEXT NOT NULL,
        PRIMARY KEY(local_id, entity_type)
      )`
    );

    // Ensure profile exists remotely (Clerk user)
    const { getCachedUserId } = await import('../authSession');
    const userId = await getCachedUserId();
    if (userId) {
      try {
        await convexClient.query(api.profiles.getOrCreate, { token });
      } catch (e: any) {
        errors.push(`Profile ensure failed: ${e?.message || String(e)}`);
      }
    }

    // Helper mapping functions
    const getMap = async (localId: string, type: 'series' | 'sermon') => {
      const rows = await queryAll<{ convex_id: string }>(
        `SELECT convex_id FROM convex_id_mapping WHERE local_id = ? AND entity_type = ?`,
        [localId, type]
      );
      return rows.length ? rows[0].convex_id : null;
    };
    const saveMap = async (localId: string, convexId: string, type: 'series' | 'sermon') => {
      await exec(
        `INSERT OR REPLACE INTO convex_id_mapping (local_id, entity_type, convex_id, synced_at) VALUES (?, ?, ?, ?)`,
        [localId, type, convexId, new Date().toISOString()]
      );
    };

    // Push Series
    const dirtySeries = await queryAll<any>(
      `SELECT * FROM series WHERE dirty = 1 AND deleted_at IS NULL`
    );
    for (const s of dirtySeries) {
      try {
        const mapping = await getMap(s.id, 'series');
        const payload = {
          title: s.title,
          description: s.description || undefined,
          startDate: s.start_date || undefined,
          endDate: s.end_date || undefined,
          imageUrl: s.image_url || undefined,
          tags: s.tags ? JSON.parse(s.tags) : [],
          status: s.status as any,
        } as const;
        if (mapping) {
          try {
            await convexClient.mutation(api.series.update, {
              id: mapping as any,
              ...payload,
              token,
            });
          } catch (updateError: any) {
            // If update fails (not found), create new instead
            if (updateError?.message?.includes('not found') || updateError?.message?.includes('unauthorized')) {
              console.log(`Series ${mapping} not found, creating new`);
              const cid = await convexClient.mutation(api.series.create, { ...payload, token });
              await saveMap(s.id, cid as unknown as string, 'series');
            } else {
              throw updateError;
            }
          }
        } else {
          const cid = await convexClient.mutation(api.series.create, { ...payload, token });
          await saveMap(s.id, cid as unknown as string, 'series');
        }
        await exec(`UPDATE series SET dirty = 0, synced_at = ? WHERE id = ?`, [new Date().toISOString(), s.id]);
        pushed++;
      } catch (e: any) {
        errors.push(`Series ${s.id}: ${e?.message || String(e)}`);
      }
    }

    // Push Sermons
    const dirtySermons = await queryAll<any>(
      `SELECT * FROM sermons WHERE dirty = 1 AND deleted_at IS NULL`
    );
    for (const sm of dirtySermons) {
      try {
        const mapping = await getMap(sm.id, 'sermon');
        // Map series_id to Convex ID if available
        let remoteSeriesId: string | undefined = undefined;
        if (sm.series_id) {
          const mappedSeries = await queryAll<{ convex_id: string }>(
            `SELECT convex_id FROM convex_id_mapping WHERE local_id = ? AND entity_type = 'series'`,
            [sm.series_id]
          );
          if (mappedSeries.length > 0) remoteSeriesId = mappedSeries[0].convex_id;
        }
        const payload = {
          title: sm.title,
          content: sm.content || undefined,
          outline: sm.outline ? JSON.parse(sm.outline) : undefined,
          scripture: sm.scripture || undefined,
          tags: sm.tags ? JSON.parse(sm.tags) : [],
          status: sm.status as any,
          visibility: sm.visibility as any,
          date: sm.date || undefined,
          notes: sm.notes || undefined,
          seriesId: remoteSeriesId as any,
        } as const;
        if (mapping) {
          try {
            await convexClient.mutation(api.sermons.update, {
              id: mapping as any,
              ...payload,
              token,
            });
          } catch (updateError: any) {
            // If update fails (not found), create new instead
            const errorMsg = updateError?.message || updateError?.toString() || '';
            console.log(`Update failed, error:`, errorMsg);

            // Check for various "not found" patterns
            if (errorMsg.includes('not found') || errorMsg.includes('unauthorized') || errorMsg.includes('Sermon not found')) {
              console.log(`Sermon ${mapping} not found in Convex, creating new instead`);
              const cid = await convexClient.mutation(api.sermons.create, { ...payload, token });
              await saveMap(sm.id, cid as unknown as string, 'sermon');
              console.log(`Created new sermon with Convex ID: ${cid}`);
            } else {
              // Re-throw unknown errors
              console.error(`Unknown error during update:`, updateError);
              throw updateError;
            }
          }
        } else {
          const cid = await convexClient.mutation(api.sermons.create, { ...payload, token });
          await saveMap(sm.id, cid as unknown as string, 'sermon');
        }
        await exec(`UPDATE sermons SET dirty = 0, synced_at = ? WHERE id = ?`, [new Date().toISOString(), sm.id]);
        pushed++;
      } catch (e: any) {
        errors.push(`Sermon ${sm.id}: ${e?.message || String(e)}`);
      }
    }
  } catch (e: any) {
    errors.push(`Push fatal: ${e?.message || String(e)}`);
  }

  return { pushed, errors };
}

/**
 * Pull remote changes from Convex and detect/resolve conflicts
 * TODO: Implement after running npx convex dev to generate API types
 */
async function pullRemoteChangesFromConvex(): Promise<{
  pulled: number;
  conflicts: DataConflict[];
}> {
  let pulled = 0;
  const conflicts: DataConflict[] = [];

  try {
    const token = await getStoredAccessToken();
    if (!token) throw new Error("Not authenticated");

    // Helpers
    const nowIso = () => new Date().toISOString();
    const getMapByConvex = async (convexId: string, type: 'series' | 'sermon') => {
      const rows = await queryAll<{ local_id: string }>(
        `SELECT local_id FROM convex_id_mapping WHERE convex_id = ? AND entity_type = ?`,
        [convexId, type]
      );
      return rows.length ? rows[0].local_id : null;
    };
    const saveMap = async (localId: string, convexId: string, type: 'series' | 'sermon') => {
      await exec(
        `INSERT OR REPLACE INTO convex_id_mapping (local_id, entity_type, convex_id, synced_at) VALUES (?, ?, ?, ?)`,
        [localId, type, convexId, nowIso()]
      );
    };

    // Pull Series
    const remoteSeries: any[] = await convexClient.query(api.series.list, { token });
    for (const rs of remoteSeries) {
      const localId = await getMapByConvex(rs._id, 'series');
      if (localId) {
        const rows = await queryAll<any>(`SELECT * FROM series WHERE id = ?`, [localId]);
        const local = rows[0];
        if (!local) {
          // mapping exists but no local row; treat as new insert
          await exec(
            `INSERT OR REPLACE INTO series (id, user_id, title, description, start_date, end_date, image_url, tags, status, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'upsert', COALESCE(?, 0))`,
            [rs._id, rs.userId, rs.title, rs.description || null, rs.startDate || null, rs.endDate || null, rs.imageUrl || null, JSON.stringify(rs.tags || []), rs.status, rs.createdAt, rs.updatedAt, rs.deletedAt || null, nowIso(), 0]
          );
          await saveMap(rs._id, rs._id, 'series');
          pulled++;
        } else {
          const localTime = new Date(local.updated_at || local.created_at || 0).getTime();
          const remoteTime = new Date(rs.updatedAt || rs.createdAt || 0).getTime();
          if (remoteTime > localTime) {
            await exec(
              `UPDATE series SET title = ?, description = ?, start_date = ?, end_date = ?, image_url = ?, tags = ?, status = ?, updated_at = ?, synced_at = ?, dirty = 0 WHERE id = ?`,
              [rs.title, rs.description || null, rs.startDate || null, rs.endDate || null, rs.imageUrl || null, JSON.stringify(rs.tags || []), rs.status, rs.updatedAt, nowIso(), localId]
            );
            pulled++;
          }
        }
      } else {
        // New remote, insert locally and map
        await exec(
          `INSERT OR REPLACE INTO series (id, user_id, title, description, start_date, end_date, image_url, tags, status, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'upsert', 0)`,
          [rs._id, rs.userId, rs.title, rs.description || null, rs.startDate || null, rs.endDate || null, rs.imageUrl || null, JSON.stringify(rs.tags || []), rs.status, rs.createdAt, rs.updatedAt, rs.deletedAt || null, nowIso()]
        );
        await saveMap(rs._id, rs._id, 'series');
        pulled++;
      }
    }

    // Pull Sermons (after series so series mapping is ready)
    const remoteSermons: any[] = await convexClient.query(api.sermons.list, { token });
    for (const rm of remoteSermons) {
      const localId = await getMapByConvex(rm._id, 'sermon');
      if (localId) {
        const rows = await queryAll<any>(`SELECT * FROM sermons WHERE id = ?`, [localId]);
        const local = rows[0];
        if (!local) {
          await exec(
            `INSERT OR REPLACE INTO sermons (id, user_id, title, content, outline, scripture, tags, status, visibility, date, notes, series_id, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'upsert', 0)`,
            [rm._id, rm.userId, rm.title, rm.content || null, rm.outline ? JSON.stringify(rm.outline) : null, rm.scripture || null, JSON.stringify(rm.tags || []), rm.status, rm.visibility, rm.date || null, rm.notes || null, null, rm.createdAt, rm.updatedAt, rm.deletedAt || null, nowIso()]
          );
          await saveMap(rm._id, rm._id, 'sermon');
          pulled++;
        } else {
          const localTime = new Date(local.updated_at || local.created_at || 0).getTime();
          const remoteTime = new Date(rm.updatedAt || rm.createdAt || 0).getTime();
          if (remoteTime > localTime) {
            await exec(
              `UPDATE sermons SET title = ?, content = ?, outline = ?, scripture = ?, tags = ?, status = ?, visibility = ?, date = ?, notes = ?, updated_at = ?, synced_at = ?, dirty = 0 WHERE id = ?`,
              [rm.title, rm.content || null, rm.outline ? JSON.stringify(rm.outline) : null, rm.scripture || null, JSON.stringify(rm.tags || []), rm.status, rm.visibility, rm.date || null, rm.notes || null, rm.updatedAt, nowIso(), localId]
            );
            pulled++;
          }
        }
      } else {
        await exec(
          `INSERT OR REPLACE INTO sermons (id, user_id, title, content, outline, scripture, tags, status, visibility, date, notes, series_id, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'upsert', 0)`,
          [rm._id, rm.userId, rm.title, rm.content || null, rm.outline ? JSON.stringify(rm.outline) : null, rm.scripture || null, JSON.stringify(rm.tags || []), rm.status, rm.visibility, rm.date || null, rm.notes || null, null, rm.createdAt, rm.updatedAt, rm.deletedAt || null, nowIso()]
        );
        await saveMap(rm._id, rm._id, 'sermon');
        pulled++;
      }
    }
  } catch (e: any) {
    console.error('Pull fatal:', e);
  }

  return { pulled, conflicts };
}

/**
 * Perform bidirectional sync with Convex
 */
export async function syncToConvex(): Promise<SyncResult> {
  const startTime = new Date().toISOString();

  try {
    // Push local changes first
    const pushResult = await pushLocalChangesToConvex();

    // Then pull remote changes
    const pullResult = await pullRemoteChangesFromConvex();

    // Combine results
    const seriesConflicts = pullResult.conflicts.filter(c => c.type === 'series');
    const sermonConflicts = pullResult.conflicts.filter(c => c.type === 'sermon');

    const endTime = new Date().toISOString();

    return {
      success: true,
      seriesStats: {
        pushed: 0, // Will be filled from pushResult
        pulled: pullResult.pulled,
        conflicts: seriesConflicts.length,
        errors: [],
      },
      sermonStats: {
        pushed: pushResult.pushed,
        pulled: pullResult.pulled,
        conflicts: sermonConflicts.length,
        errors: pushResult.errors,
      },
      conflicts: pullResult.conflicts,
      startTime,
      endTime,
    };
  } catch (error: any) {
    const endTime = new Date().toISOString();
    return {
      success: false,
      seriesStats: { pushed: 0, pulled: 0, conflicts: 0, errors: [error.message] },
      sermonStats: { pushed: 0, pulled: 0, conflicts: 0, errors: [error.message] },
      conflicts: [],
      startTime,
      endTime,
    };
  }
}
