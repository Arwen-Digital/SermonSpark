
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import resetLocalData from '../../services/resetLocalData';

export default function LocalDataDebugPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const dataStatus = await resetLocalData.getDataStatus();
      setStatus(dataStatus);
    } catch (error) {
      Alert.alert('Error', 'Failed to get data status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete ALL local data including series, sermons, and authentication. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await resetLocalData.resetAllLocalData();
              if (result.success) {
                Alert.alert('Success', 'All local data has been reset');
                refreshStatus();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetAuth = async () => {
    setLoading(true);
    try {
      const result = await resetLocalData.resetAuthenticationData();
      if (result.success) {
        Alert.alert('Success', 'Authentication data has been reset');
        refreshStatus();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSync = async () => {
    setLoading(true);
    try {
      const result = await resetLocalData.resetSyncState();
      if (result.success) {
        Alert.alert('Success', 'Sync state has been reset');
        refreshStatus();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Local Data Debug Panel</Text>
      
      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Database Status</Text>
          <Text>Series: {status.database?.series || 0}</Text>
          <Text>Sermons: {status.database?.sermons || 0}</Text>
          <Text>Dirty Series: {status.database?.dirtySeries || 0}</Text>
          <Text>Dirty Sermons: {status.database?.dirtySermons || 0}</Text>
          <Text>Pending Sync Ops: {status.database?.pendingSyncOps || 0}</Text>
          <Text>Pending Conflicts: {status.database?.pendingConflicts || 0}</Text>
          
          <Text style={styles.sectionTitle}>Authentication Status</Text>
          <Text>Has User ID: {status.authentication?.hasUserId ? 'Yes' : 'No'}</Text>
          <Text>Has Anonymous ID: {status.authentication?.hasAnonymousId ? 'Yes' : 'No'}</Text>
          <Text>Has Sync State: {status.authentication?.hasSyncState ? 'Yes' : 'No'}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={refreshStatus}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]} 
          onPress={handleResetSync}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Reset Sync State</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]} 
          onPress={handleResetAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Reset Authentication</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={handleResetAll}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <Text style={styles.loading}>Processing...</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
