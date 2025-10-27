import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { isAuthenticatedOnline } from '../../services/authSession';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'sermon' | 'series';
  entityTitle?: string;
  timestamp: string;
  retryCount: number;
}

interface PendingSyncIndicatorProps {
  style?: any;
  maxVisible?: number;
  onViewAll?: () => void;
  compact?: boolean;
}

export const PendingSyncIndicator: React.FC<PendingSyncIndicatorProps> = ({
  style,
  maxVisible = 3,
  onViewAll,
  compact = false
}) => {
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPendingOperations = async () => {
      try {
        // Check authentication status
        const authStatus = await isAuthenticatedOnline();
        if (mounted) {
          setIsAuthenticated(authStatus);
        }

        // Load pending operations from storage
        if (Platform.OS === 'web') {
          // Web implementation using localStorage
          const operations = await loadWebPendingOperations();
          if (mounted) {
            setPendingOperations(operations);
          }
        } else {
          // Native implementation using AsyncStorage
          const operations = await loadNativePendingOperations();
          if (mounted) {
            setPendingOperations(operations);
          }
        }
      } catch (error) {
        console.error('Failed to load pending operations:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPendingOperations();

    // Refresh every 30 seconds
    const interval = setInterval(loadPendingOperations, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const loadWebPendingOperations = async (): Promise<PendingOperation[]> => {
    try {
      const { getCurrentUserId } = await import('../../services/authSession');
      const userId = await getCurrentUserId();
      
      const syncStateKey = `sync.state:${userId}`;
      const stored = localStorage.getItem(syncStateKey);
      
      if (!stored) return [];
      
      const syncState = JSON.parse(stored);
      const operations: PendingOperation[] = [];
      
      // Add series operations
      if (syncState.pendingOperations?.series) {
        syncState.pendingOperations.series.forEach((op: any) => {
          operations.push({
            ...op,
            entityType: 'series',
            entityTitle: op.data?.title || `Series ${op.id.substring(0, 8)}`
          });
        });
      }
      
      // Add sermon operations
      if (syncState.pendingOperations?.sermons) {
        syncState.pendingOperations.sermons.forEach((op: any) => {
          operations.push({
            ...op,
            entityType: 'sermon',
            entityTitle: op.data?.title || `Sermon ${op.id.substring(0, 8)}`
          });
        });
      }
      
      // Sort by timestamp (newest first)
      return operations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to load web pending operations:', error);
      return [];
    }
  };

  const loadNativePendingOperations = async (): Promise<PendingOperation[]> => {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const { getCurrentUserId } = await import('../../services/authSession');
      
      const userId = await getCurrentUserId();
      const syncStateKey = `sync.state:${userId}`;
      const stored = await AsyncStorage.default.getItem(syncStateKey);
      
      if (!stored) return [];
      
      const syncState = JSON.parse(stored);
      const operations: PendingOperation[] = [];
      
      // Add series operations
      if (syncState.pendingOperations?.series) {
        syncState.pendingOperations.series.forEach((op: any) => {
          operations.push({
            ...op,
            entityType: 'series',
            entityTitle: op.data?.title || `Series ${op.id.substring(0, 8)}`
          });
        });
      }
      
      // Add sermon operations
      if (syncState.pendingOperations?.sermons) {
        syncState.pendingOperations.sermons.forEach((op: any) => {
          operations.push({
            ...op,
            entityType: 'sermon',
            entityTitle: op.data?.title || `Sermon ${op.id.substring(0, 8)}`
          });
        });
      }
      
      // Sort by timestamp (newest first)
      return operations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to load native pending operations:', error);
      return [];
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'create': return '+';
      case 'update': return '✎';
      case 'delete': return '×';
      default: return '•';
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'create': return '#4CAF50';
      case 'update': return '#2196F3';
      case 'delete': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Loading sync status...</Text>
      </View>
    );
  }

  if (pendingOperations.length === 0) {
    return null; // Don't show anything if no pending operations
  }

  const visibleOperations = pendingOperations.slice(0, maxVisible);
  const hasMore = pendingOperations.length > maxVisible;

  if (compact) {
    return (
      <View style={[styles.container, styles.compactContainer, style]}>
        <View style={styles.compactIndicator}>
          <Text style={styles.compactCount}>{pendingOperations.length}</Text>
        </View>
        <Text style={styles.compactText}>
          {pendingOperations.length === 1 ? 'change pending' : 'changes pending'}
        </Text>
        {!isAuthenticated && (
          <Text style={styles.compactAuthText}>(local only)</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Pending Changes ({pendingOperations.length})
        </Text>
        {!isAuthenticated && (
          <Text style={styles.authWarning}>Local Only</Text>
        )}
      </View>
      
      <ScrollView style={styles.operationsList} showsVerticalScrollIndicator={false}>
        {visibleOperations.map((operation, index) => (
          <View key={`${operation.id}-${operation.timestamp}`} style={styles.operationItem}>
            <View style={[styles.operationIcon, { backgroundColor: getOperationColor(operation.type) }]}>
              <Text style={styles.operationIconText}>{getOperationIcon(operation.type)}</Text>
            </View>
            
            <View style={styles.operationDetails}>
              <Text style={styles.operationTitle} numberOfLines={1}>
                {operation.entityTitle}
              </Text>
              <Text style={styles.operationMeta}>
                {operation.type} {operation.entityType} • {formatTimestamp(operation.timestamp)}
                {operation.retryCount > 0 && ` • ${operation.retryCount} retries`}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      {hasMore && onViewAll && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>
            View all {pendingOperations.length} changes
          </Text>
        </TouchableOpacity>
      )}
      
      {!isAuthenticated && (
        <View style={styles.syncPrompt}>
          <Text style={styles.syncPromptText}>
            Connect account to sync these changes across devices
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  compactIndicator: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  compactCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  compactText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  compactAuthText: {
    fontSize: 10,
    color: '#9E9E9E',
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  authWarning: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '500',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  operationsList: {
    maxHeight: 120,
  },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  operationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  operationIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  operationDetails: {
    flex: 1,
  },
  operationTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  operationMeta: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  viewAllButton: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  syncPrompt: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  syncPromptText: {
    fontSize: 11,
    color: '#1976D2',
    textAlign: 'center',
  },
});

export default PendingSyncIndicator;