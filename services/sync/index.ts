/**
 * Sync service exports
 * Provides data transformation utilities and API types for ExpressJS sync
 */

// Data transformation utilities
export {
  DataTransformer,
  type SQLiteSeriesRecord,
  type SQLiteSermonRecord,
  type APISeriesRecord,
  type APISermonRecord,
} from './dataTransformer';

// API response types and validation
export {
  APIValidator,
  HTTPStatusCode,
  APIErrorCode,
  type BaseAPIResponse,
  type APIError,
  type PaginationMeta,
  type AuthTokens,
  type AuthUser,
  type LoginResponse,
  type RefreshTokenResponse,
  type AuthStatusResponse,
  type SeriesListResponse,
  type SeriesDetailResponse,
  type SeriesCreateResponse,
  type SeriesUpdateResponse,
  type SeriesDeleteResponse,
  type SermonListResponse,
  type SermonDetailResponse,
  type SermonCreateResponse,
  type SermonUpdateResponse,
  type SermonDeleteResponse,
  type SyncPullResponse,
  type SeriesSyncPullResponse,
  type SermonSyncPullResponse,
  type BatchOperationResult,
  type SeriesBatchResponse,
  type SermonBatchResponse,
  type BaseQueryParams,
  type SyncQueryParams,
  type SeriesQueryParams,
  type SermonQueryParams,
  type SeriesCreateRequest,
  type SeriesUpdateRequest,
  type SermonCreateRequest,
  type SermonUpdateRequest,
} from './apiTypes';

// Progress tracking types
export interface SyncProgress {
  phase: 'series_push' | 'series_pull' | 'sermons_push' | 'sermons_pull' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number; // milliseconds
  seriesStats: {
    pushed: number;
    pulled: number;
    conflicts: number;
    errors: string[];
  };
  sermonStats: {
    pushed: number;
    pulled: number;
    conflicts: number;
    errors: string[];
  };
  totalErrors: string[];
}

export interface SyncError {
  id: string;
  type: 'push' | 'pull' | 'conflict' | 'validation' | 'network' | 'auth';
  entity: 'series' | 'sermon';
  entityId?: string;
  message: string;
  timestamp: string;
  retryCount: number;
}

// Progress callback type
export type SyncProgressCallback = (progress: SyncProgress) => void;

// Sync service interfaces
export interface SyncService {
  syncAll(): Promise<SyncResult>;
  syncSeries(): Promise<{ pushed: number; pulled: number; conflicts: number; errors: string[] }>;
  syncSermons(): Promise<{ pushed: number; pulled: number; conflicts: number; errors: string[] }>;
}

export interface SyncHttpClient {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
  delete(endpoint: string): Promise<void>;
}

// Sync metadata types
export interface SyncMetadata {
  lastPulledAt: string; // ISO datetime string
  lastPushedAt: string; // ISO datetime string
  conflictCount: number;
  errorCount: number;
}

export interface SyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  conflictCount: number;
  errors: string[];
  duration: number; // milliseconds
}

export interface ConflictRecord {
  id: string;
  tableName: 'series' | 'sermons';
  recordId: string;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  resolvedWith: 'local' | 'remote';
  createdAt: string;
}