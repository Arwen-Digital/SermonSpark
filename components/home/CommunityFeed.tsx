import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import { Card } from '@/components/common/Card';
import { CommunityPostDto } from '@/services/supabaseCommunityService';

interface CommunityFeedProps {
  posts: CommunityPostDto[];
  onPostPress: (post: CommunityPostDto) => void;
  onViewAll?: () => void;
  onCreatePost?: () => void;
}

const CommunityPostCard: React.FC<{
  post: CommunityPostDto;
  onPress: () => void;
}> = ({ post, onPress }) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={16} color={theme.colors.gray600} />
            </View>
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>
                {post.author?.fullName || 'Anonymous'}
              </Text>
              <Text style={styles.authorMeta}>
                {post.author?.title || 'Pastor'} • {formatTimeAgo(post.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.postTitle} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.postContent} numberOfLines={3}>
          {post.content}
        </Text>

        {post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {post.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{post.tags.length - 2}</Text>
            )}
          </View>
        )}

        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color={theme.colors.gray500} />
            <Text style={styles.statText}>{post.likesCount || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color={theme.colors.gray500} />
            <Text style={styles.statText}>{post.commentsCount || 0}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  posts,
  onPostPress,
  onViewAll,
  onCreatePost
}) => {
  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Activity</Text>
          <Pressable onPress={onCreatePost} style={styles.createButton}>
            <Ionicons name="add" size={16} color={theme.colors.primary} />
            <Text style={styles.createText}>Post</Text>
          </Pressable>
        </View>
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={48} color={theme.colors.gray400} />
          <Text style={styles.emptyTitle}>No community activity yet</Text>
          <Text style={styles.emptySubtitle}>
            Connect with fellow pastors and share insights
          </Text>
          {onCreatePost && (
            <Pressable style={styles.emptyActionButton} onPress={onCreatePost}>
              <Text style={styles.emptyActionText}>Start a Discussion</Text>
            </Pressable>
          )}
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Community Activity</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={onCreatePost} style={styles.createButton}>
            <Ionicons name="add" size={16} color={theme.colors.primary} />
            <Text style={styles.createText}>Post</Text>
          </Pressable>
          {posts.length > 2 && onViewAll && (
            <Pressable onPress={onViewAll} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      >
        {posts.slice(0, 3).map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            onPress={() => onPostPress(post)}
          />
        ))}
      </ScrollView>

      {posts.length > 0 && (
        <View style={styles.feedFooter}>
          <Text style={styles.feedFooterText}>
            Join the conversation with {posts.length} recent posts
          </Text>
        </View>
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  createText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
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
  feedContainer: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
  postCard: {
    width: 260,
    padding: theme.spacing.md,
  },
  postHeader: {
    marginBottom: theme.spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  authorMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  postTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  postContent: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: theme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
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
  postStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  feedFooter: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  feedFooterText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
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
    marginBottom: theme.spacing.md,
  },
  emptyActionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  emptyActionText: {
    ...theme.typography.body2,
    color: theme.colors.white,
    fontWeight: '600',
  },
});