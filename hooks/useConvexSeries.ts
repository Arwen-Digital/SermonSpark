/**
 * Hook to use Convex series mutations and queries
 * Automatically handles local SQLite operations and Convex sync
 */

import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

/**
 * Hook to get all series from Convex
 * This will be used to sync remote data to local SQLite
 */
export function useConvexSeries() {
  const series = useQuery(api.series.list);

  return {
    series: series ?? [],
    isLoading: series === undefined,
  };
}

/**
 * Hook to get a single series
 */
export function useConvexSeriesItem(id: string | null) {
  const series = useQuery(
    api.series.get,
    id ? { id } : 'skip'
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
  return useMutation(api.series.create);
}

/**
 * Hook to update series mutation
 */
export function useUpdateSeriesMutation() {
  return useMutation(api.series.update);
}

/**
 * Hook to delete series mutation
 */
export function useDeleteSeriesMutation() {
  return useMutation(api.series.remove);
}

