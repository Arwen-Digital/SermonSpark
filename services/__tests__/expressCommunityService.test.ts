import { expressCommunityService } from '../expressCommunityService';
import { httpClient } from '../httpClient';
import { CommunityPostDto, CommunityCommentDto } from '../../types';

// Mock dependencies
jest.mock('../httpClient');

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('ExpressCommunityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuthor = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    profile: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      full_name: 'Test User',
      title: 'Pastor',
      church: 'Test Church'
    }
  };

  const mockPost: CommunityPostDto = {
    id: '999e4567-e89b-12d3-a456-426614174003',
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Community Post',
    content: 'This is a test community post content with meaningful discussion points.',
    tags: ['community', 'discussion', 'faith'],
    visibility: 'community',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    author: mockAuthor,
    like_count: 5,
    comment_count: 3,
    user_has_liked: false
  };

  const mockComment: CommunityCommentDto = {
    id: '888e4567-e89b-12d3-a456-426614174004',
    post_id: '999e4567-e89b-12d3-a456-426614174003',
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    parent_comment_id: null,
    content: 'This is a thoughtful comment on the community post.',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    author: mockAuthor,
    like_count: 2,
    user_has_liked: false,
    replies: []
  };

  describe('getCommunityPosts', () => {
    it('should fetch community posts successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [mockPost],
          total: 1,
          page: 1,
          limit: 10
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getCommunityPosts();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/community/posts');
      expect(result).toEqual([mockPost]);
    });

    it('should fetch community posts with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [mockPost],
          total: 1,
          page: 1,
          limit: 5
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const filters = {
        visibility: 'community' as const,
        limit: 5,
        offset: 0
      };

      const result = await expressCommunityService.getCommunityPosts(filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/community/posts?visibility=community&limit=5&offset=0');
      expect(result).toEqual([mockPost]);
    });

    it('should handle empty posts list', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [],
          total: 0,
          page: 1,
          limit: 10
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getCommunityPosts();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Database error' }
        })
      } as Response);

      await expect(expressCommunityService.getCommunityPosts()).rejects.toThrow('Database error');
    });
  });

  describe('getCommunityPostById', () => {
    it('should fetch community post by ID successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockPost,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getCommunityPostById(mockPost.id);

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/community/posts/${mockPost.id}`);
      expect(result).toEqual(mockPost);
    });

    it('should handle post not found', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Post not found' }
        })
      } as Response);

      const result = await expressCommunityService.getCommunityPostById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle unauthorized access', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' }
        })
      } as Response);

      await expect(expressCommunityService.getCommunityPostById(mockPost.id))
        .rejects.toThrow('Authentication required');
    });
  });

  describe('createCommunityPost', () => {
    it('should create community post successfully', async () => {
      const postData = {
        title: 'New Community Post',
        content: 'This is a new community post with engaging content.',
        tags: ['new', 'community'],
        visibility: 'community' as const
      };

      const createdPost = {
        ...mockPost,
        ...postData,
        id: 'new-post-id',
        like_count: 0,
        comment_count: 0,
        user_has_liked: false
      };

      const mockResponse = {
        success: true,
        data: createdPost,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.createCommunityPost(postData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/community/posts', postData);
      expect(result).toEqual(createdPost);
      expect(result.title).toBe('New Community Post');
      expect(result.like_count).toBe(0);
    });

    it('should create post with minimal data', async () => {
      const minimalData = {
        title: 'Minimal Post',
        content: 'Minimal content',
        visibility: 'community' as const
      };

      const createdPost = {
        ...mockPost,
        ...minimalData,
        id: 'minimal-post-id',
        tags: [],
        like_count: 0,
        comment_count: 0
      };

      const mockResponse = {
        success: true,
        data: createdPost,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.createCommunityPost(minimalData);

      expect(result.tags).toEqual([]);
      expect(result.title).toBe('Minimal Post');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        content: 'Content',
        visibility: 'community' as const
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              { path: 'title', msg: 'Title is required' }
            ]
          }
        })
      } as Response);

      await expect(expressCommunityService.createCommunityPost(invalidData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('updateCommunityPost', () => {
    it('should update community post successfully', async () => {
      const updates = {
        title: 'Updated Post Title',
        content: 'Updated post content with new information.',
        tags: ['updated', 'community', 'discussion']
      };

      const updatedPost = {
        ...mockPost,
        ...updates
      };

      const mockResponse = {
        success: true,
        data: updatedPost,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.updateCommunityPost(mockPost.id, updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith(`/community/posts/${mockPost.id}`, updates);
      expect(result).toEqual(updatedPost);
      expect(result?.title).toBe('Updated Post Title');
    });

    it('should handle post not found', async () => {
      const updates = { title: 'Updated Title' };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Post not found' }
        })
      } as Response);

      const result = await expressCommunityService.updateCommunityPost('nonexistent-id', updates);

      expect(result).toBeNull();
    });

    it('should handle unauthorized update', async () => {
      const updates = { title: 'Updated Title' };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot update this post' }
        })
      } as Response);

      await expect(expressCommunityService.updateCommunityPost(mockPost.id, updates))
        .rejects.toThrow('Cannot update this post');
    });
  });

  describe('deleteCommunityPost', () => {
    it('should delete community post successfully', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Post deleted successfully' },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.delete.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      await expressCommunityService.deleteCommunityPost(mockPost.id);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(`/community/posts/${mockPost.id}`);
    });

    it('should handle post not found', async () => {
      mockHttpClient.delete.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Post not found' }
        })
      } as Response);

      await expect(expressCommunityService.deleteCommunityPost('nonexistent-id'))
        .rejects.toThrow('Post not found');
    });
  });

  describe('togglePostLike', () => {
    it('should like post successfully', async () => {
      const likedPost = {
        ...mockPost,
        like_count: 6,
        user_has_liked: true
      };

      const mockResponse = {
        success: true,
        data: likedPost,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.togglePostLike(mockPost.id);

      expect(mockHttpClient.post).toHaveBeenCalledWith(`/community/posts/${mockPost.id}/like`);
      expect(result).toEqual(likedPost);
      expect(result.like_count).toBe(6);
      expect(result.user_has_liked).toBe(true);
    });

    it('should unlike post successfully', async () => {
      const unlikedPost = {
        ...mockPost,
        like_count: 4,
        user_has_liked: false
      };

      const mockResponse = {
        success: true,
        data: unlikedPost,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.togglePostLike(mockPost.id);

      expect(result.like_count).toBe(4);
      expect(result.user_has_liked).toBe(false);
    });

    it('should handle post not found', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Post not found' }
        })
      } as Response);

      await expect(expressCommunityService.togglePostLike('nonexistent-id'))
        .rejects.toThrow('Post not found');
    });
  });

  describe('getPostComments', () => {
    it('should fetch post comments successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          comments: [mockComment],
          total: 1
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getPostComments(mockPost.id);

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/community/posts/${mockPost.id}/comments`);
      expect(result).toEqual([mockComment]);
    });

    it('should handle empty comments list', async () => {
      const mockResponse = {
        success: true,
        data: {
          comments: [],
          total: 0
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getPostComments(mockPost.id);

      expect(result).toEqual([]);
    });

    it('should handle nested comments (replies)', async () => {
      const parentComment = { ...mockComment };
      const replyComment = {
        ...mockComment,
        id: 'reply-comment-id',
        parent_comment_id: parentComment.id,
        content: 'This is a reply to the parent comment.'
      };

      parentComment.replies = [replyComment];

      const mockResponse = {
        success: true,
        data: {
          comments: [parentComment],
          total: 1
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getPostComments(mockPost.id);

      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies![0].parent_comment_id).toBe(parentComment.id);
    });
  });

  describe('createComment', () => {
    it('should create comment successfully', async () => {
      const commentData = {
        content: 'This is a new comment on the post.'
      };

      const createdComment = {
        ...mockComment,
        ...commentData,
        id: 'new-comment-id',
        like_count: 0,
        user_has_liked: false
      };

      const mockResponse = {
        success: true,
        data: createdComment,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.createComment(mockPost.id, commentData);

      expect(mockHttpClient.post).toHaveBeenCalledWith(`/community/posts/${mockPost.id}/comments`, commentData);
      expect(result).toEqual(createdComment);
      expect(result.content).toBe('This is a new comment on the post.');
    });

    it('should create reply comment successfully', async () => {
      const replyData = {
        content: 'This is a reply to another comment.',
        parent_comment_id: mockComment.id
      };

      const createdReply = {
        ...mockComment,
        ...replyData,
        id: 'new-reply-id',
        like_count: 0,
        user_has_liked: false
      };

      const mockResponse = {
        success: true,
        data: createdReply,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.createComment(mockPost.id, replyData);

      expect(result.parent_comment_id).toBe(mockComment.id);
      expect(result.content).toBe('This is a reply to another comment.');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        content: '' // Empty content should fail validation
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Content is required',
            details: [
              { path: 'content', msg: 'Content cannot be empty' }
            ]
          }
        })
      } as Response);

      await expect(expressCommunityService.createComment(mockPost.id, invalidData))
        .rejects.toThrow('Content is required');
    });
  });

  describe('toggleCommentLike', () => {
    it('should like comment successfully', async () => {
      const likedComment = {
        ...mockComment,
        like_count: 3,
        user_has_liked: true
      };

      const mockResponse = {
        success: true,
        data: likedComment,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.toggleCommentLike(mockComment.id);

      expect(mockHttpClient.post).toHaveBeenCalledWith(`/community/comments/${mockComment.id}/like`);
      expect(result).toEqual(likedComment);
      expect(result.like_count).toBe(3);
      expect(result.user_has_liked).toBe(true);
    });

    it('should unlike comment successfully', async () => {
      const unlikedComment = {
        ...mockComment,
        like_count: 1,
        user_has_liked: false
      };

      const mockResponse = {
        success: true,
        data: unlikedComment,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.toggleCommentLike(mockComment.id);

      expect(result.like_count).toBe(1);
      expect(result.user_has_liked).toBe(false);
    });
  });

  describe('getUserPosts', () => {
    it('should fetch user posts successfully', async () => {
      const userPost = {
        ...mockPost,
        title: 'My Personal Post',
        visibility: 'private' as const
      };

      const mockResponse = {
        success: true,
        data: {
          posts: [userPost],
          total: 1,
          page: 1,
          limit: 10
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getUserPosts();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/community/my-posts');
      expect(result).toEqual([userPost]);
      expect(result[0].author_id).toBe(mockAuthor.id);
    });

    it('should handle empty user posts', async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [],
          total: 0,
          page: 1,
          limit: 10
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getUserPosts();

      expect(result).toEqual([]);
    });
  });

  describe('Data Format Compatibility', () => {
    it('should handle posts with minimal data', async () => {
      const minimalPost = {
        id: 'minimal-post-id',
        author_id: 'author-id',
        title: 'Minimal Post',
        content: 'Minimal content',
        tags: [],
        visibility: 'community',
        status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        author: {
          id: 'author-id',
          username: 'minimaluser',
          profile: {
            id: 'author-id',
            full_name: null,
            title: null,
            church: null
          }
        },
        like_count: 0,
        comment_count: 0,
        user_has_liked: false
      };

      const mockResponse = {
        success: true,
        data: {
          posts: [minimalPost],
          total: 1
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getCommunityPosts();

      expect(result[0]).toEqual(minimalPost);
      expect(result[0].tags).toEqual([]);
      expect(result[0].author.profile.full_name).toBeNull();
    });

    it('should handle different visibility levels', async () => {
      const visibilityLevels = ['private', 'community', 'public'] as const;
      
      for (const visibility of visibilityLevels) {
        const postWithVisibility = {
          ...mockPost,
          visibility
        };

        const mockResponse = {
          success: true,
          data: {
            posts: [postWithVisibility],
            total: 1
          }
        };

        mockHttpClient.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse
        } as Response);

        const result = await expressCommunityService.getCommunityPosts({ visibility });

        expect(result[0].visibility).toBe(visibility);
      }
    });

    it('should handle tag arrays correctly', async () => {
      const postWithTags = {
        ...mockPost,
        tags: ['faith', 'community', 'discussion', 'prayer', 'worship']
      };

      const mockResponse = {
        success: true,
        data: postWithTags
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getCommunityPostById(mockPost.id);

      expect(result?.tags).toEqual(['faith', 'community', 'discussion', 'prayer', 'worship']);
      expect(Array.isArray(result?.tags)).toBe(true);
    });

    it('should handle like and comment counts correctly', async () => {
      const postWithCounts = {
        ...mockPost,
        like_count: 25,
        comment_count: 12,
        user_has_liked: true
      };

      const mockResponse = {
        success: true,
        data: postWithCounts
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getCommunityPostById(mockPost.id);

      expect(result?.like_count).toBe(25);
      expect(result?.comment_count).toBe(12);
      expect(result?.user_has_liked).toBe(true);
      expect(typeof result?.like_count).toBe('number');
      expect(typeof result?.user_has_liked).toBe('boolean');
    });

    it('should handle date formatting correctly', async () => {
      const postWithDates = {
        ...mockPost,
        created_at: '2024-01-15T14:30:00.000Z',
        updated_at: '2024-01-16T09:15:00.000Z'
      };

      const mockResponse = {
        success: true,
        data: postWithDates
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressCommunityService.getCommunityPostById(mockPost.id);

      expect(result?.created_at).toBe('2024-01-15T14:30:00.000Z');
      expect(result?.updated_at).toBe('2024-01-16T09:15:00.000Z');
      expect(new Date(result!.created_at).getTime()).toBe(new Date('2024-01-15T14:30:00.000Z').getTime());
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed JSON responses', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      await expect(expressCommunityService.getCommunityPosts()).rejects.toThrow('Invalid JSON');
    });

    it('should handle network timeouts', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(expressCommunityService.getCommunityPosts()).rejects.toThrow('Request timeout');
    });

    it('should handle server errors with detailed messages', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create post',
            details: 'Database connection lost'
          }
        })
      } as Response);

      await expect(expressCommunityService.createCommunityPost({
        title: 'Test',
        content: 'Content',
        visibility: 'community'
      })).rejects.toThrow('Failed to create post');
    });

    it('should handle rate limiting errors', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: { retryAfter: 60 }
          }
        })
      } as Response);

      await expect(expressCommunityService.togglePostLike(mockPost.id))
        .rejects.toThrow('Too many requests. Please try again later.');
    });

    it('should handle content moderation errors', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          success: false,
          error: {
            code: 'CONTENT_VIOLATION',
            message: 'Content violates community guidelines',
            details: { reason: 'inappropriate_language' }
          }
        })
      } as Response);

      await expect(expressCommunityService.createCommunityPost({
        title: 'Bad Post',
        content: 'Inappropriate content',
        visibility: 'community'
      })).rejects.toThrow('Content violates community guidelines');
    });
  });
});