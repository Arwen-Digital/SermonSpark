/**
 * Hook to integrate Convex with custom auth
 * Provides auth state and Convex client access
 */

import { useAuth } from '@/services/customAuth';
import { useConvex } from 'convex/react';

/**
 * Hook that provides both custom auth state and Convex client
 */
export function useConvexAuth() {
  const { isSignedIn, user, isLoading } = useAuth();
  const convex = useConvex();

  return {
    isSignedIn,
    userId: user?.id ?? null,
    user,
    convex,
    isAuthenticated: isSignedIn && !!user,
    isLoading,
  };
}

/**
 * Hook to check if we should sync to Convex
 * Returns true if user is authenticated
 */
export function useShouldSyncToConvex(): boolean {
  const { isSignedIn } = useAuth();
  return isSignedIn;
}
