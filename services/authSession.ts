import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabaseClient';

const STORAGE_KEYS = {
  currentUserId: 'offline.currentUserId',
} as const;

let initialized = false;

export async function cacheUserId(userId: string | null): Promise<void> {
  if (userId) {
    await AsyncStorage.setItem(STORAGE_KEYS.currentUserId, userId);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.currentUserId);
  }
}

export async function getCachedUserId(): Promise<string | null> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.currentUserId)) || null;
}

// Returns the current user id if online (Supabase session available) or
// falls back to cached id for offline usage. Throws if neither is available.
export async function getCurrentUserId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    const id = data?.user?.id;
    if (id) {
      // Keep cache fresh for offline usage
      await cacheUserId(id);
      return id;
    }
  } catch {}
  const cached = await getCachedUserId();
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
  supabase.auth.getUser().then(({ data }) => {
    if (data?.user?.id) void cacheUserId(data.user.id);
  }).catch(() => {});

  supabase.auth.onAuthStateChange(async (event, session) => {
    const id = session?.user?.id ?? null;
    // Keep data on device; only hide it by clearing cache on sign-out
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (id) await cacheUserId(id);
    } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      await clearCachedUserId();
    }
  });
}

export default {
  initAuthSession,
  cacheUserId,
  clearCachedUserId,
  getCachedUserId,
  getCurrentUserId,
  isAuthenticatedOffline,
};

