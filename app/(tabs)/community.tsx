import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { theme } from '@/constants/Theme';
import authService from '@/services/expressAuthService';
import communityService, { CommunityPostDto } from '@/services/expressCommunityService';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const FILTER_TABS = [
  { key: 'all', label: 'All Posts', icon: 'albums' },
  { key: 'following', label: 'Following', icon: 'people' },
  { key: 'popular', label: 'Popular', icon: 'trending-up' },
  { key: 'recent', label: 'Recent', icon: 'time' },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      // Ensure current user has a profile so their posts show author info
      await authService.ensureProfileExists();
      console.log('Loading community posts...');
      const data = await communityService.getAllPosts();
      console.log('Loaded community posts:', data.length);
      setPosts(data);
    } catch (error) {
      console.error('Error loading community posts:', error);
      // Still set an empty array so the UI shows the empty state
      setPosts([]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadPosts();
      setLoading(false);
    };
    initializeData();
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const filteredPosts = posts.filter(post => {
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handlePostPress = (post: CommunityPostDto) => {
    router.push(`/community/${post.id}`);
  };

  const handleLike = async (post: CommunityPostDto) => {
    try {
      const isLiked = await communityService.togglePostLike(post.id);
      // Update the local state
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                isLiked,
                likesCount: isLiked ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 0) - 1)
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = (post: CommunityPostDto) => {
    router.push({ pathname: `/community/${post.id}`, params: { focus: 'comments' } });
  };

  const handleShare = (post: CommunityPostDto) => {
    console.log('Share post:', post.title);
    // Share functionality - could implement native sharing
  };

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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleSection}>
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>
          Connect with fellow pastors and share insights
        </Text>
      </View>
      <Button
        title="New Post"
        onPress={() => router.push('/community/create')}
        variant="primary"
        size="sm"
        icon={<Ionicons name="add" size={16} color={theme.colors.white} />}
      />
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={theme.colors.gray500} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search discussions, topics, people..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.gray500} />
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tabs}>
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={
                  activeTab === tab.key
                    ? theme.colors.primary
                    : theme.colors.gray600
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderPost = ({ item }: { item: CommunityPostDto }) => (
    <Card style={styles.postCard} onPress={() => handlePostPress(item)}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={theme.colors.gray600} />
          </View>
          <View style={styles.authorDetails}>
            <View style={styles.authorNameContainer}>
              <Text style={styles.authorName}>{item.author?.fullName || 'Unknown Author'}</Text>
            </View>
            <Text style={styles.authorMeta}>
              {item.author?.title || 'Pastor'} • {item.author?.church || 'Church'}
            </Text>
            <Text style={styles.postTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <Pressable style={styles.optionsButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.gray600} />
        </Pressable>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postText} numberOfLines={4}>
          {item.content}
        </Text>
      </View>

      {item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
          )}
        </View>
      )}

      <View style={styles.postActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleLike(item)}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={item.isLiked ? theme.colors.error : theme.colors.gray600}
          />
          <Text style={styles.actionText}>{item.likesCount || 0}</Text>
        </Pressable>
        
        <Pressable
          style={styles.actionButton}
          onPress={() => handleComment(item)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.gray600} />
          <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
        </Pressable>
        
        <Pressable
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Ionicons name="share-outline" size={20} color={theme.colors.gray600} />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
        
        <View style={styles.spacer} />
        
        <Pressable style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color={theme.colors.gray600} />
        </Pressable>
      </View>
    </Card>
  );

  const topPadding = Math.max(insets.top || 0, theme.spacing.md);
  const bottomPadding = Math.max(insets.bottom || 0, theme.spacing.md);

  if (loading) {
    return (
      <FadeInView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        <View style={styles.loadingScreen}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
        </View>
      </FadeInView>
    );
  }

  return (
    <FadeInView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        >
          {renderHeader()}
          {renderSearchBar()}
          {renderTabs()}
          
          <View style={styles.postsSection}>
            <FlatList
              data={filteredPosts}
              keyExtractor={(item) => item.id}
              renderItem={renderPost}
              scrollEnabled={false}
              contentContainerStyle={styles.postsList}
              ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
            />
          </View>
          
          {filteredPosts.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.colors.gray400} />
              <Text style={styles.emptyTitle}>No discussions found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.trim()
                  ? 'Try adjusting your search terms'
                  : 'Be the first to start a conversation'}
              </Text>
              {!searchQuery.trim() && (
                <Button
                  title="Start Discussion"
                  onPress={() => router.push('/community/create')}
                  variant="primary"
                  style={{ marginTop: theme.spacing.md }}
                />
              )}
            </View>
          )}
        </ScrollView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  titleSection: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
  },
  tabsContainer: {
    marginBottom: theme.spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tabActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  tabText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  postsSection: {
    marginBottom: theme.spacing.xxl,
  },
  postsList: {
    paddingBottom: theme.spacing.xl,
  },
  postCard: {
    backgroundColor: theme.colors.surface,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  authorInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorDetails: {
    flex: 1,
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 2,
  },
  authorName: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  authorMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  postTime: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  optionsButton: {
    padding: theme.spacing.xs,
  },
  postContent: {
    marginBottom: theme.spacing.md,
  },
  postTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  postText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '500',
  },
  moreTagsText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.md,
  },
  actionText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
