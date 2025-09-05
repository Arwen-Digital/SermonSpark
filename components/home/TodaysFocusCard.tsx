import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient'; // Removed for now
import { theme } from '@/constants/Theme';
import { Card } from '@/components/common/Card';

interface TodaysFocusCardProps {
  title: string;
  subtitle: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  onPress: () => void;
  progress?: number; // 0-100 for progress indicator
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  title,
  subtitle,
  action,
  priority,
  onPress,
  progress
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Orange
      case 'low':
        return '#10B981'; // Green
      default:
        return theme.colors.primary;
    }
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case 'high':
        return 'flash';
      case 'medium':
        return 'time';
      case 'low':
        return 'leaf';
      default:
        return 'checkmark-circle';
    }
  };

  return (
    <Card style={styles.container}>
      <View 
        style={[
          styles.gradient, 
          { backgroundColor: getPriorityColor() }
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <View style={styles.priorityIndicator}>
                <Ionicons 
                  name={getPriorityIcon() as any} 
                  size={16} 
                  color={theme.colors.white} 
                />
              </View>
              <Text style={styles.focusLabel}>Today's Focus</Text>
            </View>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
          </View>

          {progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}% complete</Text>
            </View>
          )}

          <Pressable style={styles.actionButton} onPress={onPress}>
            <Text style={styles.actionText}>{action}</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.colors.white} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  gradient: {
    padding: theme.spacing.lg,
    minHeight: 140,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  priorityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusLabel: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h5,
    color: theme.colors.white,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    lineHeight: 24,
  },
  subtitle: {
    ...theme.typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 2,
  },
  progressText: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    ...theme.typography.body1,
    color: theme.colors.white,
    fontWeight: '600',
  },
});