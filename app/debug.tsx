import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import LocalDataDebugPanel from '../components/debug/LocalDataDebugPanel';

export default function DebugScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Debug Panel',
          headerStyle: { backgroundColor: '#f4511e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      <LocalDataDebugPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});