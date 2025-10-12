export interface Sermon {
  id: string;
  title: string;
  content: string;
  outline?: string;
  scripture?: string;
  scriptureReferences?: string[];
  tags: string[];
  seriesId?: string;
  series?: string; // series title if available
  orderInSeries?: number;
  date: Date;
  preachedDate?: Date;
  lastModified: Date;
  wordCount: number;
  readingTime: number;
  isArchived: boolean;
  isFavorite: boolean;
  notes?: string;
}

export interface SermonSeries {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  startDate?: Date;
  endDate?: Date;
  imageUrl?: string;
  color: string;
  sermonCount: number;
  isActive: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string;
  children?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
  church?: string;
  bio?: string;
  isPremium: boolean;
  joinedDate: Date;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  author: User;
  title: string;
  content: string;
  sermonId?: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
  visibility: 'public' | 'community' | 'private';
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  likes: number;
  replies: Comment[];
  createdAt: Date;
  isLiked: boolean;
}

export interface ResearchTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPremium: boolean;
  category: 'outline' | 'illustration' | 'context' | 'language' | 'history' | 'topic';
}

export interface PulpitSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark';
  showTimer: boolean;
  showProgress: boolean;
  timerDuration: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number;
  fontSize: number;
  notifications: {
    reminders: boolean;
    community: boolean;
    updates: boolean;
  };
  pulpit: PulpitSettings;
}

// Agent search logging (added on main branch)
export interface AgentSearch {
  id: string;
  userId: string;
  agentType: 'claude_haiku' | 'claude_sonnet' | 'claude_opus' | 'openai_gpt4o_mini';
  searchType: 'bible_verse' | 'sermon_help' | 'outline_generation' | 'illustration_search';
  query: string;
  response?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  responseTimeMs?: number;
  tokensUsed?: number;
  costUsd?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  dirty: boolean;
  op: 'upsert' | 'delete';
  version: number;
}

export interface BibleVerseSearch {
  verse: string;
  translation: string;
  response: string;
  success: boolean;
  errorMessage?: string;
}