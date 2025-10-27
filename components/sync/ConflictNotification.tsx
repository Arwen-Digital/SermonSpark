// Simple notification component for sync conflicts
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useConflictResolution } from '../../hooks/useConflictResolution';

interface ConflictNotificationProps {
  onOpenResolution?: () => void;
  style?: any;
}

export const ConflictNotification: React.FC<ConflictNotificationProps> = ({
  onOpenResolution,
  style,
}) => {
  const { conflicts, hasConflicts, autoResolveSimpleConflicts } = useConflictResolution();

  if (!hasConflicts || Platform.OS === 'web') {
    return null;
  }

  const simpleConflicts = conflicts.filter(c => c.conflictFields.length <= 2);
  const complexConflicts = conflicts.filter(c => c.conflictFields.length > 2);

  const handleAutoResolve = async () => {
    try {
      const resolved = await autoResolveSimpleConflicts();
      if (resolved > 0) {
        console.log(`Auto-resolved ${resolved} simple conflicts`);
      }
    } catch (error) {
      console.error('Auto-resolve failed:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {conflicts.length} Sync Conflict{conflicts.length > 1 ? 's' : ''}
        </Text>
        <Text style={styles.subtitle}>
          {simpleConflicts.length > 0 && `${simpleConflicts.length} can be auto-resolved`}
          {complexConflicts.length > 0 && simpleConflicts.length > 0 && ', '}
          {complexConflicts.length > 0 && `${complexConflicts.length} need manual review`}
        </Text>
      </View>

      <View style={styles.actions}>
        {simpleConflicts.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.autoResolveButton]}
            onPress={handleAutoResolve}
          >
            <Text style={styles.buttonText}>Auto-Fix</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.reviewButton]}
          onPress={onOpenResolution}
        >
          <Text style={styles.buttonText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#856404',
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  autoResolveButton: {
    backgroundColor: '#28a745',
  },
  reviewButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConflictNotification;