import React from 'react';
import { Modal, SafeAreaView, StyleSheet, View, Text, Pressable } from 'react-native';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConnectAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({
  visible,
  onClose,
  onAuthenticated
}) => {
  const insets = useSafeAreaInsets();

  const handleAuthenticated = () => {
    onAuthenticated();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header with close and skip options */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, theme.spacing.md) }]}>
          <Pressable onPress={handleSkip} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Connect Account</Text>
          <Pressable onPress={handleSkip} style={styles.skipTextButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Benefits section */}
       

        {/* Auth form */}
        <View style={styles.authContainer}>
          <AuthScreen onAuthenticated={handleAuthenticated} />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
  closeButton: {
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