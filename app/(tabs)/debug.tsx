import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleResetPanel from '../../components/debug/SimpleResetPanel';

export default function DebugTab() {
  return (
    <View style={styles.container}>
      <SimpleResetPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});