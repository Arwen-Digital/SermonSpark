import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import {
  getPendingConflicts,
  resolveConflictManually,
} from '../../services/sync/syncService';
import { 
  DataConflict, 
  ConflictResolution,
  resolveSeriesConflict,
  resolveSermonConflict,
  mergeSeriesRecords,
  mergeSermonRecords,
} from '../../services/conflictResolution';

// Use DataConflict from conflictResolution service
type ConflictData = DataConflict & {
  entityId: string;
  resolved: boolean;
};

interface ConflictResolutionModalProps {
  visible: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  onClose,
  onResolved,
}) => {
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergedData, setMergedData] = useState<any>(null);
  const [autoResolveEnabled, setAutoResolveEnabled] = useState(true);

  useEffect(() => {
    if (visible) {
      loadConflicts();
    }
  }, [visible]);

  const loadConflicts = async () => {
    if (Platform.OS === 'web' || !getPendingConflicts) {
      return; // Web platform doesn't support conflict resolution yet
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
  };

  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'keep_local' | 'keep_remote' | 'merge',
    mergedData?: any
  ) => {
    if (Platform.OS === 'web' || !resolveConflictManually) {
      return;
    }

    try {
      setIsLoading(true);
      await resolveConflictManually(conflictId, resolution, mergedData);
      
      // Remove resolved conflict from list
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      setSelectedConflict(null);
      setMergeMode(false);
      setMergedData(null);
      
      if (onResolved) {
        onResolved();
      }
      
      Alert.alert('Success', 'Conflict resolved successfully');
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      Alert.alert('Error', 'Failed to resolve conflict');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoResolveConflicts = async () => {
    if (!autoResolveEnabled || conflicts.length === 0) return;

    try {
      setIsLoading(true);
      let resolvedCount = 0;

      for (const conflict of conflicts) {
        // Only auto-resolve simple conflicts (timestamp-based)
        if (conflict.conflictFields.length <= 2) {
          let resolution: ConflictResolution<any>;
          
          if (conflict.type === 'series') {
            resolution = resolveSeriesConflict(
              conflict.localRecord,
              conflict.remoteRecord,
              'newest_wins'
            );
          } else {
            resolution = resolveSermonConflict(
              conflict.localRecord,
              conflict.remoteRecord,
              'newest_wins'
            );
          }

          await resolveConflictManually(
            conflict.id,
            resolution.resolution,
            resolution.resolvedRecord
          );
          resolvedCount++;
        }
      }

      // Reload conflicts to show remaining ones
      await loadConflicts();
      
      if (resolvedCount > 0) {
        Alert.alert('Success', `Auto-resolved ${resolvedCount} simple conflicts`);
        if (onResolved) {
          onResolved();
        }
      }
    } catch (error) {
      console.error('Auto-resolve failed:', error);
      Alert.alert('Error', 'Failed to auto-resolve conflicts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMerge = () => {
    if (!selectedConflict) return;

    let mergeResult;
    if (selectedConflict.type === 'series') {
      mergeResult = mergeSeriesRecords(
        selectedConflict.localRecord,
        selectedConflict.remoteRecord
      );
    } else {
      mergeResult = mergeSermonRecords(
        selectedConflict.localRecord,
        selectedConflict.remoteRecord
      );
    }

    setMergedData(mergeResult.mergedRecord);
    setMergeMode(true);
  };

  const handleMergeFieldChange = (field: string, value: any) => {
    setMergedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderConflictList = () => (
    <ScrollView style={styles.conflictList}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>Pending Conflicts ({conflicts.length})</Text>
        {conflicts.length > 0 && (
          <TouchableOpacity
            style={styles.autoResolveButton}
            onPress={handleAutoResolveConflicts}
            disabled={isLoading || !autoResolveEnabled}
          >
            <Text style={styles.autoResolveButtonText}>Auto-Resolve Simple</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {conflicts.map((conflict) => {
        const isSimple = conflict.conflictFields.length <= 2;
        return (
          <TouchableOpacity
            key={conflict.id}
            style={[
              styles.conflictItem,
              isSimple && styles.simpleConflictItem
            ]}
            onPress={() => setSelectedConflict(conflict)}
          >
            <View style={styles.conflictHeader}>
              <Text style={styles.conflictTitle}>
                {conflict.type.toUpperCase()}: {conflict.entityId}
              </Text>
              {isSimple && (
                <Text style={styles.simpleLabel}>Simple</Text>
              )}
            </View>
            <Text style={styles.conflictSubtitle}>
              Fields: {conflict.conflictFields.join(', ')}
            </Text>
            <Text style={styles.conflictTimestamp}>
              {formatTimestamp(conflict.timestamp)}
            </Text>
          </TouchableOpacity>
        );
      })}
      {conflicts.length === 0 && !isLoading && (
        <Text style={styles.noConflicts}>No pending conflicts</Text>
      )}
    </ScrollView>
  );

  const renderConflictDetails = () => {
    if (!selectedConflict) return null;

    return (
      <ScrollView style={styles.conflictDetails}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConflict(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailsTitle}>
            {selectedConflict.entityType.toUpperCase()}: {selectedConflict.entityId}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Conflicting Fields:</Text>
        {selectedConflict.conflictFields.map((field) => (
          <View key={field} style={styles.fieldComparison}>
            <Text style={styles.fieldName}>{field}:</Text>
            
            <View style={styles.valueComparison}>
              <View style={styles.valueContainer}>
                <Text style={styles.valueLabel}>Local (Your Device)</Text>
                <Text style={styles.valueText}>
                  {formatFieldValue(selectedConflict.localRecord[field])}
                </Text>
              </View>
              
              <View style={styles.valueContainer}>
                <Text style={styles.valueLabel}>Remote (Server)</Text>
                <Text style={styles.valueText}>
                  {formatFieldValue(selectedConflict.remoteRecord[field])}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.resolutionButtons}>
          <TouchableOpacity
            style={[styles.resolutionButton, styles.keepLocalButton]}
            onPress={() => handleResolveConflict(selectedConflict.id, 'keep_local')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Keep Local</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.resolutionButton, styles.keepRemoteButton]}
            onPress={() => handleResolveConflict(selectedConflict.id, 'keep_remote')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Keep Remote</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.resolutionButton, styles.mergeButton]}
            onPress={handleStartMerge}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Smart Merge</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderMergeInterface = () => {
    if (!selectedConflict || !mergedData) return null;

    return (
      <ScrollView style={styles.mergeInterface}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setMergeMode(false);
              setMergedData(null);
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailsTitle}>
            Merge {selectedConflict.type.toUpperCase()}: {selectedConflict.entityId}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Edit Merged Data:</Text>
        
        {selectedConflict.conflictFields.map((field) => (
          <View key={field} style={styles.mergeField}>
            <Text style={styles.fieldName}>{field}:</Text>
            
            <View style={styles.mergeOptions}>
              <TouchableOpacity
                style={[styles.mergeOption, styles.localOption]}
                onPress={() => handleMergeFieldChange(field, selectedConflict.localRecord[field])}
              >
                <Text style={styles.mergeOptionLabel}>Use Local</Text>
                <Text style={styles.mergeOptionValue}>
                  {formatFieldValue(selectedConflict.localRecord[field])}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.mergeOption, styles.remoteOption]}
                onPress={() => handleMergeFieldChange(field, selectedConflict.remoteRecord[field])}
              >
                <Text style={styles.mergeOptionLabel}>Use Remote</Text>
                <Text style={styles.mergeOptionValue}>
                  {formatFieldValue(selectedConflict.remoteRecord[field])}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.mergeInput}
              value={formatFieldValue(mergedData[field])}
              onChangeText={(value) => handleMergeFieldChange(field, value)}
              multiline={typeof mergedData[field] === 'string' && mergedData[field].length > 50}
              placeholder={`Enter ${field}...`}
            />
          </View>
        ))}

        <View style={styles.mergeActions}>
          <TouchableOpacity
            style={[styles.resolutionButton, styles.cancelMergeButton]}
            onPress={() => {
              setMergeMode(false);
              setMergedData(null);
            }}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.resolutionButton, styles.saveMergeButton]}
            onPress={() => handleResolveConflict(selectedConflict.id, 'merge', mergedData)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Save Merge</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Conflict Resolution</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.webNotSupported}>
            <Text style={styles.webNotSupportedText}>
              Conflict resolution is not yet supported on web platform.
              Please use the mobile app to resolve sync conflicts.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Conflict Resolution</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading && (
          <View style={styles.loading}>
            <Text>Loading conflicts...</Text>
          </View>
        )}
        
        {!isLoading && (
          mergeMode ? renderMergeInterface() :
          selectedConflict ? renderConflictDetails() : 
          renderConflictList()
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conflictList: {
    flex: 1,
    padding: 16,
  },
  conflictItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff8b94',
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conflictSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  conflictTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  noConflicts: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
  conflictDetails: {
    flex: 1,
    padding: 16,
  },
  detailsHeader: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  fieldComparison: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  valueComparison: {
    flexDirection: 'row',
    gap: 12,
  },
  valueContainer: {
    flex: 1,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#333',
  },
  resolutionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  resolutionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  keepLocalButton: {
    backgroundColor: '#4ecdc4',
  },
  keepRemoteButton: {
    backgroundColor: '#45b7d1',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  webNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webNotSupportedText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  autoResolveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  autoResolveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  simpleConflictItem: {
    borderLeftColor: '#28a745',
  },
  simpleLabel: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    backgroundColor: '#d4edda',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mergeButton: {
    backgroundColor: '#6f42c1',
  },
  mergeInterface: {
    flex: 1,
    padding: 16,
  },
  mergeField: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  mergeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  mergeOption: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  localOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  remoteOption: {
    backgroundColor: '#f3e5f5',
    borderColor: '#9c27b0',
  },
  mergeOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  mergeOptionValue: {
    fontSize: 14,
    color: '#333',
  },
  mergeInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginTop: 8,
    minHeight: 40,
  },
  mergeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  cancelMergeButton: {
    backgroundColor: '#6c757d',
  },
  saveMergeButton: {
    backgroundColor: '#28a745',
  },
});

export default ConflictResolutionModal;