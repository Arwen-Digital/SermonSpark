import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Integrate Clerk auth for online authentication

const STORAGE_KEYS = {
  currentUserId: 'offline.currentUserId',
  anonymousUserId: 'offline.anonymousUserId',
} as const;

let initialized = false;
let inMemoryUserId: string | null = null;
let inMemoryAnonymousUserId: string | null = null;

export async function cacheUserId(userId: string | null): Promise<void> {
  if (userId) {
    await AsyncStorage.setItem(STORAGE_KEYS.currentUserId, userId);
    inMemoryUserId = userId;
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.currentUserId);
    inMemoryUserId = null;
  }
}

// Generate and cache anonymous user ID for offline users
export async function generateAnonymousUserId(): Promise<string> {
  if (inMemoryAnonymousUserId) return inMemoryAnonymousUserId;
  
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.anonymousUserId);
  if (existing) {
    inMemoryAnonymousUserId = existing;
    return existing;
  }
  
  // Generate new anonymous user ID
  const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  await AsyncStorage.setItem(STORAGE_KEYS.anonymousUserId, anonymousId);
  inMemoryAnonymousUserId = anonymousId;
  return anonymousId;
}

// Get effective user ID (authenticated or anonymous) - LOCAL FIRST
export async function getEffectiveUserId(): Promise<string> {
  // First try to get authenticated user ID from cache (no API calls)
  const authenticatedId = await getCachedUserId();
  if (authenticatedId) return authenticatedId;
  
  // For local-first functionality, don't make API calls
  // Just generate or return anonymous user ID immediately
  return await generateAnonymousUserId();
}

export async function getCachedUserId(): Promise<string | null> {
  if (inMemoryUserId) return inMemoryUserId;
  const v = (await AsyncStorage.getItem(STORAGE_KEYS.currentUserId)) || null;
  inMemoryUserId = v;
  return v;
}

// Returns the current user id if online (Express auth available) or
// falls back to cached id for offline usage. Now supports anonymous users.
export async function getCurrentUserId(): Promise<string> {
  // Use the new effective user ID function that supports anonymous users
  return await getEffectiveUserId();
}

export async function isAuthenticatedOffline(): Promise<boolean> {
  const cached = await getCachedUserId();
  const anonymous = await AsyncStorage.getItem(STORAGE_KEYS.anonymousUserId);
  return !!(cached || anonymous);
}

export async function clearCachedUserId(): Promise<void> {
  await cacheUserId(null);
}

export async function clearAnonymousUserId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.anonymousUserId);
  inMemoryAnonymousUserId = null;
}

// Check if user is authenticated online (has real Clerk account)
export async function isAuthenticatedOnline(): Promise<boolean> {
  // TODO: Check Clerk authentication state from global state
  // This will be implemented when we add global Clerk state management
  // For now, check if there's a Clerk user ID cached
  const cached = await getCachedUserId();
  // If cached ID doesn't start with 'anon_', it's a Clerk user
  return cached !== null && !cached.startsWith('anon_');
}

// Link anonymous user data to authenticated account
export async function linkOfflineDataToAccount(authenticatedUserId: string): Promise<void> {
  // Reentrancy guard: prevent overlapping migrations
  if ((globalThis as any).__linkingOfflineData) {
    console.log('linkOfflineDataToAccount: already in progress, skipping');
    return;
  }
  (globalThis as any).__linkingOfflineData = true;

  const anonymousId = await AsyncStorage.getItem(STORAGE_KEYS.anonymousUserId);
  
  if (!anonymousId) {
    // No anonymous data to link
    (globalThis as any).__linkingOfflineData = false;
    return;
  }

  try {
    // First, perform local data migration
    const { migrateOfflineDataToAccount } = await import('./dataMigration');
    const migrationResult = await migrateOfflineDataToAccount(authenticatedUserId);
    
    if (!migrationResult.success) {
      throw new Error(`Local data migration failed: ${migrationResult.errors.join(', ')}`);
    }

    // TODO: Sync migrated data to Convex backend (if online)
    // This will be handled by Convex sync when user authenticates

    // Clear anonymous user ID after successful linking
    await clearAnonymousUserId();
    
    // Cache the authenticated user ID
    await cacheUserId(authenticatedUserId);
    
    console.log('Successfully linked offline data to account:', {
      migratedRecords: migrationResult.totalMigratedRecords,
      conflicts: migrationResult.totalConflicts,
    });
  } catch (error) {
    console.error('Failed to link offline data to account:', error);
    throw new Error('Failed to migrate offline data to your account');
  }
  finally {
    (globalThis as any).__linkingOfflineData = false;
  }
}

// Get the anonymous user ID if it exists
export async function getAnonymousUserId(): Promise<string | null> {
  if (inMemoryAnonymousUserId) return inMemoryAnonymousUserId;
  
  const anonymousId = await AsyncStorage.getItem(STORAGE_KEYS.anonymousUserId);
  if (anonymousId) {
    inMemoryAnonymousUserId = anonymousId;
  }
  return anonymousId;
}

// Check if user has offline data that can be linked
export async function hasOfflineDataToLink(): Promise<boolean> {
  const anonymousId = await getAnonymousUserId();
  return !!anonymousId;
}

// Sync Clerk user ID to local cache after login
export async function syncClerkUserToLocal(clerkUserId: string): Promise<void> {
  await cacheUserId(clerkUserId);
  
  // Link any anonymous data to the authenticated account
  const anonId = await getAnonymousUserId();
  if (anonId && anonId !== clerkUserId) {
    await linkOfflineDataToAccount(clerkUserId);
  }
}

// Initialize auth state listener to keep cache in sync
export function initAuthSession(): void {
  if (initialized) return;
  initialized = true;

  // TODO: Initialize Clerk auth listener
  // This will update local cache when authentication state changes
  // Example:
  // - Listen to Clerk auth state changes
  // - When user signs in, cache their Clerk user ID
  // - When user signs out, clear cache
}

export default {
  initAuthSession,
  cacheUserId,
  clearCachedUserId,
  getCachedUserId,
  getCurrentUserId,
  getEffectiveUserId,
  generateAnonymousUserId,
  getAnonymousUserId,
  clearAnonymousUserId,
  isAuthenticatedOffline,
  isAuthenticatedOnline,
  linkOfflineDataToAccount,
  hasOfflineDataToLink,
  syncClerkUserToLocal,
};

