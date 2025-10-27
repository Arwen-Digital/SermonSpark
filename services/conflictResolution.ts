// Conflict resolution service for handling data conflicts during migration and sync
import type { SeriesDTO, SermonDTO } from './repositories/types';

const TAG = '[ConflictResolution]';

export interface DataConflict<T = any> {
  id: string;
  type: 'series' | 'sermon';
  localRecord: T;
  remoteRecord: T;
  conflictFields: string[];
  timestamp: string;
}

export interface ConflictResolution<T = any> {
  conflictId: string;
  resolution: 'keep_local' | 'keep_remote' | 'merge' | 'create_duplicate';
  resolvedRecord: T;
  reason: string;
}

export type ConflictResolutionStrategy = 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';

/**
 * Detect conflicts between two records of the same type
 */
export function detectConflicts<T extends { id: string; updatedAt?: string }>(
  localRecord: T,
  remoteRecord: T,
  fieldsToCheck: (keyof T)[]
): string[] {
  const conflicts: string[] = [];

  for (const field of fieldsToCheck) {
    const localValue = localRecord[field];
    const remoteValue = remoteRecord[field];

    // Handle different types of comparisons
    if (typeof localValue === 'object' && typeof remoteValue === 'object') {
      // For objects/arrays, do deep comparison
      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        conflicts.push(field as string);
      }
    } else if (localValue !== remoteValue) {
      conflicts.push(field as string);
    }
  }

  return conflicts;
}

/**
 * Resolve series conflicts using the specified strategy
 */
export function resolveSeriesConflict(
  localSeries: SeriesDTO,
  remoteSeries: SeriesDTO,
  strategy: ConflictResolutionStrategy = 'newest_wins'
): ConflictResolution<SeriesDTO> {
  const conflictId = `series_${localSeries.id}_${Date.now()}`;
  const conflictFields = detectConflicts(localSeries, remoteSeries, [
    'title', 'description', 'startDate', 'endDate', 'imageUrl', 'tags', 'status'
  ]);

  switch (strategy) {
    case 'local_wins':
      return {
        conflictId,
        resolution: 'keep_local',
        resolvedRecord: localSeries,
        reason: 'Local record preferred by strategy',
      };

    case 'remote_wins':
      return {
        conflictId,
        resolution: 'keep_remote',
        resolvedRecord: remoteSeries,
        reason: 'Remote record preferred by strategy',
      };

    case 'newest_wins':
    default:
      const localTime = new Date(localSeries.updatedAt || localSeries.createdAt || 0);
      const remoteTime = new Date(remoteSeries.updatedAt || remoteSeries.createdAt || 0);

      if (localTime > remoteTime) {
        return {
          conflictId,
          resolution: 'keep_local',
          resolvedRecord: localSeries,
          reason: `Local record is newer (${localSeries.updatedAt} > ${remoteSeries.updatedAt})`,
        };
      } else if (remoteTime > localTime) {
        return {
          conflictId,
          resolution: 'keep_remote',
          resolvedRecord: remoteSeries,
          reason: `Remote record is newer (${remoteSeries.updatedAt} > ${localSeries.updatedAt})`,
        };
      } else {
        // Same timestamp - prefer remote (server wins)
        return {
          conflictId,
          resolution: 'keep_remote',
          resolvedRecord: remoteSeries,
          reason: 'Timestamps equal, preferring remote record',
        };
      }
  }
}

/**
 * Resolve sermon conflicts using the specified strategy
 */
export function resolveSermonConflict(
  localSermon: SermonDTO,
  remoteSermon: SermonDTO,
  strategy: ConflictResolutionStrategy = 'newest_wins'
): ConflictResolution<SermonDTO> {
  const conflictId = `sermon_${localSermon.id}_${Date.now()}`;
  const conflictFields = detectConflicts(localSermon, remoteSermon, [
    'title', 'content', 'outline', 'scripture', 'tags', 'status', 'visibility', 
    'date', 'notes', 'seriesId'
  ]);

  switch (strategy) {
    case 'local_wins':
      return {
        conflictId,
        resolution: 'keep_local',
        resolvedRecord: localSermon,
        reason: 'Local record preferred by strategy',
      };

    case 'remote_wins':
      return {
        conflictId,
        resolution: 'keep_remote',
        resolvedRecord: remoteSermon,
        reason: 'Remote record preferred by strategy',
      };

    case 'newest_wins':
    default:
      const localTime = new Date(localSermon.updatedAt || localSermon.createdAt || 0);
      const remoteTime = new Date(remoteSermon.updatedAt || remoteSermon.createdAt || 0);

      if (localTime > remoteTime) {
        return {
          conflictId,
          resolution: 'keep_local',
          resolvedRecord: localSermon,
          reason: `Local record is newer (${localSermon.updatedAt} > ${remoteSermon.updatedAt})`,
        };
      } else if (remoteTime > localTime) {
        return {
          conflictId,
          resolution: 'keep_remote',
          resolvedRecord: remoteSermon,
          reason: `Remote record is newer (${remoteSermon.updatedAt} > ${localSermon.updatedAt})`,
        };
      } else {
        // Same timestamp - prefer remote (server wins)
        return {
          conflictId,
          resolution: 'keep_remote',
          resolvedRecord: remoteSermon,
          reason: 'Timestamps equal, preferring remote record',
        };
      }
  }
}

