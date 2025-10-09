/**
 * Type definitions for ExpressJS API responses
 * Includes validation schemas and response types for sync operations
 */

import { APISeriesRecord, APISermonRecord } from './dataTransformer';

// Base API response structure
export interface BaseAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: string; // ISO datetime string
}

// API error structure
export interface APIError {
  code: string;
  message: string;
  details?: string;
  field?: string; // For validation errors
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Authentication response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse extends BaseAPIResponse<{
  user: AuthUser;
  tokens: AuthTokens;
}> {}

export interface RefreshTokenResponse extends BaseAPIResponse<{
  tokens: AuthTokens;
}> {}

export interface AuthStatusResponse extends BaseAPIResponse<{
  isAuthenticated: boolean;
  user?: AuthUser;
}> {}

// Series API response types
export interface SeriesListResponse extends BaseAPIResponse<{
  series: APISeriesRecord[];
  pagination: PaginationMeta;
}> {}

export interface SeriesDetailResponse extends BaseAPIResponse<APISeriesRecord> {}

export interface SeriesCreateResponse extends BaseAPIResponse<APISeriesRecord> {}

export interface SeriesUpdateResponse extends BaseAPIResponse<APISeriesRecord> {}

export interface SeriesDeleteResponse extends BaseAPIResponse<{
  id: string;
  message: string;
}> {}

// Sermon API response types
export interface SermonListResponse extends BaseAPIResponse<{
  sermons: APISermonRecord[];
  pagination: PaginationMeta;
}> {}

export interface SermonDetailResponse extends BaseAPIResponse<APISermonRecord> {}

export interface SermonCreateResponse extends BaseAPIResponse<APISermonRecord> {}

export interface SermonUpdateResponse extends BaseAPIResponse<APISermonRecord> {}

export interface SermonDeleteResponse extends BaseAPIResponse<{
  id: string;
  message: string;
}> {}

// Sync-specific response types
export interface SyncPullResponse<T> extends BaseAPIResponse<{
  records: T[];
  pagination?: PaginationMeta;
  lastUpdated: string; // ISO datetime string
}> {}

export interface SeriesSyncPullResponse extends SyncPullResponse<APISeriesRecord> {}
export interface SermonSyncPullResponse extends SyncPullResponse<APISermonRecord> {}

// Batch operation response types
export interface BatchOperationResult<T> {
  success: T[];
  failed: Array<{
    record: T;
    error: APIError;
  }>;
}

export interface SeriesBatchResponse extends BaseAPIResponse<BatchOperationResult<APISeriesRecord>> {}
export interface SermonBatchResponse extends BaseAPIResponse<BatchOperationResult<APISermonRecord>> {}

// Query parameters for API requests
export interface BaseQueryParams {
  page?: number;
  limit?: number;
}

export interface SyncQueryParams extends BaseQueryParams {
  updated_at?: string; // ISO datetime string for incremental sync
  include_deleted?: boolean;
}

export interface SeriesQueryParams extends SyncQueryParams {
  status?: 'planning' | 'active' | 'completed' | 'archived';
  search?: string;
}

export interface SermonQueryParams extends SyncQueryParams {
  status?: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
  visibility?: 'private' | 'congregation' | 'public';
  series_id?: string;
  search?: string;
}

// Request body types for create/update operations
export interface SeriesCreateRequest {
  title: string;
  description?: string;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  image_url?: string;
  tags?: string[];
  status?: 'planning' | 'active' | 'completed' | 'archived';
}

export interface SeriesUpdateRequest extends Partial<SeriesCreateRequest> {}

export interface SermonCreateRequest {
  title: string;
  content?: string;
  outline?: unknown; // JSON object
  scripture?: string;
  tags?: string[];
  status?: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
  visibility?: 'private' | 'congregation' | 'public';
  date?: string; // ISO datetime string
  notes?: string;
  series_id?: string;
}

export interface SermonUpdateRequest extends Partial<SermonCreateRequest> {}

// Validation schemas using simple validation functions
export class APIValidator {
  /**
   * Validate API response structure
   */
  static validateBaseResponse<T>(response: unknown): response is BaseAPIResponse<T> {
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    const resp = response as Record<string, unknown>;
    
    return (
      typeof resp.success === 'boolean' &&
      typeof resp.timestamp === 'string' &&
      (resp.error === undefined || this.validateAPIError(resp.error))
    );
  }

  /**
   * Validate API error structure
   */
  static validateAPIError(error: unknown): error is APIError {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const err = error as Record<string, unknown>;
    
    return (
      typeof err.code === 'string' &&
      typeof err.message === 'string' &&
      (err.details === undefined || typeof err.details === 'string') &&
      (err.field === undefined || typeof err.field === 'string')
    );
  }

