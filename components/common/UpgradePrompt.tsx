import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/Theme';
import { Button } from './Button';
import { Card } from './Card';
import { FeatureType, UpgradePrompt as UpgradePromptType } from '../../services/featureGate';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onConnect: () => void;
  prompt: UpgradePromptType;
}

const FEATURE_ICONS: Record<FeatureType, string> = {
  community: 'people',
  research: 'bulb',
  sync: 'sync',
  sermons: 'document-text',
  series: 'library',
};

const FEATURE_DESCRIPTIONS: Record<FeatureType, string> = {
  community: 'Connect with other preachers, share sermons, and get feedback from the community.',
  research: 'Access AI-powered sermon research tools, title generation, and content suggestions.',
  sync: 'Keep your sermons and series synchronized across all your devices automatically.',
  sermons: 'Create and manage your sermons with full offline support.',
  series: 'Organize your sermons into series with complete offline functionality.',
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  onConnect,
  prompt,
}) => {
  const featureIcon = FEATURE_ICONS[prompt.feature];
  const featureDescription = FEATURE_DESCRIPTIONS[prompt.feature];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Card style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={featureIcon as any} 
                  size={32} 
                  color={theme.colors.premium} 
                />
              </View>
              <Text style={styles.title}>{prompt.title}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.message}>{prompt.message}</Text>
              <Text style={styles.description}>{featureDescription}</Text>
              
              {/* Benefits list */}
              <View style={styles.benefitsList}>
                {getBenefitsForFeature(prompt.feature).map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={16} 
                      color={theme.colors.success} 
                    />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title={prompt.actionText}
                onPress={onConnect}
                variant="premium"
                style={styles.connectButton}
                icon="log-in"
              />
              <Button
                title="Maybe Later"
                onPress={onClose}
                variant="ghost"
                style={styles.laterButton}
              />
            </View>

            {/* Footer note */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Your offline data will be preserved and synced when you connect your account.
              </Text>
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
};

// Helper function to get benefits for each feature
function getBenefitsForFeature(feature: FeatureType): string[] {
  switch (feature) {
    case 'community':
      return [
        'Share sermons with other preachers',
        'Get feedback and suggestions',
        'Discover new sermon ideas',
        'Build connections with ministry leaders',
      ];
    case 'research':
      return [
        'AI-powered sermon title generation',
        'Scripture research assistance',
        'Topic and theme suggestions',
        'Content outline recommendations',
      ];
    case 'sync':
      return [
        'Access sermons on all devices',
        'Automatic backup and sync',
        'Work seamlessly across platforms',
        'Never lose your sermon data',
      ];
    case 'sermons':
      return [
        'Full offline sermon creation',
        'Rich text editing capabilities',
        'Local storage and backup',
        'No internet required',
      ];
    case 'series':
      return [
        'Organize sermons into series',
        'Track sermon progression',
        'Plan multi-week messages',
        'Complete offline functionality',
      ];
    default:
      return [];
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    padding: 0,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    position: 'relative',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.premium + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight as any,
    lineHeight: theme.typography.h4.lineHeight,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  description: {
    ...theme.typography.body2,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  benefitsList: {
    gap: theme.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  benefitText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  actions: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  connectButton: {
    width: '100%',
  },
  laterButton: {
    width: '100%',
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingTop: 0,
  },
  footerText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight as any,
    lineHeight: 16,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});