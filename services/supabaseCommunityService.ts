import { supabase } from './supabaseClient';

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

class SupabaseCommunityService {
  private serializePost(item: any): CommunityPostDto {
    return {
      id: item.id,
      authorId: item.author_id,
      title: item.title,
      content: item.content,
      tags: item.tags || [],
      visibility: item.visibility,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      author: item.profiles ? {
        id: item.profiles.id,
        fullName: item.profiles.full_name,
        title: item.profiles.title,
        church: item.profiles.church,
      } : undefined,
      likesCount: item.likes_count || 0,
      commentsCount: item.comments_count || 0,
      isLiked: item.is_liked || false,
    };
  }

  private serializeComment(item: any): CommunityCommentDto {
    return {
      id: item.id,
      postId: item.post_id,
      authorId: item.author_id,
      content: item.content,
      parentCommentId: item.parent_comment_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      author: item.profiles ? {
        id: item.profiles.id,
        fullName: item.profiles.full_name,
        title: item.profiles.title,
        church: item.profiles.church,
      } : undefined,
      likesCount: item.likes_count || 0,
      isLiked: item.is_liked || false,
    };
  }

  async getAllPosts(): Promise<CommunityPostDto[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles (
          id,
          full_name,
          title,
          church
        ),
        community_post_likes!left (
          user_id
        ),
        community_post_comments!left (
          id
        )
      `)
      .eq('status', 'active')
      .in('visibility', ['community', 'public'])
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch community posts: ${error.message}`);

    return (data || []).map((item: any) => ({
      ...this.serializePost(item),
      likesCount: item.community_post_likes?.length || 0,
      commentsCount: item.community_post_comments?.length || 0,
      isLiked: user ? item.community_post_likes?.some((like: any) => like.user_id === user.id) || false : false,
    }));
  }

  async getPostById(postId: string): Promise<CommunityPostDto> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles (
          id,
          full_name,
          title,
          church
        ),
        community_post_likes!left (
          user_id
        ),
        community_post_comments!left (
          id
        )
      `)
      .eq('id', postId)
      .single();

    if (error) throw new Error(`Failed to fetch community post: ${error.message}`);

    return {
      ...this.serializePost(data),
      likesCount: data.community_post_likes?.length || 0,
      commentsCount: data.community_post_comments?.length || 0,
      isLiked: user ? data.community_post_likes?.some((like: any) => like.user_id === user.id) || false : false,
    };
  }

  async createPost(input: CreateCommunityPostInput): Promise<CommunityPostDto> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const insertData = {
      author_id: user.id,
      title: input.title,
      content: input.content,
      tags: input.tags || [],
      visibility: input.visibility || 'community',
      status: input.status || 'active',
    };

    const { data, error } = await supabase
      .from('community_posts')
      .insert(insertData)
      .select(`
        *,
        profiles (
          id,
          full_name,
          title,
          church
        )
      `)
      .single();

    if (error) throw new Error(`Failed to create community post: ${error.message}`);
    return this.serializePost(data);
  }

  async updatePost(postId: string, input: UpdateCommunityPostInput): Promise<CommunityPostDto> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabase
      .from('community_posts')
      .update(updateData)
      .eq('id', postId)
      .eq('author_id', user.id)
      .select(`
        *,
        profiles (
          id,
          full_name,
          title,
          church
        )
      `)
      .single();

    if (error) throw new Error(`Failed to update community post: ${error.message}`);
    return this.serializePost(data);
  }

  async deletePost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) throw new Error(`Failed to delete community post: ${error.message}`);
  }

  async getPostComments(postId: string): Promise<CommunityCommentDto[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('community_post_comments')
      .select(`
        *,
        profiles (
          id,
          full_name,
          title,
          church
        ),
        community_comment_likes!left (
          user_id
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch comments: ${error.message}`);

    return (data || []).map((item: any) => ({
      ...this.serializeComment(item),
      likesCount: item.community_comment_likes?.length || 0,
      isLiked: user ? item.community_comment_likes?.some((like: any) => like.user_id === user.id) || false : false,
    }));
  }

  async createComment(input: CreateCommunityCommentInput): Promise<CommunityCommentDto> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const insertData = {
      post_id: input.postId,
      author_id: user.id,
      content: input.content,
      parent_comment_id: input.parentCommentId || null,
    };

    const { data, error } = await supabase
      .from('community_post_comments')
      .insert(insertData)
      .select(`
        *,
        profiles (
          id,
          full_name,
          title,
          church
        )
      `)
      .single();

    if (error) throw new Error(`Failed to create comment: ${error.message}`);
    return this.serializeComment(data);
  }

  async togglePostLike(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('community_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw new Error(`Failed to unlike post: ${error.message}`);
      return false;
    } else {
      // Like
      const { error } = await supabase
        .from('community_post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw new Error(`Failed to like post: ${error.message}`);
      return true;
    }
  }

  async toggleCommentLike(commentId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('community_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('community_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw new Error(`Failed to unlike comment: ${error.message}`);
      return false;
    } else {
      // Like
      const { error } = await supabase
        .from('community_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      if (error) throw new Error(`Failed to like comment: ${error.message}`);
      return true;
    }
  }

  async getMyPosts(): Promise<CommunityPostDto[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles (
          id,
          full_name,
          title,
          church
        ),
        community_post_likes!left (
          user_id
        ),
        community_post_comments!left (
          id
        )
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch my community posts: ${error.message}`);

    return (data || []).map((item: any) => ({
      ...this.serializePost(item),
      likesCount: item.community_post_likes?.length || 0,
      commentsCount: item.community_post_comments?.length || 0,
      isLiked: item.community_post_likes?.some((like: any) => like.user_id === user.id) || false,
    }));
  }
}

export default new SupabaseCommunityService();