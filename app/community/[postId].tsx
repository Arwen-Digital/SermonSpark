import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { theme } from '@/constants/Theme';
import { Comment, CommunityPost, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Mock data - in real app this would come from API
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
  '4': {
    id: '4',
    name: 'Pastor Jennifer',
    email: 'jennifer@newlife.org',
    avatar: '',
    title: 'Associate Pastor',
    church: 'New Life Fellowship',
    bio: 'Passionate about worship and community',
    isPremium: false,
    joinedDate: new Date('2023-09-20'),
  },
  '5': {
    id: '5',
    name: 'Rev. Thomas',
    email: 'thomas@riverside.church',
    avatar: '',
    title: 'Senior Pastor',
    church: 'Riverside Church',
    bio: 'Building bridges through biblical teaching',
    isPremium: true,
    joinedDate: new Date('2023-03-12'),
  },
};

const mockPosts: Record<string, CommunityPost> = {
  '1': {
    id: '1',
    authorId: '1',
    author: mockUsers['1'],
    title: 'Effective Illustrations for Grace',
    content: `I've been preparing a sermon series on grace and looking for powerful illustrations that really connect with people. Has anyone come across stories or examples that have been particularly impactful? 

I'm specifically looking for modern-day examples that show unmerited favor. I've used the typical parables and biblical examples, but I want something that will help my congregation see grace in everyday life.

One illustration I've been considering is about the parent who pays off their adult child's debt without them knowing, but I'm wondering if there are even more relatable examples.

What has worked well in your experience? Any resources or books you'd recommend for finding fresh illustrations on grace?

Thanks in advance for your wisdom!`,
    tags: ['Grace', 'Illustrations', 'Stories'],
    likes: 24,
    comments: 8,
    shares: 3,
    isLiked: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    visibility: 'community',
  },
};

const mockComments: Comment[] = [
  {
    id: '1',
    postId: '1',
    authorId: '2',
    author: mockUsers['2'],
    content: 'Great question! I recently used an illustration about a teacher who anonymously paid for students\' lunch debts. The kids had no idea who did it, but they got to eat. Really drove home the point of unmerited favor.',
    likes: 8,
    replies: [
      {
        id: '2',
        postId: '1',
        authorId: '1',
        author: mockUsers['1'],
        content: 'That\'s beautiful, Sarah! I love how it connects to their daily experience. Did you have any specific details that made it more impactful?',
        likes: 3,
        replies: [],
        createdAt: new Date('2024-01-20T14:30:00'),
        isLiked: false,
      },
      {
        id: '3',
        postId: '1',
        authorId: '4',
        author: mockUsers['4'],
        content: 'I used something similar with medical debt being forgiven. Same concept but hits different age groups.',
        likes: 5,
        replies: [],
        createdAt: new Date('2024-01-20T15:15:00'),
        isLiked: true,
      },
    ],
    createdAt: new Date('2024-01-20T13:45:00'),
    isLiked: true,
  },
  {
    id: '4',
    postId: '1',
    authorId: '3',
    author: mockUsers['3'],
    content: 'Check out "The Grace Stories" by Max Lucado. He has some incredible modern illustrations. Also, Tim Keller\'s sermons often have great grace illustrations that feel very contemporary.',
    likes: 12,
    replies: [
      {
        id: '5',
        postId: '1',
        authorId: '5',
        author: mockUsers['5'],
        content: 'Second the Keller recommendation. His "Prodigal God" has some amazing grace illustrations.',
        likes: 7,
        replies: [],
        createdAt: new Date('2024-01-20T16:20:00'),
        isLiked: false,
      },
    ],
    createdAt: new Date('2024-01-20T14:00:00'),
    isLiked: false,
  },
  {
    id: '6',
    postId: '1',
    authorId: '5',
    author: mockUsers['5'],
    content: 'Here\'s one I\'ve used: A parking meter that\'s expired, but someone else already put money in it. You get to park without paying the penalty. Simple but effective for showing how Christ paid our debt.',
    likes: 15,
    replies: [],
    createdAt: new Date('2024-01-20T15:30:00'),
    isLiked: true,
  },
];

