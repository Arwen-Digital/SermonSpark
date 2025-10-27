/**
 * Hook to integrate Convex with Clerk auth
 * Provides auth state and Convex client access
 */

import { useAuth } from '@clerk/clerk-expo';
import { useConvex } from 'convex/react';

/**
 * Hook that provides both Clerk auth state and Convex client
 */
export function useConvexAuth() {
  const { isSignedIn, userId, user } = useAuth();
  const convex = useConvex();

  return {
    isSignedIn: isSignedIn ?? false,
    userId: userId ?? null,
    user,
    convex,
    isAuthenticated: !!userId && isSignedIn,
  };
}

/**
 * Hook to check if we should sync to Convex
 * Returns true if user is authenticated with Clerk
 */
export function useShouldSyncToConvex(): boolean {
  const { isSignedIn } = useAuth();
  return isSignedIn ?? false;
}

