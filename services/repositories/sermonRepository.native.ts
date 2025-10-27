// Native (iOS/Android) repository for Sermons using SQLite.
import { getCurrentUserId, getEffectiveUserId } from '@/services/authSession';
import { exec, initDb, queryAll, queryFirst } from '@/services/db/index.native';
import { syncSermons } from '@/services/sync/syncService';
import UUID from 'react-native-uuid';
import type { 
  CreateSermonInput, 
  SermonDTO, 
  SermonRepository, 
  UpdateSermonInput,
  SyncOperation,
  SyncResult,
  DataMigrationResult
} from './types';

const TAG = '[SermonRepo]';

// Local user ID override for testing and migration scenarios
let userIdOverride: string | null = null;

function safeParseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

function rowToDTO(row: any): SermonDTO {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content ?? null,
    outline: safeParseJson(row.outline, null),
    scripture: row.scripture ?? null,
    tags: safeParseJson(row.tags, []),
    status: row.status,
    visibility: row.visibility,
    date: row.date ?? null,
    notes: row.notes ?? null,
    seriesId: row.series_id ?? null,
    seriesTitle: row.series_title ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper function to get the effective user ID (supports anonymous users)
async function getRepositoryUserId(): Promise<string> {
  if (userIdOverride) return userIdOverride;
  return await getEffectiveUserId();
}

export const sermonRepository: SermonRepository = {
  async list(): Promise<SermonDTO[]> {
    await initDb();
    const userId = await getRepositoryUserId();
    const rows = await queryAll<any>(
      `SELECT s.*, sr.title as series_title
       FROM sermons s
       LEFT JOIN series sr ON sr.id = s.series_id AND sr.deleted_at IS NULL
       WHERE s.user_id = ? AND s.deleted_at IS NULL
       ORDER BY s.updated_at DESC`,
      [userId]
    );
    return rows.map(rowToDTO);
  },

  async get(id: string): Promise<SermonDTO> {
    await initDb();
    const userId = await getRepositoryUserId();
    const row = await queryFirst<any>(
      `SELECT s.*, sr.title as series_title
       FROM sermons s
       LEFT JOIN series sr ON sr.id = s.series_id AND sr.deleted_at IS NULL
       WHERE s.id = ? AND s.user_id = ? AND s.deleted_at IS NULL
       LIMIT 1`,
      [id, userId]
    );
    if (!row) throw new Error('Sermon not found');
    return rowToDTO(row);
  },

  async create(input: CreateSermonInput): Promise<SermonDTO> {
    await initDb();
    const userId = await getRepositoryUserId();
    const id = UUID.v4() as string;
    const now = new Date().toISOString();

    // Local-first: Write to SQLite immediately for optimistic updates
    await exec(
      `INSERT INTO sermons (
        id, user_id, title, content, outline, scripture, tags, status, visibility, date, notes, series_id,
        created_at, updated_at, deleted_at, synced_at, dirty, op, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 1, 'upsert', 0)`,
      [
        id,
        userId,
        input.title,
        input.content ?? null,
        input.outline != null ? JSON.stringify(input.outline) : null,
        input.scripture ?? null,
        JSON.stringify(input.tags ?? []),
        input.status ?? 'draft',
        input.visibility ?? 'private',
        input.date ?? null,
        input.notes ?? null,
        input.seriesId ?? null,
        now,
        now,
      ]
    );

    const newSermon: SermonDTO = {
      id,
      userId,
      title: input.title,
      content: input.content ?? null,
      outline: input.outline ?? null,
      scripture: input.scripture ?? null,
      tags: input.tags ?? [],
      status: input.status ?? 'draft',
      visibility: input.visibility ?? 'private',
      date: input.date ?? null,
      notes: input.notes ?? null,
      seriesId: input.seriesId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    // Queue for sync if user is authenticated (but don't block the operation)
    try {
      const syncOperation: SyncOperation<SermonDTO> = {
        id: UUID.v4() as string,
        type: 'create',
        entityType: 'sermon',
        entityId: id,
        data: newSermon,
        userId,
        timestamp: now,
        status: 'pending',
        retryCount: 0,
      };
      await this.queueForSync?.(syncOperation);
    } catch (error) {
      const { handleError } = await import('../errorHandler');
      const errorResponse = handleError(
        error instanceof Error ? error : new Error('Failed to queue sync operation'), 
        'sync', 
        { operation: 'create', entityType: 'sermon', entityId: sermon.id }
      );
      console.warn(`${TAG} Failed to queue sync operation for sermon creation:`, errorResponse.technicalMessage);
      // Don't throw - local operation succeeded
    }

    return newSermon;
  },

  async update(id: string, input: UpdateSermonInput): Promise<SermonDTO> {
    await initDb();
    const userId = await getRepositoryUserId();
    const now = new Date().toISOString();
    
    // Local-first: Update SQLite immediately for optimistic updates
    const sets: string[] = ['updated_at = ?', 'dirty = 1', `op = 'upsert'`, 'version = version + 1'];
    const params: any[] = [now];

    const apply = (column: string, value: any) => { if (value !== undefined) { sets.push(`${column} = ?`); params.push(value); } };
    apply('title', input.title);
    apply('content', input.content ?? null);
    if (input.outline !== undefined) { sets.push('outline = ?'); params.push(input.outline != null ? JSON.stringify(input.outline) : null); }
    apply('scripture', input.scripture ?? null);
    if (input.tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(input.tags)); }
    if (input.status !== undefined) { sets.push('status = ?'); params.push(input.status); }
    if (input.visibility !== undefined) { sets.push('visibility = ?'); params.push(input.visibility); }
    apply('date', input.date ?? null);
    apply('notes', input.notes ?? null);
    if (input.seriesId !== undefined) { sets.push('series_id = ?'); params.push(input.seriesId ?? null); }

    params.push(id, userId);
    const sql = `UPDATE sermons SET ${sets.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`;
    const res = await exec(sql, params) as any;
    if ((res?.changes ?? 0) === 0) throw new Error('Sermon not found or not updated');
    
    const updatedSermon = await this.get(id);

    // Queue for sync if user is authenticated (but don't block the operation)
    try {
      const syncOperation: SyncOperation<SermonDTO> = {
        id: UUID.v4() as string,
        type: 'update',
        entityType: 'sermon',
        entityId: id,
        data: updatedSermon,
        userId,
        timestamp: now,
        status: 'pending',
        retryCount: 0,
      };
      await this.queueForSync?.(syncOperation);
    } catch (error) {
      const { handleError } = await import('../errorHandler');
      const errorResponse = handleError(
        error instanceof Error ? error : new Error('Failed to queue sync operation'), 
        'sync', 
        { operation: 'update', entityType: 'sermon', entityId: id }
      );
      console.warn(`${TAG} Failed to queue sync operation for sermon update:`, errorResponse.technicalMessage);
      // Don't throw - local operation succeeded
    }

    return updatedSermon;
  },

  async remove(id: string): Promise<void> {
    await initDb();
    const userId = await getRepositoryUserId();
    const now = new Date().toISOString();
    
    // Get the sermon data before deletion for sync operation
    let sermonToDelete: SermonDTO | null = null;
    try {
      sermonToDelete = await this.get(id);
    } catch (error) {
      // Sermon not found
      throw new Error('Sermon not found or already deleted');
    }

    // Local-first: Update SQLite immediately for optimistic updates (soft delete)
    const res = await exec(
      `UPDATE sermons SET deleted_at = ?, dirty = 1, op = 'delete', version = version + 1 WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [now, id, userId]
    ) as any;
    if ((res?.changes ?? 0) === 0) throw new Error('Sermon not found or already deleted');

    // Queue for sync if user is authenticated (but don't block the operation)
    try {
      const syncOperation: SyncOperation<SermonDTO> = {
        id: UUID.v4() as string,
        type: 'delete',
        entityType: 'sermon',
        entityId: id,
        data: sermonToDelete,
        userId,
        timestamp: now,
        status: 'pending',
        retryCount: 0,
      };
      await this.queueForSync?.(syncOperation);
    } catch (error) {
      const { handleError } = await import('../errorHandler');
      const errorResponse = handleError(
        error instanceof Error ? error : new Error('Failed to queue sync operation'), 
        'sync', 
        { operation: 'delete', entityType: 'sermon', entityId: id }
      );
      console.warn(`${TAG} Failed to queue sync operation for sermon deletion:`, errorResponse.technicalMessage);
      // Don't throw - local operation succeeded
    }
  },

  async sync(): Promise<void> {
    await initDb();
    await syncSermons();
  },

  // Local-first repository methods
  setUserId(userId: string): void {
    userIdOverride = userId;
  },

  async queueForSync(operation: SyncOperation<SermonDTO>): Promise<void> {
    // For now, we'll use the existing sync mechanism
    // In a more advanced implementation, this could queue operations in a separate table
    console.log(`${TAG} Queuing sync operation:`, operation.type, operation.entityId);
    
    // The existing dirty flag mechanism already handles this
    // The sync service will pick up dirty records when sync() is called
  },

  async syncWithRemote(): Promise<SyncResult> {
    try {
      await syncSermons();
      return {
        success: true,
        operationsProcessed: 0, // Would need to track this in a more advanced implementation
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        operationsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      };
    }
  },

  async migrateToUser(fromUserId: string, toUserId: string): Promise<DataMigrationResult> {
    await initDb();
    let migratedRecords = 0;
    let conflicts = 0;
    const errors: string[] = [];

    try {
      console.log(`${TAG} Migrating sermon data from ${fromUserId} to ${toUserId}`);

      // Get all sermon records for the anonymous user
      const anonymousRecords = await queryAll<any>(
        `SELECT * FROM sermons WHERE user_id = ? AND deleted_at IS NULL`,
        [fromUserId]
      );

      for (const record of anonymousRecords) {
        try {
          // Check if a sermon with the same ID already exists for the target user
          const existingRecord = await queryFirst<any>(
            `SELECT id FROM sermons WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
            [record.id, toUserId]
          );

          if (existingRecord) {
            // Conflict: sermon already exists for target user
            conflicts++;
            console.warn(`${TAG} Conflict: Sermon ${record.id} already exists for user ${toUserId}`);
            
            // For now, we'll keep the existing record and mark the anonymous one as migrated with a new ID
            // In a more sophisticated implementation, we could offer merge options
            const newId = UUID.v4() as string;
            await exec(
              `UPDATE sermons SET id = ?, user_id = ?, updated_at = ?, dirty = 1, op = 'upsert' WHERE id = ? AND user_id = ?`,
              [newId, toUserId, new Date().toISOString(), record.id, fromUserId]
            );
          } else {
            // No conflict: migrate the record to the new user
            await exec(
              `UPDATE sermons SET user_id = ?, updated_at = ?, dirty = 1, op = 'upsert' WHERE id = ? AND user_id = ?`,
              [toUserId, new Date().toISOString(), record.id, fromUserId]
            );
            migratedRecords++;
          }
        } catch (error) {
          const errorMsg = `Failed to migrate sermon ${record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`${TAG} ${errorMsg}`);
        }
      }

      console.log(`${TAG} Migration completed: ${migratedRecords} migrated, ${conflicts} conflicts, ${errors.length} errors`);

      return {
        success: errors.length === 0,
        migratedRecords,
        conflicts,
        errors,
      };
    } catch (error) {
      const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`${TAG} ${errorMsg}`);
      
      return {
        success: false,
        migratedRecords,
        conflicts,
        errors,
      };
    }
  },
};

export default sermonRepository;
