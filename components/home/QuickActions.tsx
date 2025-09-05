import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';

export interface QuickActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  gradient?: string[];
}

const actionColors = [
  { bg: '#667eea', icon: '#ffffff' }, // Purple-blue
  { bg: '#764ba2', icon: '#ffffff' }, // Purple
  { bg: '#f093fb', icon: '#ffffff' }, // Pink
  { bg: '#4facfe', icon: '#ffffff' }, // Blue
  { bg: '#43e97b', icon: '#ffffff' }, // Green
];

export function QuickActions({ actions, style }: { actions: QuickActionItem[]; style?: ViewStyle }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, idx) => {
          const colorScheme = actionColors[idx % actionColors.length];
          return (
            <Pressable
              key={idx}
              style={({ pressed }) => [
                styles.actionItem,
                { backgroundColor: colorScheme.bg },
                pressed && styles.actionItemPressed
              ]}
              onPress={action.onPress}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={action.icon}
                  size={24}
                  color={colorScheme.icon}
                />
              </View>
              <Text style={[styles.actionLabel, { color: colorScheme.icon }]}>
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    fontSize: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionItem: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionItemPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  iconContainer: {
    marginBottom: theme.spacing.sm,
    padding: 8,
  },
  actionLabel: {
    ...theme.typography.body2,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 16,
  },
});