export default function PostDetailPage() {
  const { postId } = useLocalSearchParams();
  const [post, setPost] = useState<CommunityPost | null>(mockPosts[postId as string] || null);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.gray400} />
          <Text style={styles.errorTitle}>Post not found</Text>
          <Text style={styles.errorSubtitle}>The post you're looking for doesn't exist or has been removed.</Text>
          <Button
            title="Back to Community"
            onPress={() => router.back()}
            variant="primary"
            style={{ marginTop: theme.spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleLike = () => {
    setPost(prev => prev ? {
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
    } : null);
  };

  const handleCommentLike = (commentId: string, isReply: boolean = false, parentId?: string) => {
    setComments(prev => 
      prev.map(comment => {
        if (comment.id === commentId && !isReply) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        if (isReply && comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId
                ? {
                    ...reply,
                    isLiked: !reply.isLiked,
                    likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                  }
                : reply
            ),
          };
        }
        return comment;
      })
    );
  };

  const handleShare = () => {
    console.log('Share post');
    // Implement share functionality
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const comment: Comment = {
        id: Date.now().toString(),
        postId: post.id,
        authorId: '1', // Current user
        author: mockUsers['1'],
        content: newComment.trim(),
        likes: 0,
        replies: [],
        createdAt: new Date(),
        isLiked: false,
      };

      if (replyingTo) {
        // Add as reply
        setComments(prev =>
          prev.map(c => 
            c.id === replyingTo
              ? { ...c, replies: [...c.replies, comment] }
              : c
          )
        );
      } else {
        // Add as new comment
        setComments(prev => [comment, ...prev]);
      }

      // Update post comment count
      setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null);
      
      setNewComment('');
      setReplyingTo(null);
      setShowCommentForm(false);
      setLoading(false);
    }, 500);
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

  const renderComment = ({ item, isReply = false, parentId }: { item: Comment; isReply?: boolean; parentId?: string }) => (
    <View style={[styles.commentContainer, isReply && styles.replyContainer]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthor}>
          <View style={styles.commentAvatar}>
            <Ionicons name="person" size={16} color={theme.colors.gray600} />
          </View>
          <View style={styles.commentAuthorDetails}>
            <Text style={styles.commentAuthorName}>{item.author.name}</Text>
            <Text style={styles.commentMeta}>
              {item.author.title} • {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.commentText}>{item.content}</Text>
      
      <View style={styles.commentActions}>
        <Pressable
          style={styles.commentActionButton}
          onPress={() => handleCommentLike(item.id, isReply, parentId)}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={item.isLiked ? theme.colors.error : theme.colors.gray600}
          />
          <Text style={styles.commentActionText}>{item.likes}</Text>
        </Pressable>
        
        {!isReply && (
          <Pressable
            style={styles.commentActionButton}
            onPress={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
          >
            <Ionicons name="chatbubble-outline" size={16} color={theme.colors.gray600} />
            <Text style={styles.commentActionText}>Reply</Text>
          </Pressable>
        )}
      </View>

      {/* Replies */}
      {item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map(reply => (
            <View key={reply.id}>
              {renderComment({ item: reply, isReply: true, parentId: item.id })}
            </View>
          ))}
        </View>
      )}

      {/* Reply Input */}
      {replyingTo === item.id && (
        <View style={styles.replyInput}>
          <TextInput
            style={styles.commentInput}
            placeholder={`Reply to ${item.author.name}...`}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            autoFocus
          />
          <View style={styles.replyActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setReplyingTo(null);
                setNewComment('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, !newComment.trim() && styles.submitButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || loading}
            >
              <Text style={styles.submitButtonText}>Reply</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Discussion</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerAction}>
            <Ionicons name="share-outline" size={24} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Content */}
        <Card style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={theme.colors.gray600} />
              </View>
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>{post.author.name}</Text>
                <Text style={styles.authorMeta}>
                  {post.author.title} • {post.author.church}
                </Text>
                <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent}>{post.content}</Text>

          {post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.postActions}>
            <Pressable style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={post.isLiked ? theme.colors.error : theme.colors.gray600}
              />
              <Text style={styles.actionText}>{post.likes}</Text>
            </Pressable>
            
            <Pressable style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.gray600} />
              <Text style={styles.actionText}>{post.comments}</Text>
            </Pressable>
            
            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={theme.colors.gray600} />
              <Text style={styles.actionText}>{post.shares}</Text>
            </Pressable>
            
            <View style={styles.spacer} />
            
            <Pressable style={styles.actionButton}>
              <Ionicons name="bookmark-outline" size={20} color={theme.colors.gray600} />
            </Pressable>
          </View>
        </Card>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsSectionHeader}>
            <Text style={styles.commentsSectionTitle}>
              Comments ({comments.length})
            </Text>
            
            {/* Post a Comment Link */}
            {!showCommentForm && !replyingTo && (
              <Pressable
                style={styles.postCommentLink}
                onPress={() => setShowCommentForm(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.postCommentText}>Post a Comment</Text>
              </Pressable>
            )}
          </View>


          {/* Comments List */}
          <View style={styles.commentsList}>
            {comments.map(comment => (
              <Card key={comment.id} style={styles.commentCard}>
                {renderComment({ item: comment })}
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Comment Modal */}
      <Modal
        visible={showCommentForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCommentForm(false);
          setNewComment('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => {
                setShowCommentForm(false);
                setNewComment('');
              }}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
            
            <Text style={styles.modalTitle}>Add Comment</Text>
            
            <Pressable
              style={[
                styles.modalSubmitButton,
                !newComment.trim() && styles.modalSubmitButtonDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || loading}
            >
              <Text style={[
                styles.modalSubmitText,
                !newComment.trim() && styles.modalSubmitTextDisabled
              ]}>
                {loading ? 'Posting...' : 'Post'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.modalAuthorSection}>
              <View style={styles.modalAvatar}>
                <Ionicons name="person" size={20} color={theme.colors.gray600} />
              </View>
              <View>
                <Text style={styles.modalAuthorName}>Posting as {mockUsers['1'].name}</Text>
                <Text style={styles.modalAuthorMeta}>{mockUsers['1'].title}</Text>
              </View>
            </View>

            <TextInput
              style={styles.modalTextInput}
              placeholder="Share your thoughts on this discussion..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              autoFocus
              textAlignVertical="top"
            />
            
            <View style={styles.modalFooter}>
              <Text style={styles.modalHint}>
                Be respectful and constructive in your comments
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerAction: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  
  // Post styles
  postCard: {
    marginBottom: theme.spacing.lg,
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
  authorName: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
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
  postTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  postContent: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  tag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '500',
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

  // Comments styles
  commentsSection: {
    marginBottom: theme.spacing.xxl,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  commentsSectionTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  postCommentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  postCommentText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  commentInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.sm,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.gray400,
  },
  submitButtonText: {
    ...theme.typography.body2,
    color: theme.colors.white,
    fontWeight: '600',
  },
  commentsList: {
    gap: theme.spacing.sm,
  },
  commentCard: {
    backgroundColor: theme.colors.surface,
  },
  commentContainer: {
    paddingVertical: theme.spacing.xs,
  },
  replyContainer: {
    marginLeft: theme.spacing.lg,
    paddingLeft: theme.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.gray200,
  },
  commentHeader: {
    marginBottom: theme.spacing.xs,
  },
  commentAuthor: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAuthorDetails: {
    flex: 1,
  },
  commentAuthorName: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  commentMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  commentText: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xl + theme.spacing.sm,
  },
  commentActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginLeft: theme.spacing.xl + theme.spacing.sm,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  commentActionText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: theme.spacing.sm,
  },
  replyInput: {
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xl + theme.spacing.sm,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  cancelButtonText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorSubtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    backgroundColor: theme.colors.surface,
  },
  modalCloseButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  modalCloseText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  modalTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  modalSubmitButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: theme.colors.gray400,
  },
  modalSubmitText: {
    ...theme.typography.body1,
    color: theme.colors.white,
    fontWeight: '600',
  },
  modalSubmitTextDisabled: {
    color: theme.colors.gray600,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  modalAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAuthorName: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  modalAuthorMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  modalTextInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  modalFooter: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
  },
  modalHint: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});