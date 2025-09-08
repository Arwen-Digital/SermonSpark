// Web build should not import expo-sqlite. Provide no-op exports.
export async function initDb(): Promise<void> { /* no-op on web */ }
export function getDb(): never { throw new Error('SQLite not available on web'); }
export async function exec(): Promise<never> { throw new Error('SQLite not available on web'); }
export async function execBatch(): Promise<never> { throw new Error('SQLite not available on web'); }
export async function queryAll(): Promise<never> { throw new Error('SQLite not available on web'); }
export async function queryFirst(): Promise<never> { throw new Error('SQLite not available on web'); }
