import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalFirstTest } from '../../hooks/useLocalFirstTest';

export default function LocalFirstTestPanel() {
  const { 
    status, 
    refreshStatus, 
    createAnonymousUser, 
    clearAllData, 
    simulateFreshInstall 
  } = useLocalFirstTest();

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL local data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data cleared!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleSimulateFreshInstall = async () => {
    try {
      await simulateFreshInstall();
      Alert.alert('Success', 'Fresh install simulated! App is now in initial state with anonymous user.');
    } catch (error) {
      Alert.alert('Error', 'Failed to simulate fresh install: ' + error.message);
    }
  };

  const handleCreateAnonymousUser = async () => {
    try {
      const anonymousId = await createAnonymousUser();
      Alert.alert('Success', `Created anonymous user: ${anonymousId}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create anonymous user: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Local-First Test Panel</Text>
      
      {status.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {status.error}</Text>
        </View>
      )}
      
      <View style={styles.statusContainer}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Current User ID:</Text>
          <Text style={styles.statusValue}>
            {status.currentUserId || 'None'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Anonymous User ID:</Text>
          <Text style={styles.statusValue}>
            {status.anonymousUserId || 'None'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Offline Auth:</Text>
          <Text style={[styles.statusValue, status.isOfflineAuth ? styles.successText : styles.errorText]}>
            {status.isOfflineAuth ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Has Stored Data:</Text>
          <Text style={[styles.statusValue, status.hasStoredData ? styles.successText : styles.warningText]}>
            {status.hasStoredData ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={refreshStatus}
          disabled={status.loading}
        >
          <Text style={styles.buttonText}>
            {status.loading ? 'Loading...' : 'Refresh Status'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.createButton]} 
          onPress={handleCreateAnonymousUser}
          disabled={status.loading}
        >
          <Text style={styles.buttonText}>Create Anonymous User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.simulateButton]} 
          onPress={handleSimulateFreshInstall}
          disabled={status.loading}
        >
          <Text style={styles.buttonText}>Simulate Fresh Install</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={handleClearData}
          disabled={status.loading}
        >
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Testing Guide:</Text>
        <Text style={styles.infoText}>1. Fresh Install: Clears all data and creates anonymous user</Text>
        <Text style={styles.infoText}>2. Create Anonymous User: Generates new anonymous ID</Text>
        <Text style={styles.infoText}>3. Clear All Data: Removes everything (for testing)</Text>
        <Text style={styles.infoText}>4. Refresh Status: Updates the current state display</Text>
        
        <Text style={styles.warningText}>
          💡 Expected behavior: Fresh app should have anonymous user ID and offline auth = Yes
        </Text>
      </View>
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
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
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
    marginBottom: 15,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  successText: {
    color: '#4caf50',
  },
  warningText: {
    color: '#ff9800',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#2196f3',
  },
  createButton: {
    backgroundColor: '#4caf50',
  },
  simulateButton: {
    backgroundColor: '#ff9800',
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});