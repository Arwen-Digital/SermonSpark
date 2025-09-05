import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import { HomeStats } from '@/utils/homeUtils';

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, onPress }) => (
  <Pressable 
    style={({ pressed }) => [
      styles.statCard, 
      onPress && styles.statCardPressable,
      pressed && styles.statCardPressed
    ]} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Pressable>
);

interface QuickStatsProps {
  stats: HomeStats;
  communityPosts?: number;
  onSermonsPress?: () => void;
  onDraftsPress?: () => void;
  onUpcomingPress?: () => void;
  onCommunityPress?: () => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  stats,
  communityPosts = 0,
  onSermonsPress,
  onDraftsPress,
  onUpcomingPress,
  onCommunityPress
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>At a Glance</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon="document-text"
          label="Total Sermons"
          value={stats.totalSermons}
          color="#6366f1"
          onPress={onSermonsPress}
        />
        <StatCard
          icon="create"
          label="Drafts"
          value={stats.draftSermons}
          color="#f59e0b"
          onPress={onDraftsPress}
        />
        <StatCard
          icon="calendar"
          label="Upcoming"
          value={stats.upcomingSermons}
          color="#10b981"
          onPress={onUpcomingPress}
        />
        <StatCard
          icon="people"
          label="Community"
          value={communityPosts}
          color="#8b5cf6"
          onPress={onCommunityPress}
        />
      </View>
    </View>
  );
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    marginBottom: theme.spacing.md,
    minHeight: 100,
    justifyContent: 'center',
  },
  statCardPressable: {
    transform: [{ scale: 1 }],
  },
  statCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '800',
    marginBottom: 4,
    fontSize: 28,
  },
  statLabel: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});