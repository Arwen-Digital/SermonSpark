import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { 
  getEnhancedSyncStatus, 
  addSyncStatusListener, 
  syncFromWebPlatform,
  getPendingConflicts,
} from '../../services/sync/syncService';
import { isAuthenticatedOnline } from '../../services/authSession';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  onConflictsPress?: () => void;
  style?: any;
  compact?: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  isAuthenticated: boolean;
  pendingOperations: number;
  lastSyncTime?: string;
  syncInProgress: boolean;
}

interface EnhancedSyncStatus extends SyncStatus {
  lastWebSyncAt: string | null;
  pendingConflicts: number;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  showDetails = false,
  onConflictsPress,
  style,
  compact = false
}) => {
  const [syncStatus, setSyncStatus] = useState<EnhancedSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticationStatus, setAuthenticationStatus] = useState<'checking' | 'authenticated' | 'anonymous'>('checking');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeStatus = async () => {
      try {
        // Check authentication status first
        const isOnlineAuth = await isAuthenticatedOnline();
        setAuthenticationStatus(isOnlineAuth ? 'authenticated' : 'anonymous');

        if (Platform.OS !== 'web' && getEnhancedSyncStatus) {
          // Native platform - use enhanced status
          const status = await getEnhancedSyncStatus();
          setSyncStatus({
            ...status,
            isAuthenticated: isOnlineAuth
          });
          
          // Subscribe to status changes
          if (addSyncStatusListener) {
            unsubscribe = addSyncStatusListener((newStatus: SyncStatus) => {
              setSyncStatus(prev => prev ? { ...prev, ...newStatus } : null);
            });
          }
        } else {
          // Web platform - basic status
          setSyncStatus({
            isOnline: navigator.onLine,
            isAuthenticated: isOnlineAuth,
            pendingOperations: 0,
            syncInProgress: false,
            lastWebSyncAt: null,
            pendingConflicts: 0
          });
        }
      } catch (error) {
        console.error('Failed to initialize sync status:', error);
        // Fallback to offline mode
        setAuthenticationStatus('anonymous');
        setSyncStatus({
          isOnline: false,
          isAuthenticated: false,
          pendingOperations: 0,
          syncInProgress: false,
          lastWebSyncAt: null,
          pendingConflicts: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeStatus();

    // Periodic auth status check
    const authCheckInterval = setInterval(async () => {
      try {
        const isOnlineAuth = await isAuthenticatedOnline();
        setAuthenticationStatus(isOnlineAuth ? 'authenticated' : 'anonymous');
        
        if (syncStatus) {
          setSyncStatus(prev => prev ? { ...prev, isAuthenticated: isOnlineAuth } : null);
        }
      } catch (error) {
        // Ignore auth check errors
      }
    }, 60000); // Check every minute

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(authCheckInterval);
    };
  }, []);

  const handleSyncPress = async () => {
    if (!syncStatus?.isAuthenticated || !syncStatus?.isOnline) {
      // Show authentication prompt or offline message
      return;
    }
    
    try {
      if (Platform.OS !== 'web' && syncFromWebPlatform) {
        await syncFromWebPlatform();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleConflictsPress = async () => {
    if (onConflictsPress) {
      onConflictsPress();
    } else if (Platform.OS !== 'web' && getPendingConflicts) {
      try {
        const conflicts = await getPendingConflicts();
        console.log('Pending conflicts:', conflicts);
        // TODO: Navigate to conflicts resolution screen
      } catch (error) {
        console.error('Failed to get conflicts:', error);
      }
    }
  };

  if (isLoading || !syncStatus) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.statusText}>Loading sync status...</Text>
      </View>
    );
  }

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return '#9E9E9E'; // Gray for offline
    if (!syncStatus.isAuthenticated) return '#FF9800'; // Orange for local-only
    if (syncStatus.syncInProgress) return '#2196F3'; // Blue for syncing
    if (syncStatus.pendingConflicts > 0) return '#F44336'; // Red for conflicts
    if (syncStatus.pendingOperations > 0) return '#FFC107'; // Amber for pending
    return '#4CAF50'; // Green for synced
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (!syncStatus.isAuthenticated) return 'Local Only';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.pendingConflicts > 0) return compact ? 'Conflicts' : `${syncStatus.pendingConflicts} conflicts`;
    if (syncStatus.pendingOperations > 0) return compact ? 'Pending' : `${syncStatus.pendingOperations} pending`;
    return 'Synced';
  };

  const getLastSyncText = () => {
    const lastSync = syncStatus.lastSyncTime || syncStatus.lastWebSyncAt;
    if (!lastSync) return 'Never synced';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getSyncActionText = () => {
    if (!syncStatus.isOnline) return 'Offline Mode';
    if (!syncStatus.isAuthenticated) return 'Connect Account to Sync';
    if (syncStatus.syncInProgress) return 'Syncing...';
    return 'Tap to Sync';
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={[
          styles.statusIndicator, 
          { backgroundColor: getStatusColor() },
          compact && styles.compactIndicator
        ]}
        onPress={handleSyncPress}
        disabled={!syncStatus.isAuthenticated || !syncStatus.isOnline || syncStatus.syncInProgress}
      >
        <Text style={[styles.statusText, compact && styles.compactText]}>
          {getStatusText()}
        </Text>
        {showDetails && !compact && (
          <>
            <Text style={styles.detailText}>Last: {getLastSyncText()}</Text>
            <Text style={styles.actionText}>{getSyncActionText()}</Text>
          </>
        )}
      </TouchableOpacity>
      
      {syncStatus.pendingConflicts > 0 && (
        <TouchableOpacity 
          style={[styles.conflictsButton, compact && styles.compactConflictsButton]}
          onPress={handleConflictsPress}
        >
          <Text style={[styles.conflictsText, compact && styles.compactConflictsText]}>
            {compact ? '!' : 'Resolve Conflicts'}
          </Text>
        </TouchableOpacity>
      )}
      
      {!syncStatus.isAuthenticated && syncStatus.isOnline && !compact && (
        <View style={styles.authPrompt}>
          <Text style={styles.authPromptText}>
            Connect account for sync
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  compactIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  compactText: {
    fontSize: 10,
  },
  detailText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  actionText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
    fontStyle: 'italic',
  },
  conflictsButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactConflictsButton: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  conflictsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  compactConflictsText: {
    fontSize: 8,
  },
  authPrompt: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  authPromptText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
  },
});

export default SyncStatusIndicator;