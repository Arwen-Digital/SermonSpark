import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabaseClient';
import { getCurrentUserId } from '@/services/authSession';
import { exec, queryAll, queryFirst } from '@/services/db';

const LP_KEYS = {
  series: (userId: string) => `offline.lastPulledAt.series:${userId}`,
  sermons: (userId: string) => `offline.lastPulledAt.sermons:${userId}`,
};

const nowIso = () => new Date().toISOString();

function parseJson<T>(s: any, fallback: T): T { try { return s ? JSON.parse(s) : fallback; } catch { return fallback; } }

async function pushSeries(userId: string) {
  const rows = await queryAll<any>(
    `SELECT * FROM series WHERE user_id = ? AND dirty = 1`,
    [userId]
  );
  if (rows.length === 0) return;

  const upserts = rows.filter(r => r.op === 'upsert').map(r => ({
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    description: r.description,
    start_date: r.start_date,
    end_date: r.end_date,
    // Store image as JSONB with url if present; else null
    image: r.image_url ? { url: r.image_url } : null,
    tags: parseJson<string[]>(r.tags, []),
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at,
  }));
  const deletes = rows.filter(r => r.op === 'delete').map(r => ({ id: r.id, user_id: r.user_id, deleted_at: r.deleted_at ?? nowIso(), updated_at: r.updated_at }));

  const successIds: string[] = [];
  if (upserts.length > 0) {
    const { data, error } = await supabase.from('series').upsert(upserts, { onConflict: 'id' }).select('id');
    if (error) throw error;
    for (const r of data ?? []) successIds.push(r.id);
  }
  if (deletes.length > 0) {
    // Soft delete: set deleted_at (and updated_at) remotely
    for (const d of deletes) {
      const { data, error } = await supabase
        .from('series')
        .update({ deleted_at: d.deleted_at, updated_at: nowIso() })
        .eq('id', d.id)
        .eq('user_id', d.user_id)
        .select('id');
      if (error) throw error;
      // Consider success if row updated OR already deleted (0 rows) — in both cases it's safe to clear locally
      successIds.push(d.id);
    }
  }

  if (successIds.length > 0) {
    const placeholders = successIds.map(() => '?').join(',');
    await exec(`UPDATE series SET dirty = 0, synced_at = ? WHERE id IN (${placeholders})`, [nowIso(), ...successIds]);
  }
}

async function pushSermons(userId: string) {
  const rows = await queryAll<any>(
    `SELECT * FROM sermons WHERE user_id = ? AND dirty = 1`,
    [userId]
  );
  if (rows.length === 0) return;

  const upserts = rows.filter(r => r.op === 'upsert').map(r => ({
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    content: r.content,
    outline: parseJson<any>(r.outline, null),
    scripture: r.scripture,
    tags: parseJson<string[]>(r.tags, []),
    status: r.status,
    visibility: r.visibility,
    date: r.date,
    notes: r.notes,
    series_id: r.series_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at,
  }));
  const deletes = rows.filter(r => r.op === 'delete').map(r => ({ id: r.id, user_id: r.user_id, deleted_at: r.deleted_at ?? nowIso(), updated_at: r.updated_at }));

  const successIds: string[] = [];
  if (upserts.length > 0) {
    const { data, error } = await supabase.from('sermons').upsert(upserts, { onConflict: 'id' }).select('id');
    if (error) throw error;
    for (const r of data ?? []) successIds.push(r.id);
  }
  if (deletes.length > 0) {
    for (const d of deletes) {
      const { data, error } = await supabase
        .from('sermons')
        .update({ deleted_at: d.deleted_at, updated_at: nowIso() })
        .eq('id', d.id)
        .eq('user_id', d.user_id)
        .select('id');
      if (error) throw error;
      successIds.push(d.id);
    }
  }

  if (successIds.length > 0) {
    const placeholders = successIds.map(() => '?').join(',');
    await exec(`UPDATE sermons SET dirty = 0, synced_at = ? WHERE id IN (${placeholders})`, [nowIso(), ...successIds]);
  }
}

