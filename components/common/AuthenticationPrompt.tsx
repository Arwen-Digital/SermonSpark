import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/Theme';
import { Button } from './Button';
import { Card } from './Card';
import { FeatureType } from '../../services/featureGate';
import { router } from 'expo-router';

interface AuthenticationPromptProps {
  feature: FeatureType;
  onConnect?: () => void;
  onDismiss?: () => void;
  style?: any;
  variant?: 'inline' | 'card' | 'banner';
  showBenefits?: boolean;
}

const FEATURE_INFO: Record<FeatureType, {
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}> = {
  community: {
    title: 'Join the Community',
    description: 'Connect with other preachers to share sermons and get feedback.',
    icon: 'people',
    benefits: [
      'Share your sermons with others',
      'Get feedback from experienced preachers',
      'Discover new sermon ideas and topics',
      'Build connections in ministry'
    ]
  },
  research: {
    title: 'AI Research Tools',
    description: 'Access AI-powered sermon research and title generation.',
    icon: 'bulb',
    benefits: [
      'Generate sermon titles with AI',
      'Get scripture research assistance',
      'Receive topic and theme suggestions',
      'Access content outline recommendations'
    ]
  },
  sync: {
    title: 'Device Sync',
    description: 'Keep your sermons synchronized across all devices.',
    icon: 'sync',
    benefits: [
      'Access sermons on any device',
      'Automatic backup and sync',
      'Work seamlessly across platforms',
      'Never lose your sermon data'
    ]
  },
  sermons: {
    title: 'Sermon Management',
    description: 'Full offline sermon creation and management.',
    icon: 'document-text',
    benefits: [
      'Create sermons offline',
      'Rich text editing',
      'Local storage and backup',
      'No internet required'
    ]
  },
  series: {
    title: 'Series Organization',
    description: 'Organize your sermons into series offline.',
    icon: 'library',
    benefits: [
      'Group sermons into series',
      'Track sermon progression',
      'Plan multi-week messages',
      'Complete offline functionality'
    ]
  }
};

export const AuthenticationPrompt: React.FC<AuthenticationPromptProps> = ({
  feature,
  onConnect,
  onDismiss,
  style,
  variant = 'card',
  showBenefits = true
}) => {
  const featureInfo = FEATURE_INFO[feature];

  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    } else {
      onConnect();
    }
  };

  const renderInlinePrompt = () => (
    <View style={[styles.inlineContainer, style]}>
      <View style={styles.inlineContent}>
        <Ionicons 
          name={featureInfo.icon as any} 
          size={20} 
          color={theme.colors.premium} 
        />
        <View style={styles.inlineText}>
          <Text style={styles.inlineTitle}>{featureInfo.title}</Text>
          <Text style={styles.inlineDescription}>{featureInfo.description}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.inlineButton} onPress={handleConnect}>
        <Text style={styles.inlineButtonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBannerPrompt = () => (
    <View style={[styles.bannerContainer, style]}>
      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      )}
      
      <View style={styles.bannerContent}>
        <Ionicons 
          name={featureInfo.icon as any} 
          size={24} 
          color={theme.colors.premium} 
        />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>{featureInfo.title}</Text>
          <Text style={styles.bannerDescription}>{featureInfo.description}</Text>
        </View>
        <Button
          title="Connect"
          onPress={handleConnect}
          variant="premium"
          size="small"
          style={styles.bannerButton}
        />
      </View>
    </View>
  );

  const renderCardPrompt = () => (
    <Card style={[styles.cardContainer, style]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={featureInfo.icon as any} 
            size={32} 
            color={theme.colors.premium} 
          />
        </View>
        <Text style={styles.cardTitle}>{featureInfo.title}</Text>
        <Text style={styles.cardDescription}>{featureInfo.description}</Text>
      </View>

      {showBenefits && (
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>What you'll get:</Text>
          {featureInfo.benefits.map((benefit, index) => (
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
      )}

      <View style={styles.cardActions}>
        <Button
          title="Connect Account"
          onPress={handleConnect}
          variant="premium"
          icon="log-in"
          style={styles.connectButton}
        />
        {onDismiss && (
          <Button
            title="Maybe Later"
            onPress={onDismiss}
            variant="ghost"
            style={styles.dismissButtonCard}
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          Your offline data will be preserved and synced when you connect.
        </Text>
      </View>
    </Card>
  );

  switch (variant) {
    case 'inline':
      return renderInlinePrompt();
    case 'banner':
      return renderBannerPrompt();
    case 'card':
    default:
      return renderCardPrompt();
  }
};

const styles = StyleSheet.create({
  // Inline variant styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.premium + '10',
    borderRadius: 8,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.premium + '30',
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inlineText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  inlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  inlineDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  inlineButton: {
    backgroundColor: theme.colors.premium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inlineButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Banner variant styles
  bannerContainer: {
    backgroundColor: theme.colors.premium + '15',
    borderRadius: 8,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.premium,
    position: 'relative',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  bannerDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  bannerButton: {
    minWidth: 80,
  },
  dismissButton: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    padding: theme.spacing.xs,
    zIndex: 1,
  },

  // Card variant styles
  cardContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
  cardTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight as any,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  benefitText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  cardActions: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  connectButton: {
    width: '100%',
  },
  dismissButtonCard: {
    width: '100%',
  },
  cardFooter: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    width: '100%',
  },
  footerText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AuthenticationPrompt;