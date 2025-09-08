// Native (iOS/Android) repository for Series using SQLite.
import type { SeriesRepository, SeriesDTO, CreateSeriesInput, UpdateSeriesInput } from './types';
import { initDb, exec, queryAll, queryFirst } from '@/services/db';
import { getCurrentUserId } from '@/services/authSession';
import UUID from 'react-native-uuid';
import { syncSeries } from '@/services/sync/syncService';

const TAG = '[SeriesRepo]';

// getCurrentUserId is now provided by authSession helper

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

export const seriesRepository: SeriesRepository = {
  async list(): Promise<SeriesDTO[]> {
    await initDb();
    const userId = await getCurrentUserId();
    const rows = await queryAll<any>(
      `SELECT * FROM series WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
      [userId]
    );
    return rows.map(rowToDTO);
  },

  async get(id: string): Promise<SeriesDTO> {
    await initDb();
    const userId = await getCurrentUserId();
    const row = await queryFirst<any>(
      `SELECT * FROM series WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
      [id, userId]
    );
    if (!row) throw new Error('Series not found');
    return rowToDTO(row);
  },

  async create(input: CreateSeriesInput): Promise<SeriesDTO> {
    await initDb();
    const userId = await getCurrentUserId();
    const id = UUID.v4() as string;
    const now = new Date().toISOString();
    const tags = JSON.stringify(input.tags ?? []);

    await exec(
      `INSERT INTO series (
        id, user_id, title, description, start_date, end_date, image_url, tags, status,
        created_at, updated_at, deleted_at, synced_at, dirty, op, version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 1, 'upsert', 0)`,
      [id, userId, input.title, input.description ?? null, input.startDate ?? null, input.endDate ?? null, input.imageUrl ?? null, tags, input.status ?? 'planning', now, now]
    );

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
    const userId = await getCurrentUserId();
    const now = new Date().toISOString();

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

    return this.get(id);
  },

  async remove(id: string): Promise<void> {
    await initDb();
    const userId = await getCurrentUserId();
    const now = new Date().toISOString();
    const res = await exec(
      `UPDATE series SET deleted_at = ?, dirty = 1, op = 'delete', version = version + 1 WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [now, id, userId]
    ) as any;
    if ((res?.changes ?? 0) === 0) throw new Error('Series not found or already deleted');
  },

  async sync(): Promise<void> {
    await initDb();
    await syncSeries();
  },
};

export default seriesRepository;
