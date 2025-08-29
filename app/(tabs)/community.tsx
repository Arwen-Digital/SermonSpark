import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, Text, FlatList, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { theme } from '@/constants/Theme';
import { CommunityPost, User } from '@/types';

// Mock community data
const mockUsers: Record<string, User> = {
  '1': {
    id: '1',
    name: 'Pastor Michael',
    email: 'michael@church.com',
    avatar: '',
    title: 'Lead Pastor',
    church: 'Grace Community Church',
    bio: 'Passionate about expository preaching and discipleship',
    isPremium: true,
    joinedDate: new Date('2023-01-15'),
  },
  '2': {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@ministry.com',
    avatar: '',
    title: 'Youth Pastor',
    church: 'City Life Church',
    bio: 'Reaching the next generation for Christ',
    isPremium: true,
    joinedDate: new Date('2023-06-10'),
  },
  '3': {
    id: '3',
    name: 'Rev. David Kim',
    email: 'david@faithchurch.org',
    avatar: '',
    title: 'Senior Pastor',
    church: 'Faith Baptist Church',
    bio: '20+ years in ministry, love teaching God\'s Word',
    isPremium: true,
    joinedDate: new Date('2022-11-03'),
  },
};

const mockPosts: CommunityPost[] = [
  {
    id: '1',
    authorId: '1',
    author: mockUsers['1'],
    title: 'Effective Illustrations for Grace',
    content: 'I\'ve been preparing a sermon series on grace and looking for powerful illustrations that really connect with people. Has anyone come across stories or examples that have been particularly impactful? I\'m specifically looking for modern-day examples that show unmerited favor...',
    tags: ['Grace', 'Illustrations', 'Stories'],
    likes: 24,
    comments: 8,
    shares: 3,
    isLiked: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    visibility: 'community',
  },
  {
    id: '2',
    authorId: '2',
    author: mockUsers['2'],
    title: 'Youth Ministry Sermon Ideas',
    content: 'Hey everyone! I\'m working on a series for our youth group about identity in Christ. Looking for creative ways to engage teenagers with this topic. Any sermon outlines or interactive elements you\'ve used successfully?',
    tags: ['Youth Ministry', 'Identity', 'Engagement'],
    likes: 18,
    comments: 12,
    shares: 5,
    isLiked: true,
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
    visibility: 'community',
  },
  {
    id: '3',
    authorId: '3',
    author: mockUsers['3'],
    title: 'Preaching Through Difficult Passages',
    content: 'As pastors, we sometimes face challenging texts that our congregation might find difficult to understand or accept. How do you approach preaching through passages that deal with hard topics like suffering, judgment, or difficult Old Testament narratives? Looking for wisdom from fellow preachers.',
    tags: ['Difficult Passages', 'Wisdom', 'Preaching'],
    likes: 35,
    comments: 15,
    shares: 8,
    isLiked: true,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    visibility: 'community',
  },
  {
    id: '4',
    authorId: '1',
    author: mockUsers['1'],
    title: 'Prayer Before Preaching',
    content: 'I wanted to share something that has transformed my preaching preparation. I\'ve started spending at least 30 minutes in prayer before I even open my Bible to study. It has changed everything about how I approach the text and connect with God\'s heart for the message.',
    tags: ['Prayer', 'Preparation', 'Testimony'],
    likes: 42,
    comments: 20,
    shares: 12,
    isLiked: false,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
    visibility: 'community',
  },
];

const FILTER_TABS = [
  { key: 'all', label: 'All Posts', icon: 'albums' },
  { key: 'following', label: 'Following', icon: 'people' },
  { key: 'popular', label: 'Popular', icon: 'trending-up' },
  { key: 'recent', label: 'Recent', icon: 'time' },
];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts] = useState<CommunityPost[]>(mockPosts);

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

  const handlePostPress = (post: CommunityPost) => {
    console.log('Opening post:', post.title);
    // Navigate to post detail
  };

  const handleLike = (post: CommunityPost) => {
    console.log('Toggle like for post:', post.title);
    // Toggle like functionality
  };

  const handleComment = (post: CommunityPost) => {
    console.log('Comment on post:', post.title);
    // Navigate to comments
  };

  const handleShare = (post: CommunityPost) => {
    console.log('Share post:', post.title);
    // Share functionality
  };

  const formatTimeAgo = (date: Date) => {
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
        onPress={() => console.log('Create new post')}
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

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <Card style={styles.postCard} onPress={() => handlePostPress(item)}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={theme.colors.gray600} />
          </View>
          <View style={styles.authorDetails}>
            <View style={styles.authorNameContainer}>
              <Text style={styles.authorName}>{item.author.name}</Text>
            </View>
            <Text style={styles.authorMeta}>
              {item.author.title} • {item.author.church}
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
          <Text style={styles.actionText}>{item.likes}</Text>
        </Pressable>
        
        <Pressable
          style={styles.actionButton}
          onPress={() => handleComment(item)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.gray600} />
          <Text style={styles.actionText}>{item.comments}</Text>
        </Pressable>
        
        <Pressable
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Ionicons name="share-outline" size={20} color={theme.colors.gray600} />
          <Text style={styles.actionText}>{item.shares}</Text>
        </Pressable>
        
        <View style={styles.spacer} />
        
        <Pressable style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color={theme.colors.gray600} />
        </Pressable>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
        
        {filteredPosts.length === 0 && (
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
                onPress={() => console.log('Create first post')}
                variant="primary"
                style={{ marginTop: theme.spacing.md }}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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