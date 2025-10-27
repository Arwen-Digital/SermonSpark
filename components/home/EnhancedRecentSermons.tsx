import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import { Card } from '@/components/common/Card';
import type { SermonDTO } from '@/services/repositories/types';

interface EnhancedRecentSermonsProps {
  sermons: SermonDto[];
  onSermonPress: (sermon: SermonDto) => void;
  onViewAll?: () => void;
}

const SermonStatusBadge: React.FC<{ status: SermonDto['status'] }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return {
          icon: 'create' as const,
          color: '#6B7280',
          bgColor: '#F3F4F6',
          label: 'Draft'
        };
      case 'preparing':
        return {
          icon: 'time' as const,
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          label: 'Preparing'
        };
      case 'ready':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10B981',
          bgColor: '#D1FAE5',
          label: 'Ready'
        };
      case 'delivered':
        return {
          icon: 'megaphone' as const,
          color: '#8B5CF6',
          bgColor: '#EDE9FE',
          label: 'Delivered'
        };
      case 'archived':
        return {
          icon: 'archive' as const,
          color: '#6B7280',
          bgColor: '#F3F4F6',
          label: 'Archived'
        };
      default:
        return {
          icon: 'document' as const,
          color: '#6B7280',
          bgColor: '#F3F4F6',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const RecentSermonCard: React.FC<{
  sermon: SermonDto;
  onPress: () => void;
  showActions?: boolean;
}> = ({ sermon, onPress, showActions = true }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: new Date(dateString).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getWordCount = () => {
    if (!sermon.content) return 0;
    return sermon.content.trim().split(/\s+/).filter(Boolean).length;
  };

  const getReadingTime = () => {
    const words = getWordCount();
    return Math.ceil(words / 150) || 1; // ~150 words per minute
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.sermonCard}>
        <View style={styles.cardHeader}>
          <SermonStatusBadge status={sermon.status} />
          {sermon.date && (
            <Text style={styles.dateText}>
              {formatDate(sermon.date)}
            </Text>
          )}
        </View>

        <Text style={styles.sermonTitle} numberOfLines={2}>
          {sermon.title}
        </Text>

        {sermon.scripture && (
          <Text style={styles.scriptureText} numberOfLines={1}>
            📖 {sermon.scripture}
          </Text>
        )}

        <View style={styles.sermonMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={14} color={theme.colors.gray500} />
            <Text style={styles.metaText}>{getWordCount()} words</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={theme.colors.gray500} />
            <Text style={styles.metaText}>{getReadingTime()} min read</Text>
          </View>
        </View>

        {sermon.tags && sermon.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {sermon.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {sermon.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{sermon.tags.length - 2}</Text>
            )}
          </View>
        )}

        {showActions && (
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={onPress}>
              <Ionicons name="eye-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.actionText}>View</Text>
            </Pressable>
            {sermon.status === 'draft' || sermon.status === 'preparing' ? (
              <Pressable style={styles.actionButton}>
                <Ionicons name="create-outline" size={16} color={theme.colors.success} />
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>
            ) : sermon.status === 'ready' ? (
              <Pressable style={styles.actionButton}>
                <Ionicons name="podium-outline" size={16} color={theme.colors.warning} />
                <Text style={styles.actionText}>Pulpit</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </Card>
    </Pressable>
  );
};

export const EnhancedRecentSermons: React.FC<EnhancedRecentSermonsProps> = ({
  sermons,
  onSermonPress,
  onViewAll
}) => {
  if (sermons.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        <Card style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={48} color={theme.colors.gray400} />
          <Text style={styles.emptyTitle}>No recent activity</Text>
          <Text style={styles.emptySubtitle}>
            Your recent sermons and activity will appear here
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {sermons.length > 3 && onViewAll && (
          <Pressable onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sermonsContainer}
      >
        {sermons.slice(0, 4).map((sermon) => (
          <RecentSermonCard
            key={sermon.id}
            sermon={sermon}
            onPress={() => onSermonPress(sermon)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  viewAllText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  sermonsContainer: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
  sermonCard: {
    width: 240,
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  sermonTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  scriptureText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
  sermonMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  moreTagsText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray100,
  },
  actionText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    fontSize: 11,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});