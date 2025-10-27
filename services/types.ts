/**
 * Shared types for services
 * Replacing deleted Express service types
 */

export interface CommunityPostDto {
  id: string;
  userId: string;
  content: string;
  likes?: string[];
  likesCount?: number;
  comments?: CommunityCommentDto[];
  createdAt: string;
  updatedAt: string;
  author?: {
    fullName: string | null;
    title: string | null;
    church: string | null;
    avatarUrl: string | null;
  };
}

export interface CommunityCommentDto {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    fullName: string | null;
    title: string | null;
  };
  replies?: CommunityCommentDto[];
}