async function pullSeries(userId: string) {
  const key = LP_KEYS.series(userId);
  const since = (await AsyncStorage.getItem(key)) || null;
  const query = supabase.from('series').select('*').eq('user_id', userId);
  const { data, error } = since
    ? await query.gt('updated_at', since)
    : await query;
  if (error) throw error;

  const rows = data || [];
  for (const r of rows) {
    // Check local record
    const local = await queryFirst<any>(`SELECT id, updated_at, dirty, deleted_at FROM series WHERE id = ?`, [r.id]);
    const remoteUpdated = r.updated_at || r.created_at || nowIso();
    if (!local) {
      await exec(
        `INSERT OR REPLACE INTO series (id, user_id, title, description, start_date, end_date, image_url, tags, status, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'upsert', 0)`,
        [r.id, r.user_id, r.title, r.description ?? null, r.start_date ?? null, r.end_date ?? null, (r as any).image ?? null, JSON.stringify(r.tags ?? []), r.status ?? 'planning', r.created_at || remoteUpdated, remoteUpdated, r.deleted_at ?? null, nowIso()]
      );
    } else {
      const keepLocal = ((local.dirty === 1) || (local.deleted_at != null)) && local.updated_at >= remoteUpdated;
      if (keepLocal) continue; // local newer, push later
      await exec(
        `UPDATE series SET title = ?, description = ?, start_date = ?, end_date = ?, image_url = ?, tags = ?, status = ?, updated_at = ?, deleted_at = ?, synced_at = ?, dirty = 0, op = 'upsert' WHERE id = ?`,
        [r.title, r.description ?? null, r.start_date ?? null, r.end_date ?? null, (r as any).image ?? null, JSON.stringify(r.tags ?? []), r.status ?? 'planning', remoteUpdated, r.deleted_at ?? null, nowIso(), r.id]
      );
    }
  }
  await AsyncStorage.setItem(key, nowIso());
}

async function pullSermons(userId: string) {
  const key = LP_KEYS.sermons(userId);
  const since = (await AsyncStorage.getItem(key)) || null;
  const query = supabase.from('sermons').select('*').eq('user_id', userId);
  const { data, error } = since
    ? await query.gt('updated_at', since)
    : await query;
  if (error) throw error;

  const rows = data || [];
  for (const r of rows) {
    const local = await queryFirst<any>(`SELECT id, updated_at, dirty, deleted_at FROM sermons WHERE id = ?`, [r.id]);
    const remoteUpdated = r.updated_at || r.created_at || nowIso();
    if (!local) {
      await exec(
        `INSERT OR REPLACE INTO sermons (id, user_id, title, content, outline, scripture, tags, status, visibility, date, notes, series_id, created_at, updated_at, deleted_at, synced_at, dirty, op, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'upsert', 0)`,
        [r.id, r.user_id, r.title, r.content ?? null, JSON.stringify((r as any).outline ?? null), r.scripture ?? null, JSON.stringify(r.tags ?? []), r.status ?? 'draft', r.visibility ?? 'private', r.date ?? null, r.notes ?? null, r.series_id ?? null, r.created_at || remoteUpdated, remoteUpdated, r.deleted_at ?? null, nowIso()]
      );
    } else {
      const keepLocal = ((local.dirty === 1) || (local.deleted_at != null)) && local.updated_at >= remoteUpdated;
      if (keepLocal) continue;
      await exec(
        `UPDATE sermons SET title = ?, content = ?, outline = ?, scripture = ?, tags = ?, status = ?, visibility = ?, date = ?, notes = ?, series_id = ?, updated_at = ?, deleted_at = ?, synced_at = ?, dirty = 0, op = 'upsert' WHERE id = ?`,
        [r.title, r.content ?? null, JSON.stringify((r as any).outline ?? null), r.scripture ?? null, JSON.stringify(r.tags ?? []), r.status ?? 'draft', r.visibility ?? 'private', r.date ?? null, r.notes ?? null, r.series_id ?? null, remoteUpdated, r.deleted_at ?? null, nowIso(), r.id]
      );
    }
  }
  await AsyncStorage.setItem(key, nowIso());
}

export async function syncSeries(): Promise<void> {
  const userId = await getCurrentUserId();
  await pushSeries(userId);
  await pullSeries(userId);
}

export async function syncSermons(): Promise<void> {
  const userId = await getCurrentUserId();
  await pushSermons(userId);
  await pullSermons(userId);
}

export async function syncAll(): Promise<void> {
  // Push series first so sermon FK references exist remotely
  await syncSeries();
  await syncSermons();
}

export default { syncAll, syncSeries, syncSermons };
