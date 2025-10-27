/**
 * Clerk authentication service
 * Provides utilities to work with Clerk authentication state
 */

import { useAuth as useClerkAuth } from '@clerk/clerk-expo';

/**
 * Hook to check if user is authenticated with Clerk
 * This should be used in components that need to check auth state
 */
export function useIsAuthenticated() {
  const { isSignedIn } = useClerkAuth();
  return isSignedIn;
}

/**
 * Get Clerk user ID
 * Returns null if not authenticated
 */
export function useClerkUserId(): string | null {
  const { userId } = useClerkAuth();
  return userId;
}

/**
 * Get Clerk user data
 */
export function useClerkUser() {
  const { user } = useClerkAuth();
  return user;
}

// Sync Clerk user ID to local storage
export async function syncClerkUserIdToLocal(userId: string): Promise<void> {
  const { cacheUserId } = await import('./authSession');
  await cacheUserId(userId);
}
