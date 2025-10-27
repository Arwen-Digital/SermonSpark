import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, generateAnonymousUserId, isAuthenticatedOffline } from '../services/authSession';

export interface LocalFirstStatus {
  currentUserId: string | null;
  anonymousUserId: string | null;
  isOfflineAuth: boolean;
  hasStoredData: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to test and monitor local-first functionality
 */
export function useLocalFirstTest() {
  const [status, setStatus] = useState<LocalFirstStatus>({
    currentUserId: null,
    anonymousUserId: null,
    isOfflineAuth: false,
    hasStoredData: false,
    loading: true,
    error: null,
  });

  const refreshStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      // Get current user ID (authenticated or anonymous)
      const currentUserId = await getCurrentUserId();
      
      // Get anonymous user ID specifically
      const anonymousUserId = await AsyncStorage.getItem('offline.anonymousUserId');
      
      // Check offline authentication status
      const isOfflineAuth = await isAuthenticatedOffline();
      
      // Check if there's any stored data
      const keys = [
        'offline.currentUserId',
        'offline.anonymousUserId',
        'access_token',
        'user',
        'sync.bidirectional.state',
      ];
      const values = await AsyncStorage.multiGet(keys);
      const hasStoredData = values.some(([key, value]) => value !== null);

      setStatus({
        currentUserId,
        anonymousUserId,
        isOfflineAuth,
        hasStoredData,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error refreshing local-first status:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const createAnonymousUser = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const anonymousId = await generateAnonymousUserId();
      console.log('Generated anonymous user:', anonymousId);
      
      await refreshStatus();
      return anonymousId;
      
    } catch (error) {
      console.error('Error creating anonymous user:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create anonymous user',
      }));
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const keys = [
        'offline.currentUserId',
        'offline.anonymousUserId',
        'access_token',
        'refresh_token',
        'user',
        'sync.bidirectional.state',
        'sync.queue',
        'sync.lastPulledAt.series',
        'sync.lastPulledAt.sermons',
        'sync.lastPushedAt.series',
        'sync.lastPushedAt.sermons',
        'featureGate.cache',
        'featureGate.lastCheck',
        'conflicts.pending',
        'conflicts.resolved',
        'migration.state',
        'migration.progress',
      ];
      
      await AsyncStorage.multiRemove(keys);
      console.log('Cleared all local data');
      
      await refreshStatus();
      
    } catch (error) {
      console.error('Error clearing data:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to clear data',
      }));
      throw error;
    }
  };

  const simulateFreshInstall = async () => {
    try {
      // Clear all data first
      await clearAllData();
      
      // Wait a bit for state to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate new anonymous user (simulating first app open)
      await createAnonymousUser();
      
      console.log('Simulated fresh install complete');
      
    } catch (error) {
      console.error('Error simulating fresh install:', error);
      throw error;
    }
  };

  // Load initial status
  useEffect(() => {
    refreshStatus();
  }, []);

  return {
    status,
    refreshStatus,
    createAnonymousUser,
    clearAllData,
    simulateFreshInstall,
  };
}

export default useLocalFirstTest;