  /**
   * Validate pagination metadata
   */
  static validatePaginationMeta(pagination: unknown): pagination is PaginationMeta {
    if (typeof pagination !== 'object' || pagination === null) {
      return false;
    }

    const page = pagination as Record<string, unknown>;
    
    return (
      typeof page.page === 'number' &&
      typeof page.limit === 'number' &&
      typeof page.total === 'number' &&
      typeof page.totalPages === 'number' &&
      page.page >= 1 &&
      page.limit >= 1 &&
      page.total >= 0 &&
      page.totalPages >= 0
    );
  }

  /**
   * Validate series record from API
   */
  static validateAPISeriesRecord(record: unknown): record is APISeriesRecord {
    if (typeof record !== 'object' || record === null) {
      return false;
    }

    const series = record as Record<string, unknown>;
    
    return (
      typeof series.id === 'string' &&
      typeof series.user_id === 'string' &&
      typeof series.title === 'string' &&
      (series.description === null || typeof series.description === 'string') &&
      (series.start_date === null || typeof series.start_date === 'string') &&
      (series.end_date === null || typeof series.end_date === 'string') &&
      (series.image_url === null || typeof series.image_url === 'string') &&
      (series.tags === null || Array.isArray(series.tags)) &&
      typeof series.status === 'string' &&
      ['planning', 'active', 'completed', 'archived'].includes(series.status as string) &&
      typeof series.created_at === 'string' &&
      typeof series.updated_at === 'string' &&
      (series.deleted_at === null || typeof series.deleted_at === 'string')
    );
  }

  /**
   * Validate sermon record from API
   */
  static validateAPISermonRecord(record: unknown): record is APISermonRecord {
    if (typeof record !== 'object' || record === null) {
      return false;
    }

    const sermon = record as Record<string, unknown>;
    
    return (
      typeof sermon.id === 'string' &&
      typeof sermon.user_id === 'string' &&
      typeof sermon.title === 'string' &&
      (sermon.content === null || typeof sermon.content === 'string') &&
      (sermon.scripture === null || typeof sermon.scripture === 'string') &&
      (sermon.tags === null || Array.isArray(sermon.tags)) &&
      typeof sermon.status === 'string' &&
      ['draft', 'preparing', 'ready', 'delivered', 'archived'].includes(sermon.status as string) &&
      typeof sermon.visibility === 'string' &&
      ['private', 'congregation', 'public'].includes(sermon.visibility as string) &&
      (sermon.date === null || typeof sermon.date === 'string') &&
      (sermon.notes === null || typeof sermon.notes === 'string') &&
      (sermon.series_id === null || typeof sermon.series_id === 'string') &&
      typeof sermon.created_at === 'string' &&
      typeof sermon.updated_at === 'string' &&
      (sermon.deleted_at === null || typeof sermon.deleted_at === 'string')
    );
  }

  /**
   * Validate series list response
   */
  static validateSeriesListResponse(response: unknown): response is SeriesListResponse {
    if (!this.validateBaseResponse(response)) {
      return false;
    }

    const resp = response as BaseAPIResponse;
    if (!resp.success || !resp.data) {
      return false;
    }

    const data = resp.data as Record<string, unknown>;
    
    return (
      Array.isArray(data.series) &&
      data.series.every(series => this.validateAPISeriesRecord(series)) &&
      this.validatePaginationMeta(data.pagination)
    );
  }

  /**
   * Validate sermon list response
   */
  static validateSermonListResponse(response: unknown): response is SermonListResponse {
    if (!this.validateBaseResponse(response)) {
      return false;
    }

    const resp = response as BaseAPIResponse;
    if (!resp.success || !resp.data) {
      return false;
    }

    const data = resp.data as Record<string, unknown>;
    
    return (
      Array.isArray(data.sermons) &&
      data.sermons.every(sermon => this.validateAPISermonRecord(sermon)) &&
      this.validatePaginationMeta(data.pagination)
    );
  }

  /**
   * Validate sync pull response
   */
  static validateSyncPullResponse<T>(
    response: unknown,
    recordValidator: (record: unknown) => boolean
  ): response is SyncPullResponse<T> {
    if (!this.validateBaseResponse(response)) {
      return false;
    }

    const resp = response as BaseAPIResponse;
    if (!resp.success || !resp.data) {
      return false;
    }

    const data = resp.data as Record<string, unknown>;
    
    return (
      Array.isArray(data.records) &&
      data.records.every(recordValidator) &&
      typeof data.lastUpdated === 'string' &&
      (data.pagination === undefined || this.validatePaginationMeta(data.pagination))
    );
  }
}

// HTTP status codes for API responses
export enum HTTPStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// Common API error codes
export enum APIErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Sync-specific errors
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  SYNC_FAILED = 'SYNC_FAILED',
  OUTDATED_DATA = 'OUTDATED_DATA',
}