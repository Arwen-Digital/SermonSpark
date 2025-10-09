import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Update authSession to work with Express.js auth instead of Supabase
// import { supabase } from '@/services/supabaseClient';
import httpClient from '@/services/httpClient';

const STORAGE_KEYS = {
  currentUserId: 'offline.currentUserId',
} as const;

let initialized = false;
let inMemoryUserId: string | null = null;

export async function cacheUserId(userId: string | null): Promise<void> {
  if (userId) {
    await AsyncStorage.setItem(STORAGE_KEYS.currentUserId, userId);
    inMemoryUserId = userId;
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.currentUserId);
    inMemoryUserId = null;
  }
}

export async function getCachedUserId(): Promise<string | null> {
  if (inMemoryUserId) return inMemoryUserId;
  const v = (await AsyncStorage.getItem(STORAGE_KEYS.currentUserId)) || null;
  inMemoryUserId = v;
  return v;
}

// Returns the current user id if online (Express auth available) or
// falls back to cached id for offline usage. Throws if neither is available.
export async function getCurrentUserId(): Promise<string> {
  // Offline-first: return cached/in-memory immediately if present
  const cached = await getCachedUserId();
  if (cached) return cached;

  // No cached value: try a one-shot online check (no retries) as a best-effort
  try {
    // Express.js /auth/me returns { success, data: { user } } and httpClient unwraps to { user }
    const data = await httpClient.get<{ user?: { id?: string } }>('/api/auth/me');
    const id = data?.user?.id;
    if (id) {
      await cacheUserId(id);
      return id;
    }
  } catch {}

  if (!cached) throw new Error('No authenticated user');
  return cached;
}

export async function isAuthenticatedOffline(): Promise<boolean> {
  const cached = await getCachedUserId();
  return !!cached;
}

export async function clearCachedUserId(): Promise<void> {
  await cacheUserId(null);
}

// Initialize auth state listener to keep cache in sync
export function initAuthSession(): void {
  if (initialized) return;
  initialized = true;

  // Seed cache once on start if available
  httpClient.get<{ user?: { id?: string } }>('/api/auth/me').then((data) => {
    const id = data?.user?.id;
    if (id) void cacheUserId(id);
  }).catch(() => {});

  // TODO: Implement auth state change listener for Express.js
  // This might involve periodic token validation or WebSocket connections
}

export default {
  initAuthSession,
  cacheUserId,
  clearCachedUserId,
  getCachedUserId,
  getCurrentUserId,
  isAuthenticatedOffline,
};

