// Hook for managing conflict resolution state and actions
import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { 
  DataConflict, 
  ConflictResolution,
  resolveSeriesConflict,
  resolveSermonConflict,
  ConflictResolutionStrategy,
} from '../services/conflictResolution';
import { 
  getPendingConflicts,
  resolveConflictManually,
} from '../services/sync/syncService';

export interface UseConflictResolutionReturn {
  conflicts: DataConflict[];
  isLoading: boolean;
  hasConflicts: boolean;
  loadConflicts: () => Promise<void>;
  resolveConflict: (
    conflictId: string,
    resolution: 'keep_local' | 'keep_remote' | 'merge',
    mergedData?: any
  ) => Promise<void>;
  autoResolveSimpleConflicts: (strategy?: ConflictResolutionStrategy) => Promise<number>;
  clearAllConflicts: () => void;
}

export const useConflictResolution = (): UseConflictResolutionReturn => {
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConflicts = useCallback(async () => {
    if (Platform.OS === 'web' || !getPendingConflicts) {
      return;
    }

    try {
      setIsLoading(true);
      const pendingConflicts = await getPendingConflicts();
      setConflicts(pendingConflicts);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
      Alert.alert('Error', 'Failed to load pending conflicts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'keep_local' | 'keep_remote' | 'merge',
    mergedData?: any
  ) => {
    if (Platform.OS === 'web' || !resolveConflictManually) {
      throw new Error('Conflict resolution not supported on this platform');
    }

    try {
      setIsLoading(true);
      await resolveConflictManually(conflictId, resolution, mergedData);
      
      // Remove resolved conflict from local state
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const autoResolveSimpleConflicts = useCallback(async (
    strategy: ConflictResolutionStrategy = 'newest_wins'
  ): Promise<number> => {
    if (Platform.OS === 'web' || !resolveConflictManually) {
      return 0;
    }

    try {
      setIsLoading(true);
      let resolvedCount = 0;

      // Only auto-resolve conflicts with 2 or fewer conflicting fields
      const simpleConflicts = conflicts.filter(c => c.conflictFields.length <= 2);

      for (const conflict of simpleConflicts) {
        try {
          let resolution: ConflictResolution<any>;
          
          if (conflict.type === 'series') {
            resolution = resolveSeriesConflict(
              conflict.localRecord,
              conflict.remoteRecord,
              strategy
            );
          } else {
            resolution = resolveSermonConflict(
              conflict.localRecord,
              conflict.remoteRecord,
              strategy
            );
          }

          await resolveConflictManually(
            conflict.id,
            resolution.resolution,
            resolution.resolvedRecord
          );
          
          resolvedCount++;
        } catch (error) {
          console.error(`Failed to auto-resolve conflict ${conflict.id}:`, error);
          // Continue with other conflicts
        }
      }

      // Remove resolved conflicts from local state
      setConflicts(prev => prev.filter(c => 
        c.conflictFields.length > 2 || 
        !simpleConflicts.some(sc => sc.id === c.id)
      ));

      return resolvedCount;
    } catch (error) {
      console.error('Auto-resolve failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [conflicts]);

  const clearAllConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  return {
    conflicts,
    isLoading,
    hasConflicts: conflicts.length > 0,
    loadConflicts,
    resolveConflict,
    autoResolveSimpleConflicts,
    clearAllConflicts,
  };
};

export default useConflictResolution;