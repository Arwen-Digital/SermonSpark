// Native (iOS/Android) repository for Sermons using SQLite.
import type { SermonRepository, SermonDTO, CreateSermonInput, UpdateSermonInput } from './types';
import { initDb, exec, queryAll, queryFirst } from '@/services/db';
import { getCurrentUserId } from '@/services/authSession';
import UUID from 'react-native-uuid';
import { syncSermons } from '@/services/sync/syncService';

// getCurrentUserId provided by authSession helper

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sermonRepository: SermonRepository = {
  async list(): Promise<SermonDTO[]> {
    await initDb();
    const userId = await getCurrentUserId();
    const rows = await queryAll<any>(
      `SELECT * FROM sermons WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
      [userId]
    );
    return rows.map(rowToDTO);
  },

  async get(id: string): Promise<SermonDTO> {
    await initDb();
    const userId = await getCurrentUserId();
    const row = await queryFirst<any>(
      `SELECT * FROM sermons WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
      [id, userId]
    );
    if (!row) throw new Error('Sermon not found');
    return rowToDTO(row);
  },

  async create(input: CreateSermonInput): Promise<SermonDTO> {
    await initDb();
    const userId = await getCurrentUserId();
    const id = UUID.v4() as string;
    const now = new Date().toISOString();

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

    return {
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
  },

  async update(id: string, input: UpdateSermonInput): Promise<SermonDTO> {
    await initDb();
    const userId = await getCurrentUserId();
    const now = new Date().toISOString();
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
    return this.get(id);
  },

  async remove(id: string): Promise<void> {
    await initDb();
    const userId = await getCurrentUserId();
    const now = new Date().toISOString();
    const res = await exec(
      `UPDATE sermons SET deleted_at = ?, dirty = 1, op = 'delete', version = version + 1 WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [now, id, userId]
    ) as any;
    if ((res?.changes ?? 0) === 0) throw new Error('Sermon not found or already deleted');
  },

  async sync(): Promise<void> {
    await initDb();
    await syncSermons();
  },
};

export default sermonRepository;
