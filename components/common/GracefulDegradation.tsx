import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/Theme';
import { Button } from './Button';
import { Card } from './Card';
import { FeatureType } from '../../services/featureGate';

interface GracefulDegradationProps {
  feature: FeatureType;
  reason: 'offline' | 'auth_required' | 'unavailable';
  onAction?: () => void;
  actionText?: string;
  style?: any;
  variant?: 'minimal' | 'informative' | 'detailed';
  showAlternatives?: boolean;
}

const DEGRADATION_INFO: Record<FeatureType, {
  title: string;
  offlineMessage: string;
  authMessage: string;
  unavailableMessage: string;
  alternatives: string[];
  icon: string;
}> = {
  community: {
    title: 'Community Features',
    offlineMessage: 'Community features require an internet connection. Your posts will be available when you\'re back online.',
    authMessage: 'Connect your account to share sermons and interact with the community.',
    unavailableMessage: 'Community features are temporarily unavailable. Please try again later.',
    alternatives: [
      'Continue working on sermons offline',
      'Prepare content to share later',
      'Review your existing sermons'
    ],
    icon: 'people'
  },
  research: {
    title: 'AI Research Tools',
    offlineMessage: 'AI research tools require an internet connection. Use your existing resources for now.',
    authMessage: 'Connect your account to access AI-powered sermon research and title generation.',
    unavailableMessage: 'AI research tools are temporarily unavailable. Please try again later.',
    alternatives: [
      'Use traditional research methods',
      'Review your sermon notes',
      'Brainstorm topics manually'
    ],
    icon: 'bulb'
  },
  sync: {
    title: 'Device Sync',
    offlineMessage: 'Sync will resume automatically when you\'re back online. Your changes are saved locally.',
    authMessage: 'Connect your account to sync your sermons across devices.',
    unavailableMessage: 'Sync is temporarily unavailable. Your data is safe locally.',
    alternatives: [
      'Continue working offline',
      'Export your data manually',
      'Use local backup features'
    ],
    icon: 'sync'
  },
  sermons: {
    title: 'Sermon Management',
    offlineMessage: 'Sermon features work fully offline. All your changes are saved locally.',
    authMessage: 'Sermon management works offline. Connect an account to sync across devices.',
    unavailableMessage: 'Sermon features are temporarily unavailable.',
    alternatives: [
      'Use basic text editor',
      'Write in notes app',
      'Use voice recordings'
    ],
    icon: 'document-text'
  },
  series: {
    title: 'Series Management',
    offlineMessage: 'Series features work fully offline. All your changes are saved locally.',
    authMessage: 'Series management works offline. Connect an account to sync across devices.',
    unavailableMessage: 'Series features are temporarily unavailable.',
    alternatives: [
      'Organize manually in notes',
      'Use simple lists',
      'Plan on paper'
    ],
    icon: 'library'
  }
};

export const GracefulDegradation: React.FC<GracefulDegradationProps> = ({
  feature,
  reason,
  onAction,
  actionText,
  style,
  variant = 'informative',
  showAlternatives = true
}) => {
  const info = DEGRADATION_INFO[feature];

  const getMessage = () => {
    switch (reason) {
      case 'offline':
        return info.offlineMessage;
      case 'auth_required':
        return info.authMessage;
      case 'unavailable':
        return info.unavailableMessage;
      default:
        return info.unavailableMessage;
    }
  };

  const getStatusColor = () => {
    switch (reason) {
      case 'offline':
        return '#9E9E9E'; // Gray
      case 'auth_required':
        return '#FF9800'; // Orange
      case 'unavailable':
        return '#F44336'; // Red
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = () => {
    switch (reason) {
      case 'offline':
        return 'cloud-offline';
      case 'auth_required':
        return 'lock-closed';
      case 'unavailable':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getDefaultActionText = () => {
    switch (reason) {
      case 'offline':
        return 'Check Connection';
      case 'auth_required':
        return 'Connect Account';
      case 'unavailable':
        return 'Try Again';
      default:
        return 'Retry';
    }
  };

  if (variant === 'minimal') {
    return (
      <View style={[styles.minimalContainer, style]}>
        <Ionicons 
          name={getStatusIcon() as any} 
          size={16} 
          color={getStatusColor()} 
        />
        <Text style={[styles.minimalText, { color: getStatusColor() }]}>
          {reason === 'offline' ? 'Offline' : reason === 'auth_required' ? 'Account Required' : 'Unavailable'}
        </Text>
      </View>
    );
  }

  if (variant === 'informative') {
    return (
      <View style={[styles.informativeContainer, { borderLeftColor: getStatusColor() }, style]}>
        <View style={styles.informativeHeader}>
          <Ionicons 
            name={getStatusIcon() as any} 
            size={20} 
            color={getStatusColor()} 
          />
          <Text style={styles.informativeTitle}>{info.title}</Text>
        </View>
        <Text style={styles.informativeMessage}>{getMessage()}</Text>
        {onAction && (
          <TouchableOpacity 
            style={[styles.informativeAction, { backgroundColor: getStatusColor() + '20' }]}
            onPress={onAction}
          >
            <Text style={[styles.informativeActionText, { color: getStatusColor() }]}>
              {actionText || getDefaultActionText()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Detailed variant
  return (
    <Card style={[styles.detailedContainer, style]}>
      <View style={styles.detailedHeader}>
        <View style={[styles.detailedIconContainer, { backgroundColor: getStatusColor() + '20' }]}>
          <Ionicons 
            name={info.icon as any} 
            size={32} 
            color={getStatusColor()} 
          />
        </View>
        <Text style={styles.detailedTitle}>{info.title}</Text>
        <View style={styles.statusBadge}>
          <Ionicons 
            name={getStatusIcon() as any} 
            size={14} 
            color={getStatusColor()} 
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {reason === 'offline' ? 'Offline' : reason === 'auth_required' ? 'Account Required' : 'Unavailable'}
          </Text>
        </View>
      </View>

      <Text style={styles.detailedMessage}>{getMessage()}</Text>

      {showAlternatives && info.alternatives.length > 0 && (
        <View style={styles.alternativesContainer}>
          <Text style={styles.alternativesTitle}>What you can do instead:</Text>
          {info.alternatives.map((alternative, index) => (
            <View key={index} style={styles.alternativeItem}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={16} 
                color={theme.colors.textSecondary} 
              />
              <Text style={styles.alternativeText}>{alternative}</Text>
            </View>
          ))}
        </View>
      )}

      {onAction && (
        <View style={styles.detailedActions}>
          <Button
            title={actionText || getDefaultActionText()}
            onPress={onAction}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  // Minimal variant
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  minimalText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Informative variant
  informativeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
  },
  informativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  informativeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  informativeMessage: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  informativeAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  informativeActionText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Detailed variant
  detailedContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  detailedHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  detailedIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  detailedTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '600' as any,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailedMessage: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  alternativesContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
  },
  alternativeText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  detailedActions: {
    width: '100%',
  },
  actionButton: {
    width: '100%',
    borderColor: '#9E9E9E',
  },
});

export default GracefulDegradation;