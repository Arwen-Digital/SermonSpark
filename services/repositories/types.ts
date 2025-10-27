// Repository-level DTOs used by both native (SQLite) and web (Supabase).

export type SeriesStatus = 'planning' | 'active' | 'completed' | 'archived';
export type SermonStatus = 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
export type SermonVisibility = 'private' | 'congregation' | 'public';

export interface SeriesDTO {
  id: string;
  userId?: string; // present in native; implied in web
  title: string;
  description?: string | null;
  startDate?: string | null; // ISO
  endDate?: string | null;   // ISO
  imageUrl?: string | null;
  tags?: string[];
  status: SeriesStatus;
  createdAt?: string;
  updatedAt?: string;
  // convenience
  sermonCount?: number;
}

export interface CreateSeriesInput {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  status?: SeriesStatus;
  imageUrl?: string | null;
}

export type UpdateSeriesInput = Partial<CreateSeriesInput>;

export interface SermonDTO {
  id: string;
  userId?: string; // present in native; implied in web
  title: string;
  content?: string | null;
  outline?: unknown | null; // JSON
  scripture?: string | null;
  tags?: string[];
  status?: SermonStatus;
  visibility?: SermonVisibility;
  date?: string | null; // ISO
  notes?: string | null;
  seriesId?: string | null;
  seriesTitle?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSermonInput {
  title: string;
  content?: string;
  outline?: unknown;
  scripture?: string;
  tags?: string[];
  status?: SermonStatus;
  visibility?: SermonVisibility;
  date?: string; // ISO
  notes?: string;
  seriesId?: string; // optional
}

export type UpdateSermonInput = Partial<CreateSermonInput>;

// Sync operation types for local-first operations
export interface SyncOperation<T = any> {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'sermon' | 'series';
  entityId: string;
  data: T;
  userId: string;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

export interface SyncResult {
  success: boolean;
  operationsProcessed: number;
  errors: string[];
}

export interface DataMigrationResult {
  success: boolean;
  migratedRecords: number;
  conflicts: number;
  errors: string[];
}

// Enhanced repository interface for local-first operations
export interface LocalFirstRepository<T, CreateInput, UpdateInput> {
  // Core local operations (always available)
  list(): Promise<T[]>;
  get(id: string): Promise<T>;
  create(input: CreateInput): Promise<T>;
  update(id: string, input: UpdateInput): Promise<T>;
  remove(id: string): Promise<void>;
  
  // Optional sync operations (require authentication)
  queueForSync?(operation: SyncOperation<T>): Promise<void>;
  syncWithRemote?(): Promise<SyncResult>;
  
  // User management for local-first operations
  setUserId?(userId: string): void;
  migrateToUser?(fromUserId: string, toUserId: string): Promise<DataMigrationResult>;
  
  // Legacy sync method for backward compatibility
  sync?(): Promise<void>;
}

// Common repository interface both platforms implement
export interface SeriesRepository extends LocalFirstRepository<SeriesDTO, CreateSeriesInput, UpdateSeriesInput> {}

export interface SermonRepository extends LocalFirstRepository<SermonDTO, CreateSermonInput, UpdateSermonInput> {}

