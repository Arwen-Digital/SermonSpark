// Native (iOS/Android) repository for Series using SQLite.
import { getEffectiveUserId } from '@/services/authSession';
import { exec, initDb, queryAll, queryFirst } from '@/services/db/index.native';
import { syncSeries } from '@/services/sync/syncService';
import UUID from 'react-native-uuid';
import type {
  CreateSeriesInput,
  DataMigrationResult,
  SeriesDTO,
  SeriesRepository,
  SyncOperation,
  SyncResult,
  UpdateSeriesInput
} from './types';

// TODO: Integrate with Convex mutations
// The sync operations will be handled by Convex automatically when online
// Convex will queue mutations if offline and retry when connection is restored

const TAG = '[SeriesRepo]';

// Local user ID override for testing and migration scenarios
let userIdOverride: string | null = null;

function safeParseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

function rowToDTO(row: any): SeriesDTO {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    imageUrl: row.image_url ?? null,
    tags: safeParseJson(row.tags, []),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper function to get the effective user ID (supports anonymous users)
async function getRepositoryUserId(): Promise<string> {
  if (userIdOverride) return userIdOverride;
  return await getEffectiveUserId();
}

export const seriesRepository: SeriesRepository = {
  async list(): Promise<SeriesDTO[]> {
    await initDb();
    const userId = await getRepositoryUserId();
    console.log(`${TAG} Listing series for user:`, userId);
    const rows = await queryAll<any>(
      `SELECT * FROM series WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
      [userId]
    );
    console.log(`${TAG} Found ${rows.length} series records:`, rows);
    return rows.map(rowToDTO);
  },

  async get(id: string): Promise<SeriesDTO> {
    await initDb();
    const userId = await getRepositoryUserId();
    const row = await queryFirst<any>(
      `SELECT * FROM series WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
      [id, userId]
    );
    if (!row) throw new Error('Series not found');
    return rowToDTO(row);
  },

  async create(input: CreateSeriesInput): Promise<SeriesDTO> {
    await initDb();
    const userId = await getRepositoryUserId();
    const id = UUID.v4() as string;
    const now = new Date().toISOString();
    const tags = JSON.stringify(input.tags ?? []);

    console.log(`${TAG} Creating series for user:`, userId, 'with data:', input);

    // Local-first: Write to SQLite immediately for optimistic updates
    await exec(
      `INSERT INTO series (
        id, user_id, title, description, start_date, end_date, image_url, tags, status,
        created_at, updated_at, deleted_at, synced_at, dirty, op, version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 1, 'upsert', 0)`,
      [id, userId, input.title, input.description ?? null, input.startDate ?? null, input.endDate ?? null, input.imageUrl ?? null, tags, input.status ?? 'planning', now, now]
    );

    console.log(`${TAG} Series created with ID:`, id);

    // TODO: Sync to Convex
    // When user is authenticated with Clerk, sync to Convex backend
    // Example: await convex.mutation(api.series.create, { ...input, userId })
    // Convex will automatically queue this if offline
    
    // For now, the record is marked as dirty and will sync when sync() is called
    // Eventually this will trigger a Convex mutation

    return {
      id,
      userId,
      title: input.title,
      description: input.description ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      imageUrl: input.imageUrl ?? null,
      tags: input.tags ?? [],
      status: input.status ?? 'planning',
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(id: string, input: UpdateSeriesInput): Promise<SeriesDTO> {
    await initDb();
    const userId = await getRepositoryUserId();
    const now = new Date().toISOString();

    // Local-first: Update SQLite immediately for optimistic updates
    const sets: string[] = ['updated_at = ?', 'dirty = 1', `op = 'upsert'`, 'version = version + 1'];
    const params: any[] = [now];
    const apply = (column: string, value: any) => { if (value !== undefined) { sets.push(`${column} = ?`); params.push(value); } };
    apply('title', input.title);
    apply('description', input.description ?? null);
    apply('start_date', input.startDate ?? null);
    apply('end_date', input.endDate ?? null);
    apply('image_url', input.imageUrl ?? null);
    if (input.tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(input.tags)); }
    if (input.status !== undefined) { sets.push('status = ?'); params.push(input.status); }

    params.push(id, userId);
    const sql = `UPDATE series SET ${sets.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`;
    const result = await exec(sql, params) as any;
    if ((result?.changes ?? 0) === 0) throw new Error('Series not found or not updated');

    const updatedSeries = await this.get(id);

    // Queue for sync if user is authenticated (but don't block the operation)
    try {
      const syncOperation: SyncOperation<SeriesDTO> = {
        id: UUID.v4() as string,
        type: 'update',
        entityType: 'series',
        entityId: id,
        data: updatedSeries,
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
        { operation: 'update', entityType: 'series', entityId: id }
      );
      console.warn(`${TAG} Failed to queue sync operation for series update:`, errorResponse.technicalMessage);
      // Don't throw - local operation succeeded
    }

    return updatedSeries;
  },

  async remove(id: string): Promise<void> {
    await initDb();
    const userId = await getRepositoryUserId();
    const now = new Date().toISOString();
    
    // Get the series data before deletion for sync operation
    let seriesToDelete: SeriesDTO | null = null;
    try {
      seriesToDelete = await this.get(id);
    } catch {
      // Series not found
      throw new Error('Series not found or already deleted');
    }

    // Local-first: Update SQLite immediately for optimistic updates (soft delete)
    const res = await exec(
      `UPDATE series SET deleted_at = ?, dirty = 1, op = 'delete', version = version + 1 WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [now, id, userId]
    ) as any;
    if ((res?.changes ?? 0) === 0) throw new Error('Series not found or already deleted');

    // Queue for sync if user is authenticated (but don't block the operation)
    try {
      const syncOperation: SyncOperation<SeriesDTO> = {
        id: UUID.v4() as string,
        type: 'delete',
        entityType: 'series',
        entityId: id,
        data: seriesToDelete,
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
        { operation: 'delete', entityType: 'series', entityId: id }
      );
      console.warn(`${TAG} Failed to queue sync operation for series deletion:`, errorResponse.technicalMessage);
      // Don't throw - local operation succeeded
    }
  },

  async sync(): Promise<void> {
    await initDb();
    await syncSeries();
  },

  // Local-first repository methods
  setUserId(userId: string): void {
    userIdOverride = userId;
  },

  async queueForSync(operation: SyncOperation<SeriesDTO>): Promise<void> {
    // TODO: Replace with Convex mutation
    // Example: await convex.mutation(api.series.create, operation.data)
    // Convex handles offline queuing automatically
    
    console.log(`${TAG} Queuing sync operation (will use Convex):`, operation.type, operation.entityId);
    
    // For now, the dirty flag marks records for sync
    // The sync service will pick up dirty records when sync() is called
  },

  async syncWithRemote(): Promise<SyncResult> {
    try {
      await syncSeries();
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
      console.log(`${TAG} Migrating series data from ${fromUserId} to ${toUserId}`);

      // Get all series records for the anonymous user
      const anonymousRecords = await queryAll<any>(
        `SELECT * FROM series WHERE user_id = ? AND deleted_at IS NULL`,
        [fromUserId]
      );

      for (const record of anonymousRecords) {
        try {
          // Check if a series with the same ID already exists for the target user
          const existingRecord = await queryFirst<any>(
            `SELECT id FROM series WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
            [record.id, toUserId]
          );

          if (existingRecord) {
            // Conflict: series already exists for target user
            conflicts++;
            console.warn(`${TAG} Conflict: Series ${record.id} already exists for user ${toUserId}`);
            
            // For now, we'll keep the existing record and mark the anonymous one as migrated
            // In a more sophisticated implementation, we could offer merge options
            await exec(
              `UPDATE series SET user_id = ?, updated_at = ?, dirty = 1, op = 'upsert' WHERE id = ? AND user_id = ?`,
              [`${toUserId}_conflict_${Date.now()}`, new Date().toISOString(), record.id, fromUserId]
            );
          } else {
            // No conflict: migrate the record to the new user
            await exec(
              `UPDATE series SET user_id = ?, updated_at = ?, dirty = 1, op = 'upsert' WHERE id = ? AND user_id = ?`,
              [toUserId, new Date().toISOString(), record.id, fromUserId]
            );
            migratedRecords++;
          }
        } catch (error) {
          const errorMsg = `Failed to migrate series ${record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
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

export default seriesRepository;
