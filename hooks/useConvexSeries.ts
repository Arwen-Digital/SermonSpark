/**
 * Hook to use Convex series mutations and queries
 * Automatically handles local SQLite operations and Convex sync
 */

import { useAuthenticatedMutation, useAuthenticatedQuery } from '@/services/customAuth';
import { api } from '../convex/_generated/api';

/**
 * Hook to get all series from Convex
 * This will be used to sync remote data to local SQLite
 */
export function useConvexSeries() {
  const series = useAuthenticatedQuery(api.series.list);

  return {
    series: series ?? [],
    isLoading: series === undefined,
  };
}

/**
 * Hook to get a single series
 */
export function useConvexSeriesItem(seriesId: string | null) {
  const series = useAuthenticatedQuery(
    api.series.get,
    seriesId ? { id: seriesId } : "skip"
  );

  return {
    series,
    isLoading: series === undefined,
  };
}

/**
 * Hook to create series mutation
 */
export function useCreateSeriesMutation() {
  return useAuthenticatedMutation(api.series.create);
}

/**
 * Hook to update series mutation
 */
export function useUpdateSeriesMutation() {
  return useAuthenticatedMutation(api.series.update);
}

/**
 * Hook to delete series mutation
 */
export function useDeleteSeriesMutation() {
  return useAuthenticatedMutation(api.series.remove);
}

