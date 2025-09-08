// Offline-first data models scoped per signed-in user.
// These are repository/persistence shapes (SQLite) with sync metadata.

export type SyncOp = 'upsert' | 'delete';

export interface SyncMeta {
  // ISO 8601 timestamps; stored as TEXT in SQLite
  createdAt: string; // when first created locally
  updatedAt: string; // last local/merged change time
  deletedAt: string | null; // soft delete marker
  syncedAt: string | null; // last time this row successfully synced
  // change tracking
  dirty: 0 | 1; // needs push
  op: SyncOp; // last intended operation to push
  version: number; // local optimistic version counter
}

export type SeriesStatus = 'planning' | 'active' | 'completed' | 'archived';
export type SermonStatus = 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
export type SermonVisibility = 'private' | 'congregation' | 'public';

export interface BaseEntity {
  id: string; // UUID v4; generated client-side
  userId: string; // UUID of the owner; current session user
}

export interface SeriesRecord extends BaseEntity, SyncMeta {
  title: string;
  description: string | null;
  startDate: string | null; // ISO date
  endDate: string | null;   // ISO date
  imageUrl: string | null;
  tags: string[]; // persisted as JSON
  status: SeriesStatus;
}

export interface SermonRecord extends BaseEntity, SyncMeta {
  title: string;
  content: string | null;
  outline: unknown | null; // JSON
  scripture: string | null;
  tags: string[]; // JSON
  status: SermonStatus;
  visibility: SermonVisibility;
  date: string | null; // ISO date (sermon date)
  notes: string | null;
  seriesId: string | null; // FK to SeriesRecord.id (same userId)
}

// Table names for convenience
export const TABLES = {
  series: 'series',
  sermons: 'sermons',
  conflicts: 'conflicts',
} as const;

// Conflict log (optional for diagnostics/UI surfacing)
export interface ConflictRecord {
  id: string; // UUID
  userId: string;
  table: keyof typeof TABLES; // 'series' | 'sermons'
  recordId: string; // conflicted row id
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  resolvedWith: 'local' | 'remote';
  createdAt: string;
}

// Helpers to coerce Date -> ISO string consistently
export const toIso = (d: Date | number | string) =>
  typeof d === 'string' ? new Date(d).toISOString() : new Date(d).toISOString();

