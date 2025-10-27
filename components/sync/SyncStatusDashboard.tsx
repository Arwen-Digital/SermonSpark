import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useConflictResolution } from '../../hooks/useConflictResolution';
import { isAuthenticatedOffline, isAuthenticatedOnline } from '../../services/authSession';
import { syncToConvex } from '../../services/sync/convexSyncHandler';
import { ClerkSignInModal } from '../auth/ClerkSignInModal';
import { OfflineStatusIndicator } from '../common/OfflineStatusIndicator';
import ConflictNotification from './ConflictNotification';
import ConflictResolutionModal from './ConflictResolutionModal';
import { PendingSyncIndicator } from './PendingSyncIndicator';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface SyncStatusDashboardProps {
  style?: any;
  onAuthPrompt?: () => void;
  onConflictsPress?: () => void;
  showFullDetails?: boolean;
}

interface DashboardStatus {
  isOnline: boolean;
  isAuthenticatedOnline: boolean;
  isAuthenticatedOffline: boolean;
  pendingOperationsCount: number;
  conflictsCount: number;
  lastSyncTime?: string;
  syncInProgress: boolean;
}

export const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({
  style,
  onAuthPrompt,
  onConflictsPress,
  showFullDetails = false
}) => {
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showClerkSignIn, setShowClerkSignIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { hasConflicts, loadConflicts } = useConflictResolution();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    let mounted = true;

    const updateStatus = async () => {
      try {
        const isOnline = Platform.OS === 'web' ? navigator.onLine : true;
        const authOnline = await isAuthenticatedOnline();
        const authOffline = await isAuthenticatedOffline();

        // Get sync status from sync service
        let syncStatus = {
          pendingOperationsCount: 0,
          conflictsCount: 0,
          lastSyncTime: undefined as string | undefined,
          syncInProgress: false
        };

        // Skip sync status for web - will implement later
        // For now, just show basic status
        syncStatus.pendingOperationsCount = 0;
        syncStatus.conflictsCount = 0;
        syncStatus.syncInProgress = false;

        if (mounted) {
          setStatus({
            isOnline,
            isAuthenticatedOnline: authOnline,
            isAuthenticatedOffline: authOffline,
            ...syncStatus
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to update dashboard status:', error);
        if (mounted) {
          setStatus({
            isOnline: false,
            isAuthenticatedOnline: false,
            isAuthenticatedOffline: true,
            pendingOperationsCount: 0,
            conflictsCount: 0,
            syncInProgress: false
          });
          setIsLoading(false);
        }
      }
    };

    updateStatus();
    loadConflicts(); // Load conflicts on mount

    // Update every 30 seconds
    const interval = setInterval(() => {
      updateStatus();
      loadConflicts(); // Also refresh conflicts
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadConflicts]);

  const handleConnectAccount = () => {
    if (onAuthPrompt) {
      onAuthPrompt();
    } else {
      Alert.alert(
        'Connect Account',
        'Connect your account to sync data across devices and access online features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => {
            // Navigate to auth screen
            console.log('Navigate to auth screen');
          }}
        ]
      );
    }
  };

  const handleManualSync = async () => {
    console.log('handleManualSync called, isSignedIn:', isSignedIn);
    
    // Check if user is authenticated
    if (!isSignedIn) {
      console.log('User not signed in, showing Clerk login modal');
      setShowClerkSignIn(true);
      return;
    }

    console.log('User is signed in, starting sync');
    setIsSyncing(true);
    try {
      const result = await syncToConvex();
      
      Alert.alert(
        'Sync Complete',
        `Pushed: ${result.seriesStats.pushed + result.sermonStats.pushed}, Pulled: ${result.seriesStats.pulled + result.sermonStats.pulled}`
      );
      
      if (result.conflicts?.length > 0) {
        Alert.alert(
          'Conflicts Detected',
          `${result.conflicts.length} conflicts require manual resolution`
        );
      }
      
      // Refresh status
      if (status) {
        setStatus({ ...status, syncInProgress: false });
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Failed', error.message || 'Unable to sync at this time. Please try again later.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuthSuccess = async () => {
    // Auto-trigger sync after successful login
    await handleManualSync();
  };

  if (isLoading || !status) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Loading sync status...</Text>
      </View>
    );
  }

  const getOverallStatus = () => {
    if (!status.isOnline) return { text: 'Working Offline', color: '#9E9E9E' };
    if (!status.isAuthenticatedOnline) return { text: 'Local Storage Only', color: '#FF9800' };
    if (status.conflictsCount > 0) return { text: 'Sync Conflicts', color: '#F44336' };
    if (status.pendingOperationsCount > 0) return { text: 'Changes Pending', color: '#FFC107' };
    if (status.syncInProgress) return { text: 'Syncing...', color: '#2196F3' };
    return { text: 'All Synced', color: '#4CAF50' };
  };

  const overallStatus = getOverallStatus();

  return (
    <View style={[styles.container, style]}>
      {/* Main Status Header */}
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: overallStatus.color }]} />
          <Text style={[styles.statusText, { color: overallStatus.color }]}>
            {overallStatus.text}
          </Text>
        </View>
        
        <OfflineStatusIndicator showDetails={false} />
      </View>

      {/* Conflict Notification */}
      {hasConflicts && (
        <ConflictNotification 
          onOpenResolution={() => setShowConflictModal(true)}
        />
      )}

      {/* Detailed Status Components */}
      {showFullDetails && (
        <View style={styles.detailsContainer}>
          <SyncStatusIndicator 
            showDetails={true}
            onConflictsPress={() => setShowConflictModal(true)}
            style={styles.syncIndicator}
          />
          
          {status.pendingOperationsCount > 0 && (
            <PendingSyncIndicator 
              compact={false}
              maxVisible={3}
              style={styles.pendingIndicator}
            />
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {!status.isAuthenticatedOnline && status.isOnline && (
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={handleConnectAccount}
          >
            <Text style={styles.connectButtonText}>Connect Account</Text>
          </TouchableOpacity>
        )}
        
        {(isSignedIn || status.isAuthenticatedOnline) && status.isOnline && (
          <TouchableOpacity 
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            <Text style={styles.syncButtonText}>
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        )}
        
        {status.conflictsCount > 0 && (
          <TouchableOpacity 
            style={styles.conflictsButton}
            onPress={onConflictsPress}
          >
            <Text style={styles.conflictsButtonText}>
              Resolve {status.conflictsCount} Conflicts
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Messages */}
      <View style={styles.messagesContainer}>
        {!status.isOnline && (
          <Text style={styles.offlineMessage}>
            You&apos;re working offline. Changes will sync when you&apos;re back online.
          </Text>
        )}
        
        {status.isOnline && !status.isAuthenticatedOnline && (
          <Text style={styles.localMessage}>
            Your data is stored locally. Connect an account to sync across devices.
          </Text>
        )}
        
        {status.isOnline && status.isAuthenticatedOnline && status.pendingOperationsCount === 0 && (
          <Text style={styles.syncedMessage}>
            All your changes are synced and up to date.
          </Text>
        )}
      </View>
      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        visible={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onResolved={() => {
          loadConflicts();
          setShowConflictModal(false);
        }}
      />
      
      {/* Clerk Sign-In Modal */}
      <ClerkSignInModal
        visible={showClerkSignIn}
        onClose={() => setShowClerkSignIn(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  syncIndicator: {
    marginBottom: 8,
  },
  pendingIndicator: {
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  syncButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  conflictsButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  conflictsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  offlineMessage: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  localMessage: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  syncedMessage: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SyncStatusDashboard;