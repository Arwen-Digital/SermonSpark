import { AuthScreen } from '@/components/auth/AuthScreen';
import { theme } from '@/constants/Theme';
import { syncToConvex } from '@/services/sync/convexSyncHandler';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthPage() {
  const insets = useSafeAreaInsets();
  
  const handleAuthenticated = async () => {
    // Trigger sync after successful login
    try {
      console.log('User authenticated, triggering sync...');
      const result = await syncToConvex();
      
      if (result.success) {
        console.log('Sync completed after login');
      } else {
        console.warn('Sync had issues:', result);
      }
    } catch (error: any) {
      console.error('Failed to sync after login:', error);
      // Don't block navigation, just log the error
    }
    
    // Navigate back to where user came from or home
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = () => {
    // Allow user to continue without connecting account
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with skip option */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, theme.spacing.md) }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Connect Account</Text>
        <Pressable onPress={handleSkip} style={styles.skipTextButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Benefits section */}
      <View style={styles.benefitsSection}>
        
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="sync" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>Sync across all your devices</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="people" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>Join the pastor community</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="bulb" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>AI-powered research tools</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="cloud-upload" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>Secure cloud backup</Text>
          </View>
        </View>
      </View>

      {/* Auth form */}
      <View style={styles.authContainer}>
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  skipButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  skipTextButton: {
    padding: theme.spacing.xs,
  },
  skipText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  benefitsSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  benefitsTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  benefitsSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  benefitsList: {
    gap: theme.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  benefitText: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  authContainer: {
    flex: 1,
  },
});
