import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import { Card } from '@/components/common/Card';
import { SermonDto } from '@/services/expressSermonService';

interface SermonProgressItem {
  sermon: SermonDto;
  daysUntil?: number;
  progress: number;
}

interface WorkInProgressSectionProps {
  drafts: SermonDto[];
  upcoming: SermonDto[];
  onSermonPress: (sermon: SermonDto) => void;
  onViewAll?: () => void;
}

const SermonTimelineCard: React.FC<{
  sermon: SermonDto;
  daysUntil?: number;
  progress: number;
  isUpcoming?: boolean;
  onPress: () => void;
}> = ({ sermon, daysUntil, progress, isUpcoming = false, onPress }) => {
  const getStatusColor = () => {
    if (isUpcoming) {
      if (daysUntil !== undefined) {
        if (daysUntil <= 1) return '#EF4444'; // Red - urgent
        if (daysUntil <= 3) return '#F59E0B'; // Orange - soon
        return '#10B981'; // Green - plenty of time
      }
    }
    return theme.colors.primary; // Draft
  };

  const getStatusIcon = () => {
    if (isUpcoming) {
      if (daysUntil !== undefined) {
        if (daysUntil <= 1) return 'flash';
        if (daysUntil <= 3) return 'time';
        return 'calendar';
      }
    }
    return 'create';
  };

  const getStatusText = () => {
    if (isUpcoming && daysUntil !== undefined) {
      if (daysUntil === 0) return 'Today';
      if (daysUntil === 1) return 'Tomorrow';
      return `${daysUntil} days`;
    }
    return sermon.status === 'draft' ? 'Draft' : 'In Progress';
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
            <Ionicons name={getStatusIcon() as any} size={16} color={theme.colors.white} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.sermonTitle} numberOfLines={2}>
              {sermon.title}
            </Text>
            <View style={styles.timelineInfo}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
              {sermon.date && (
                <>
                  <View style={styles.dot} />
                  <Text style={styles.dateText}>
                    {new Date(sermon.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
        
        {progress > 0 && (
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: getStatusColor()
                }
              ]} 
            />
          </View>
        )}
      </Card>
    </Pressable>
  );
};

export const WorkInProgressSection: React.FC<WorkInProgressSectionProps> = ({
  drafts,
  upcoming,
  onSermonPress,
  onViewAll
}) => {
  // Combine and sort all work items
  const workItems: SermonProgressItem[] = [
    // Add drafts
    ...drafts.map(sermon => ({
      sermon,
      progress: sermon.content ? Math.min(90, (sermon.content.length / 1000) * 100) : 10
    })),
    // Add upcoming sermons
    ...upcoming.map(sermon => {
      const daysUntil = sermon.date 
        ? Math.ceil((new Date(sermon.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : undefined;
      
      return {
        sermon,
        daysUntil,
        progress: sermon.status === 'ready' ? 100 : 
                 sermon.status === 'preparing' ? 75 : 
                 sermon.content ? 50 : 20
      };
    })
  ].sort((a, b) => {
    // Sort by urgency: upcoming sermons by date, then drafts
    if (a.daysUntil !== undefined && b.daysUntil !== undefined) {
      return a.daysUntil - b.daysUntil;
    }
    if (a.daysUntil !== undefined) return -1;
    if (b.daysUntil !== undefined) return 1;
    return 0;
  });

  if (workItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Work in Progress</Text>
        </View>
        <Card style={styles.emptyCard}>
          <Ionicons name="create-outline" size={48} color={theme.colors.gray400} />
          <Text style={styles.emptyTitle}>No work in progress</Text>
          <Text style={styles.emptySubtitle}>
            Start a new sermon or schedule an upcoming one
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Work in Progress</Text>
        {workItems.length > 3 && (
          <Pressable onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineContainer}
      >
        {workItems.slice(0, 3).map((item, index) => (
          <SermonTimelineCard
            key={item.sermon.id}
            sermon={item.sermon}
            daysUntil={item.daysUntil}
            progress={item.progress}
            isUpcoming={item.daysUntil !== undefined}
            onPress={() => onSermonPress(item.sermon)}
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
  timelineContainer: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
  timelineCard: {
    width: 280,
    padding: theme.spacing.md,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  sermonTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  timelineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray400,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.gray200,
    borderRadius: 2,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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