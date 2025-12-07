/**
 * Hook to use Convex sermon mutations and queries
 * Automatically handles local SQLite operations and Convex sync
 */

import { useAuthenticatedMutation, useAuthenticatedQuery } from '@/services/customAuth';
import { api } from '../convex/_generated/api';

/**
 * Hook to get all sermons from Convex
 * This will be used to sync remote data to local SQLite
 */
export function useConvexSermons() {
  const sermons = useAuthenticatedQuery(api.sermons.list);

  return {
    sermons: sermons ?? [],
    isLoading: sermons === undefined,
  };
}

/**
 * Hook to get a single sermon
 */
export function useConvexSermon(id: string | null) {
  const sermon = useAuthenticatedQuery(
    api.sermons.get,
    id ? { id } : 'skip'
  );

  return {
    sermon,
    isLoading: sermon === undefined,
  };
}

/**
 * Hook to create sermon mutation
 */
export function useCreateSermonMutation() {
  return useAuthenticatedMutation(api.sermons.create);
}

/**
 * Hook to update sermon mutation
 */
export function useUpdateSermonMutation() {
  return useAuthenticatedMutation(api.sermons.update);
}

/**
 * Hook to delete sermon mutation
 */
export function useDeleteSermonMutation() {
  return useAuthenticatedMutation(api.sermons.remove);
}

