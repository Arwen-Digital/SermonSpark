import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SimpleResetPanel() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('Ready');

  const clearAsyncStorage = async () => {
    try {
      setLoading(true);
      setStatus('Clearing AsyncStorage...');
      
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
      setStatus(`Cleared ${keys.length} AsyncStorage keys`);
      
      Alert.alert(
        'Success', 
        'AsyncStorage cleared! Restart the app to see fresh state.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      setStatus('Error clearing AsyncStorage');
      Alert.alert('Error', 'Failed to clear AsyncStorage: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAsyncStorage = async () => {
    try {
      setLoading(true);
      setStatus('Checking AsyncStorage...');
      
      const keys = [
        'offline.currentUserId',
        'offline.anonymousUserId',
        'access_token',
        'refresh_token',
        'user',
        'sync.bidirectional.state',
      ];
      
      const values = await AsyncStorage.multiGet(keys);
      const existingKeys = values.filter(([key, value]) => value !== null);
      
      setStatus(`Found ${existingKeys.length} stored keys`);
      
      if (existingKeys.length > 0) {
        const keyList = existingKeys.map(([key]) => key).join(', ');
        Alert.alert(
          'AsyncStorage Status',
          `Found ${existingKeys.length} keys:\n${keyList}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('AsyncStorage Status', 'No data found - app is in fresh state!');
      }
      
    } catch (error) {
      console.error('Error checking AsyncStorage:', error);
      setStatus('Error checking AsyncStorage');
      Alert.alert('Error', 'Failed to check AsyncStorage: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAnonymousUser = async () => {
    try {
      setLoading(true);
      setStatus('Generating anonymous user...');
      
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      await AsyncStorage.setItem('offline.anonymousUserId', anonymousId);
      
      setStatus('Anonymous user generated');
      Alert.alert('Success', `Generated anonymous user: ${anonymousId}`);
      
    } catch (error) {
      console.error('Error generating anonymous user:', error);
      setStatus('Error generating anonymous user');
      Alert.alert('Error', 'Failed to generate anonymous user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simple Reset Panel</Text>
      <Text style={styles.subtitle}>Development Tool - Use with Caution</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.checkButton]} 
          onPress={checkAsyncStorage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Check Data Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.generateButton]} 
          onPress={generateAnonymousUser}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Generate Anonymous User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearAsyncStorage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What this does:</Text>
        <Text style={styles.infoText}>• Check Data Status: Shows what's currently stored</Text>
        <Text style={styles.infoText}>• Generate Anonymous User: Creates a new anonymous user ID</Text>
        <Text style={styles.infoText}>• Clear All Data: Removes all AsyncStorage data (simulates fresh install)</Text>
        
        <Text style={styles.warningText}>
          ⚠️ Warning: "Clear All Data" will delete all local user data including authentication tokens and sync state. Use only for testing!
        </Text>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
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
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#007AFF',
    flex: 1,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkButton: {
    backgroundColor: '#007AFF',
  },
  generateButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
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
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 10,
    fontStyle: 'italic',
  },
  loadingContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});