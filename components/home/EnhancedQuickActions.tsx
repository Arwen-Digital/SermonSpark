import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';

export interface EnhancedQuickActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  badge?: number | string;
  isHighlighted?: boolean;
}

interface EnhancedQuickActionsProps {
  actions: EnhancedQuickActionItem[];
  style?: ViewStyle;
  title?: string;
}

export const EnhancedQuickActions: React.FC<EnhancedQuickActionsProps> = ({
  actions,
  style,
  title = "Quick Actions"
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <Pressable
            key={index}
            style={[
              styles.actionItem,
              action.isHighlighted && styles.actionItemHighlighted
            ]}
            onPress={action.onPress}
          >
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: action.color
                      ? action.color + '15'
                      : theme.colors.primary + '15'
                  }
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={action.color || theme.colors.primary}
                />
              </View>
              {action.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {typeof action.badge === 'number' && action.badge > 99
                      ? '99+'
                      : action.badge.toString()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.actionLabel} numberOfLines={2}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

// Helper function to get contextual actions based on time and data
export const getContextualActions = (
  dayOfWeek: number,
  hasDrafts: boolean,
  hasUpcomingSermons: boolean
): EnhancedQuickActionItem[] => {
  const baseActions: EnhancedQuickActionItem[] = [
    {
      icon: 'add-circle-outline',
      label: 'Create Sermon',
      onPress: () => {},
      color: theme.colors.primary
    },
    {
      icon: 'document-text-outline',
      label: 'My Sermons',
      onPress: () => {},
      color: '#10B981'
    },
    {
      icon: 'search',
      label: 'Research',
      onPress: () => {},
      color: '#8B5CF6'
    },
    {
      icon: 'albums-outline',
      label: 'Series',
      onPress: () => {},
      color: '#F59E0B'
    },
    {
      icon: 'people-outline',
      label: 'Community',
      onPress: () => {},
      color: '#EF4444'
    }
  ];

  // Sunday (0) - Post-service day
  if (dayOfWeek === 0) {
    baseActions[0] = {
      icon: 'checkmark-circle-outline',
      label: 'Reflect & Plan',
      onPress: () => {},
      color: '#10B981',
      isHighlighted: true
    };
  }

  // Wednesday (3) - Mid-week prep
  if (dayOfWeek === 3) {
    baseActions[0] = {
      icon: 'create-outline',
      label: 'Sermon Prep',
      onPress: () => {},
      color: theme.colors.primary,
      isHighlighted: true
    };
  }

  // Saturday (6) - Final preparations
  if (dayOfWeek === 6) {
    baseActions[0] = {
      icon: 'eye-outline',
      label: 'Review Sermon',
      onPress: () => {},
      color: '#F59E0B',
      isHighlighted: true
    };
  }

  // Add badges for drafts and upcoming sermons
  if (hasDrafts) {
    const sermonIndex = baseActions.findIndex(a => a.label.includes('Sermon'));
    if (sermonIndex !== -1) {
      baseActions[sermonIndex] = {
        ...baseActions[sermonIndex],
        badge: 'Draft'
      };
    }
  }

  return baseActions.slice(0, 6); // Limit to 6 actions for clean 2x3 grid
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray100,
    elevation: 2,
  },
  actionItemHighlighted: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  actionLabel: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
});