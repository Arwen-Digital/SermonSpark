import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { theme } from '@/constants/Theme';
import { router } from 'expo-router';

export default function AuthPage() {
  const handleAuthenticated = () => {
    // Navigate to main app
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AuthScreen onAuthenticated={handleAuthenticated} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