/**
 * Merge two series records by taking the best fields from each
 */
export function mergeSeriesRecords(
  localSeries: SeriesDTO,
  remoteSeries: SeriesDTO
): { mergedRecord: SeriesDTO; mergeLog: string[] } {
  const mergeLog: string[] = [];
  const merged: SeriesDTO = { ...localSeries };

  // Use the newer timestamp for each field
  const localTime = new Date(localSeries.updatedAt || localSeries.createdAt || 0);
  const remoteTime = new Date(remoteSeries.updatedAt || remoteSeries.createdAt || 0);

  // Title: prefer non-empty, then newer
  if (!merged.title && remoteSeries.title) {
    merged.title = remoteSeries.title;
    mergeLog.push('Used remote title (local was empty)');
  } else if (remoteTime > localTime && remoteSeries.title) {
    merged.title = remoteSeries.title;
    mergeLog.push('Used remote title (newer)');
  }

  // Description: prefer non-empty, then newer
  if (!merged.description && remoteSeries.description) {
    merged.description = remoteSeries.description;
    mergeLog.push('Used remote description (local was empty)');
  } else if (remoteTime > localTime && remoteSeries.description) {
    merged.description = remoteSeries.description;
    mergeLog.push('Used remote description (newer)');
  }

  // Tags: merge arrays
  if (remoteSeries.tags && remoteSeries.tags.length > 0) {
    const localTags = merged.tags || [];
    const remoteTags = remoteSeries.tags || [];
    const combinedTags = [...new Set([...localTags, ...remoteTags])];
    if (combinedTags.length > localTags.length) {
      merged.tags = combinedTags;
      mergeLog.push('Merged tags from both records');
    }
  }

  // Use the newer timestamp
  if (remoteTime > localTime) {
    merged.updatedAt = remoteSeries.updatedAt;
    mergeLog.push('Used remote timestamp (newer)');
  }

  return { mergedRecord: merged, mergeLog };
}

/**
 * Merge two sermon records by taking the best fields from each
 */
export function mergeSermonRecords(
  localSermon: SermonDTO,
  remoteSermon: SermonDTO
): { mergedRecord: SermonDTO; mergeLog: string[] } {
  const mergeLog: string[] = [];
  const merged: SermonDTO = { ...localSermon };

  // Use the newer timestamp for each field
  const localTime = new Date(localSermon.updatedAt || localSermon.createdAt || 0);
  const remoteTime = new Date(remoteSermon.updatedAt || remoteSermon.createdAt || 0);

  // Content: prefer longer content, then newer
  if (!merged.content && remoteSermon.content) {
    merged.content = remoteSermon.content;
    mergeLog.push('Used remote content (local was empty)');
  } else if (remoteSermon.content && remoteSermon.content.length > (merged.content?.length || 0)) {
    merged.content = remoteSermon.content;
    mergeLog.push('Used remote content (longer)');
  } else if (remoteTime > localTime && remoteSermon.content) {
    merged.content = remoteSermon.content;
    mergeLog.push('Used remote content (newer)');
  }

  // Tags: merge arrays
  if (remoteSermon.tags && remoteSermon.tags.length > 0) {
    const localTags = merged.tags || [];
    const remoteTags = remoteSermon.tags || [];
    const combinedTags = [...new Set([...localTags, ...remoteTags])];
    if (combinedTags.length > localTags.length) {
      merged.tags = combinedTags;
      mergeLog.push('Merged tags from both records');
    }
  }

  // Use the newer timestamp
  if (remoteTime > localTime) {
    merged.updatedAt = remoteSermon.updatedAt;
    mergeLog.push('Used remote timestamp (newer)');
  }

  return { mergedRecord: merged, mergeLog };
}

/**
 * Log conflict resolution for debugging and audit purposes
 */
export function logConflictResolution<T>(
  conflict: DataConflict<T>,
  resolution: ConflictResolution<T>
): void {
  console.log(`${TAG} Conflict resolved:`, {
    type: conflict.type,
    id: conflict.id,
    conflictFields: conflict.conflictFields,
    resolution: resolution.resolution,
    reason: resolution.reason,
  });
}

export default {
  detectConflicts,
  resolveSeriesConflict,
  resolveSermonConflict,
  mergeSeriesRecords,
  mergeSermonRecords,
  logConflictResolution,
};