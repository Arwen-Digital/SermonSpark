import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/Theme';
import { Sermon } from '../../types';
import { Card } from '../common/Card';

interface SermonCardProps {
  sermon: Sermon;
  onPress: () => void;
  onFavorite: () => void;
  onOptions: () => void;
  onPulpit?: () => void;
  variant?: 'grid' | 'list';
}

export const SermonCard: React.FC<SermonCardProps> = ({
  sermon,
  onPress,
  onFavorite,
  onOptions,
  onPulpit,
  variant = 'grid',
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatReadingTime = (minutes: number) => {
    return `${minutes} min read`;
  };

  if (variant === 'list') {
    return (
      <Card onPress={onPress} variant="outlined" style={styles.listCard}>
        <View style={styles.listHeader}>
          <View style={styles.listTitleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {sermon.title}
            </Text>
            {sermon.scripture && (
              <Text style={styles.scripture} numberOfLines={1}>
                {sermon.scripture}
              </Text>
            )}
          </View>
          <View style={styles.actions}>
            <Pressable onPress={onFavorite} style={styles.actionButton}>
              <Ionicons
                name={sermon.isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={sermon.isFavorite ? theme.colors.error : theme.colors.gray600}
              />
            </Pressable>
            <Pressable onPress={onOptions} style={styles.actionButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.gray600} />
            </Pressable>
          </View>
        </View>
        <View style={styles.listMeta}>
          <Text style={styles.metaText}>{formatDate(sermon.date)}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{sermon.wordCount} words</Text>
          <Text style={styles.metaText}>•</Text>
          {/* <Text style={styles.metaText}>{formatReadingTime(sermon.readingTime)}</Text> */}
        </View>
        {sermon.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {sermon.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {sermon.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{sermon.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </Card>
    );
  }

  return (
    <Card onPress={onPress} style={styles.gridCard}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {sermon.title}
          </Text>
          {sermon.series && (
            <View style={styles.seriesIndicator}>
              <Text style={styles.seriesText}>SERIES</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onFavorite} style={styles.actionButton}>
            <Ionicons
              name={sermon.isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={sermon.isFavorite ? theme.colors.error : theme.colors.gray500}
            />
          </Pressable>
        </View>
      </View>

      {sermon.scripture && (
        <View style={styles.scriptureContainer}>
          <Ionicons name="book" size={16} color={theme.colors.primary} />
          <Text style={styles.scripture} numberOfLines={1}>
            {sermon.scripture}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.preview} numberOfLines={3}>
          {sermon.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatDate(sermon.date)}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{formatReadingTime(sermon.readingTime)}</Text>
        </View>
        <View style={styles.footerActions}>
          {onPulpit && (
            <Pressable onPress={onPulpit} style={styles.pulpitButton}>
              <Ionicons name="tv" size={16} color={theme.colors.primary} />
            </Pressable>
          )}
          {sermon.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {sermon.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    margin: theme.spacing.xs,
    minHeight: 180,
  },
  listCard: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  titleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  listTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  seriesIndicator: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  seriesText: {
    ...theme.typography.overline,
    color: theme.colors.black,
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  scriptureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  scripture: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  content: {
    flex: 1,
    marginBottom: theme.spacing.sm,
  },
  preview: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pulpitButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: theme.colors.gray200,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  moreTagsText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
});