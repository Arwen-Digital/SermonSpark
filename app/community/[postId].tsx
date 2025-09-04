import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Platform, KeyboardAvoidingView } from 'react-native';
import communityService, { CommunityCommentDto, CommunityPostDto } from '@/services/supabaseCommunityService';

type UiComment = {
  id: string;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  authorName: string;
  authorTitle?: string;
  replies: UiComment[];
};

export default function PostDetailPage() {
  const rawParams = useLocalSearchParams();
  const postId = Array.isArray((rawParams as any).postId)
    ? (rawParams as any).postId[0]
    : (rawParams as any).postId;
  const focus = Array.isArray((rawParams as any).focus)
    ? (rawParams as any).focus[0]
    : (rawParams as any).focus;
  const [post, setPost] = useState<CommunityPostDto | null>(null);
  const [commentsRaw, setCommentsRaw] = useState<CommunityCommentDto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [commentsY, setCommentsY] = useState(0);
  const [openedOnFocus, setOpenedOnFocus] = useState(false);
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current && (scrollRef.current as any).scrollToEnd) {
      (scrollRef.current as any).scrollToEnd({ animated: true });
    }
  }, []);

  const load = useCallback(async () => {
    if (!postId || typeof postId !== 'string') return;
    try {
      const [p, c] = await Promise.all([
        communityService.getPostById(postId),
        communityService.getPostComments(postId),
      ]);
      setPost(p);
      setCommentsRaw(c);
    } catch (e) {
      console.error('Failed to load post details:', e);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  // If navigated with focus=comments or hash #comments (web), scroll to comments
  useEffect(() => {
    const wantsComments = (typeof focus === 'string' && focus.toLowerCase() === 'comments') ||
      (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash === '#comments');
    if (!wantsComments || openedOnFocus) return;
    // slight delay to ensure layout calculated
    const t = setTimeout(() => {
      if (scrollRef.current && commentsY > 0) {
        scrollRef.current.scrollTo({ y: Math.max(0, commentsY - 12), animated: true });
      }
      setShowCommentForm(true);
      setOpenedOnFocus(true);
    }, 200);
    return () => clearTimeout(t);
  }, [focus, commentsY, openedOnFocus]);

  const comments = useMemo<UiComment[]>(() => {
    const byId = new Map<string, UiComment>();
    const roots: UiComment[] = [];

    const toUi = (c: CommunityCommentDto): UiComment => ({
      id: c.id,
      content: c.content,
      likes: c.likesCount || 0,
      isLiked: !!c.isLiked,
      createdAt: new Date(c.createdAt),
      authorName: c.author?.fullName || 'Anonymous',
      authorTitle: c.author?.title || undefined,
      replies: [],
    });

    commentsRaw.forEach((c) => byId.set(c.id, toUi(c)));
    commentsRaw.forEach((c) => {
      const node = byId.get(c.id)!;
      if (c.parentCommentId) {
        const parent = byId.get(c.parentCommentId);
        if (parent) parent.replies.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [commentsRaw]);

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

  const handleLike = async () => {
    try {
      const liked = await communityService.togglePostLike(post.id);
      setPost(prev => prev ? {
        ...prev,
        isLiked: liked,
        likesCount: liked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1),
      } : null);
    } catch (e) {
      console.error('Toggle like failed:', e);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      const liked = await communityService.toggleCommentLike(commentId);
      setCommentsRaw(prev => prev.map(c => c.id === commentId ? {
        ...c,
        isLiked: liked,
        likesCount: liked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 0) - 1),
      } : c));
    } catch (e) {
      console.error('Toggle comment like failed:', e);
    }
  };

  const handleShare = () => {
    console.log('Share post');
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await communityService.createComment({
        postId: post.id,
        content: newComment.trim(),
        parentCommentId: replyingTo || undefined,
      });
      const c = await communityService.getPostComments(post.id);
      setCommentsRaw(c);
      setPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev);
      setNewComment('');
      setReplyingTo(null);
      setShowCommentForm(false);
    } catch (e) {
      console.error('Create comment failed:', e);
    } finally {
      setLoading(false);
    }
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

  const renderComment = ({ item, isReply = false, parentId }: { item: UiComment; isReply?: boolean; parentId?: string }) => (
    <View style={[styles.commentContainer, isReply && styles.replyContainer]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthor}>
          <View style={styles.commentAvatar}>
            <Ionicons name="person" size={16} color={theme.colors.gray600} />
          </View>
          <View style={styles.commentAuthorDetails}>
            <Text style={styles.commentAuthorName}>{item.authorName}</Text>
            <Text style={styles.commentMeta}>
              {item.authorTitle || 'Pastor'} • {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.commentText}>{item.content}</Text>

      <View style={styles.commentActions}>
        <Pressable
          style={styles.commentActionButton}
          onPress={() => handleCommentLike(item.id)}
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

      {item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map(reply => (
            <View key={reply.id}>{renderComment({ item: reply, isReply: true, parentId: item.id })}</View>
          ))}
        </View>
      )}

      {replyingTo === item.id && (
        <View style={styles.replyInput}>
          <TextInput
            style={styles.commentInput}
            placeholder={`Reply to ${item.authorName}...`}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            autoFocus
            onFocus={scrollToBottom}
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
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerAction} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...(Platform.OS === 'web' ? ({} as any) : ({ automaticallyAdjustKeyboardInsets: true } as any))}
      >
        <Card style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={theme.colors.gray600} />
              </View>
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>{post.author?.fullName || 'Unknown Author'}</Text>
                <Text style={styles.authorMeta}>
                  {post.author?.title || 'Pastor'} • {post.author?.church || 'Church'}
                </Text>
                <Text style={styles.postTime}>{formatTimeAgo(new Date(post.createdAt))}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent}>{post.content}</Text>

          {post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.slice(0, 5).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
              {post.tags.length > 5 && (
                <Text style={styles.moreTagsText}>+{post.tags.length - 5}</Text>
              )}
            </View>
          )}

          <View style={styles.postActions}>
            <Pressable style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={post.isLiked ? theme.colors.error : theme.colors.gray600}
              />
              <Text style={styles.actionText}>{post.likesCount || 0}</Text>
            </Pressable>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.gray600} />
              <Text style={styles.actionText}>{post.commentsCount || 0}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.commentsSection} onLayout={(e) => setCommentsY(e.nativeEvent.layout.y)}>
          <View style={styles.commentsSectionHeader}>
            <Text style={styles.commentsSectionTitle}>Comments ({comments.length})</Text>

            {!showCommentForm && !replyingTo && (
              <Pressable style={styles.postCommentLink} onPress={() => setShowCommentForm(true)}>
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.postCommentText}>Post a Comment</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.commentsList}>
            {comments.map(comment => (
              <Card key={comment.id} style={styles.commentCard}>
                {renderComment({ item: comment })}
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

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
              style={[styles.modalSubmitButton, !newComment.trim() && styles.modalSubmitButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || loading}
            >
              <Text style={[styles.modalSubmitText, !newComment.trim() && styles.modalSubmitTextDisabled]}>
                {loading ? 'Posting...' : 'Post'}
              </Text>
            </Pressable>
          </View>

          {Platform.OS === 'web' ? (
            <View style={{ flex: 1 }}>
              <View style={styles.modalContent}>
                <View style={styles.modalAuthorSection}>
                  <View style={styles.modalAvatar}>
                    <Text style={{ color: theme.colors.gray600 }}>🙂</Text>
                  </View>
                  <View>
                    <Text style={styles.modalAuthorName}>Add your comment</Text>
                    <Text style={styles.modalAuthorMeta}>Be respectful and constructive</Text>
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
                  <Text style={styles.modalHint}>Thank you for contributing</Text>
                </View>
              </View>
            </View>
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
              style={{ flex: 1 }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalAuthorSection}>
                  <View style={styles.modalAvatar}>
                    <Ionicons name="person" size={20} color={theme.colors.gray600} />
                  </View>
                  <View>
                    <Text style={styles.modalAuthorName}>Add your comment</Text>
                    <Text style={styles.modalAuthorMeta}>Be respectful and constructive</Text>
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
                  <Text style={styles.modalHint}>Thank you for contributing</Text>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}
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
    alignItems: 'center',
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

  // Comments
  commentsSection: {
    marginTop: theme.spacing.lg,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  commentsSectionTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
  },
  postCommentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  postCommentText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  commentsList: {
    gap: theme.spacing.sm,
  },
  commentCard: {
    padding: theme.spacing.md,
  },
  commentContainer: {},
  replyContainer: {
    marginLeft: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAuthorDetails: {},
  commentAuthorName: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  commentMeta: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  commentText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginTop: theme.spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
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
    gap: theme.spacing.sm,
  },
  replyInput: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  commentInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
