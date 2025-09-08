// Native SQLite initialization and migration runner (Expo/React Native).
// Uses PRAGMA user_version to manage schema versions.

import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

type SQLParams = (number | string | null | Uint8Array)[];

function open(): SQLiteDatabase {
  if (!dbInstance) {
    // Single DB file for app; we scope data per user via user_id column.
    dbInstance = openDatabaseSync('youpreacher.db');
  }
  return dbInstance;
}

async function run(sql: string, params: SQLParams = []) {
  const db = open();
  return db.runAsync(sql, params);
}

async function getFirst<T = any>(sql: string, params: SQLParams = []): Promise<T | undefined> {
  const db = open();
  // @ts-expect-error type provided by expo-sqlite
  return db.getFirstAsync<T>(sql, params);
}

async function runBatch(statements: { sql: string; params?: SQLParams }[]): Promise<void> {
  const db = open();
  await db.withTransactionAsync(async () => {
    for (const { sql, params } of statements) {
      await db.runAsync(sql, params ?? []);
    }
  });
}

async function getUserVersion(): Promise<number> {
  const row = await getFirst<{ user_version: number }>('PRAGMA user_version');
  const v = row?.user_version ?? 0;
  return typeof v === 'number' ? v : Number(v || 0);
}

async function setUserVersion(v: number): Promise<void> {
  const db = open();
  await db.execAsync(`PRAGMA user_version = ${v}`);
}

// Migration v1: initial schema for series, sermons, conflicts
async function migrateTo1() {
  const stmts: { sql: string; params?: SQLParams }[] = [
    {
      sql: `CREATE TABLE IF NOT EXISTS series (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        image_url TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'planning',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        synced_at TEXT,
        dirty INTEGER NOT NULL DEFAULT 1,
        op TEXT NOT NULL DEFAULT 'upsert',
        version INTEGER NOT NULL DEFAULT 0
      )`,
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_series_user_updated ON series (user_id, updated_at)` },
    { sql: `CREATE INDEX IF NOT EXISTS idx_series_user_deleted ON series (user_id, deleted_at)` },
    { sql: `CREATE INDEX IF NOT EXISTS idx_series_user_status  ON series (user_id, status)` },

    {
      sql: `CREATE TABLE IF NOT EXISTS sermons (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        outline TEXT,
        scripture TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'draft',
        visibility TEXT NOT NULL DEFAULT 'private',
        date TEXT,
        notes TEXT,
        series_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        synced_at TEXT,
        dirty INTEGER NOT NULL DEFAULT 1,
        op TEXT NOT NULL DEFAULT 'upsert',
        version INTEGER NOT NULL DEFAULT 0
      )`,
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_sermons_user_updated ON sermons (user_id, updated_at)` },
    { sql: `CREATE INDEX IF NOT EXISTS idx_sermons_user_deleted ON sermons (user_id, deleted_at)` },
    { sql: `CREATE INDEX IF NOT EXISTS idx_sermons_user_series  ON sermons (user_id, series_id)` },

    {
      sql: `CREATE TABLE IF NOT EXISTS conflicts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        local_updated_at TEXT NOT NULL,
        remote_updated_at TEXT NOT NULL,
        resolved_with TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    },
  ];

  await runBatch(stmts);
  await setUserVersion(1);
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const current = await getUserVersion();
    if (current < 1) {
      await migrateTo1();
    }
  })();
  return initPromise;
}

export function getDb(): SQLiteDatabase {
  return open();
}

// Simple helpers for repository layer (will be used in Step 5)
export async function exec(sql: string, params: SQLParams = []) {
  return run(sql, params);
}

export async function execBatch(statements: { sql: string; params?: SQLParams }[]): Promise<void> {
  return runBatch(statements);
}

export async function queryAll<T = any>(sql: string, params: SQLParams = []): Promise<T[]> {
  const db = open();
  // @ts-expect-error provided by expo-sqlite
  const rows = await db.getAllAsync<T>(sql, params);
  return rows ?? [];
}

export async function queryFirst<T = any>(sql: string, params: SQLParams = []): Promise<T | undefined> {
  return getFirst<T>(sql, params);
}
