import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CommunityPostDto {
  id: string;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  visibility: 'community' | 'public' | 'private';
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    fullName?: string;
    title?: string;
    church?: string;
  };
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

export interface CommunityCommentDto {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    fullName?: string;
    title?: string;
    church?: string;
  };
  likesCount?: number;
  isLiked?: boolean;
  replies?: CommunityCommentDto[];
}

export interface CreateCommunityPostInput {
  title: string;
  content: string;
  tags?: string[];
  visibility?: 'community' | 'public' | 'private';
  status?: 'active' | 'draft';
}

export interface UpdateCommunityPostInput extends Partial<CreateCommunityPostInput> {}

export interface CreateCommunityCommentInput {
  postId: string;
  content: string;
  parentCommentId?: string;
}

class ExpressCommunityService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_EXPRESS_API_URL || 'http://localhost:3000';
  }

  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data.data || data;
  }

  private serializePost(item: any): CommunityPostDto {
    return {
      id: item.id,
      authorId: item.author_id,
      title: item.title,
      content: item.content,
      tags: item.tags || [],
      visibility: item.visibility,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      author: item.author ? {
        id: item.author.id,
        fullName: item.author.profile?.full_name,
        title: item.author.profile?.title,
        church: item.author.profile?.church,
      } : undefined,
      likesCount: item.like_count || 0,
      commentsCount: item.comment_count || 0,
      isLiked: item.user_has_liked || false,
    };
  }

  private serializeComment(item: any): CommunityCommentDto {
    return {
      id: item.id,
      postId: item.post_id,
      authorId: item.author_id,
      content: item.content,
      parentCommentId: item.parent_comment_id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      author: item.author ? {
        id: item.author.id,
        fullName: item.author.profile?.full_name,
        title: item.author.profile?.title,
        church: item.author.profile?.church,
      } : undefined,
      likesCount: item.like_count || 0,
      isLiked: item.user_has_liked || false,
      replies: item.replies ? item.replies.map((reply: any) => this.serializeComment(reply)) : [],
    };
  }

  async getAllPosts(): Promise<CommunityPostDto[]> {
    try {
      console.log('Fetching community posts from Express API...');
      
      const response = await this.makeRequest('/community/posts');
      const result = await this.handleResponse<{ posts: any[] }>(response);
      
      console.log('Fetched community posts:', result.posts?.length || 0);
      
      return (result.posts || []).map((item: any) => {
        console.log(`Post "${item.title}": author=${item.author?.fullName || item.author?.full_name || 'Unknown'}`);
        return this.serializePost(item);
      });
    } catch (error) {
      console.error('Get all posts error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch community posts: ${error.message}`);
      }
      throw new Error('Network error during community posts fetch');
    }
  }

  async getPostById(postId: string): Promise<CommunityPostDto> {
    try {
      const response = await this.makeRequest(`/community/posts/${postId}`);
      const data = await this.handleResponse<any>(response);
      return this.serializePost(data);
    } catch (error) {
      console.error('Get post by ID error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch community post: ${error.message}`);
      }
      throw new Error('Network error during community post fetch');
    }
  }

  async createPost(input: CreateCommunityPostInput): Promise<CommunityPostDto> {
    try {
      const response = await this.makeRequest('/community/posts', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      const data = await this.handleResponse<any>(response);
      return this.serializePost(data);
    } catch (error) {
      console.error('Create post error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create community post: ${error.message}`);
      }
      throw new Error('Network error during community post creation');
    }
  }

  async updatePost(postId: string, input: UpdateCommunityPostInput): Promise<CommunityPostDto> {
    try {
      const response = await this.makeRequest(`/community/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });

      const data = await this.handleResponse<any>(response);
      return this.serializePost(data);
    } catch (error) {
      console.error('Update post error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update community post: ${error.message}`);
      }
      throw new Error('Network error during community post update');
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      const response = await this.makeRequest(`/community/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete community post: ${error.message}`);
      }
      throw new Error('Network error during community post deletion');
    }
  }

  async getPostComments(postId: string): Promise<CommunityCommentDto[]> {
    try {
      const response = await this.makeRequest(`/community/posts/${postId}/comments`);
      const result = await this.handleResponse<{ comments: any[] }>(response);
      return (result.comments || []).map((item: any) => this.serializeComment(item));
    } catch (error) {
      console.error('Get post comments error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch comments: ${error.message}`);
      }
      throw new Error('Network error during comments fetch');
    }
  }

  async createComment(input: CreateCommunityCommentInput): Promise<CommunityCommentDto> {
    try {
      const response = await this.makeRequest(`/community/posts/${input.postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: input.content,
          parentCommentId: input.parentCommentId,
        }),
      });

      const data = await this.handleResponse<any>(response);
      return this.serializeComment(data);
    } catch (error) {
      console.error('Create comment error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create comment: ${error.message}`);
      }
      throw new Error('Network error during comment creation');
    }
  }

  async togglePostLike(postId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/community/posts/${postId}/like`, {
        method: 'POST',
      });

      const data = await this.handleResponse<{ isLiked: boolean }>(response);
      return data.isLiked;
    } catch (error) {
      console.error('Toggle post like error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to toggle post like: ${error.message}`);
      }
      throw new Error('Network error during post like toggle');
    }
  }

  async toggleCommentLike(commentId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/community/comments/${commentId}/like`, {
        method: 'POST',
      });

      const data = await this.handleResponse<{ isLiked: boolean }>(response);
      return data.isLiked;
    } catch (error) {
      console.error('Toggle comment like error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to toggle comment like: ${error.message}`);
      }
      throw new Error('Network error during comment like toggle');
    }
  }

  async getMyPosts(): Promise<CommunityPostDto[]> {
    try {
      const response = await this.makeRequest('/community/my-posts');
      const result = await this.handleResponse<{ posts: any[] }>(response);
      return (result.posts || []).map((item: any) => this.serializePost(item));
    } catch (error) {
      console.error('Get my posts error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch my community posts: ${error.message}`);
      }
      throw new Error('Network error during my posts fetch');
    }
  }
}

export default new ExpressCommunityService();