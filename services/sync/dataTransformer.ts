/**
 * Data transformation utilities for converting between SQLite schema and ExpressJS API format
 * Handles field name conversions, data validation, and sanitization
 */

import { SeriesDTO, SermonDTO } from '../repositories/types';

// SQLite record types (internal representation)
export interface SQLiteSeriesRecord {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_date?: string | null; // ISO date string
  end_date?: string | null; // ISO date string
  image_url?: string | null;
  tags: string; // JSON string
  status: 'planning' | 'active' | 'completed' | 'archived';
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  deleted_at?: string | null; // ISO datetime string
  synced_at?: string | null;
  dirty: number; // 0 or 1
  op: 'upsert' | 'delete';
  version: number;
}

export interface SQLiteSermonRecord {
  id: string;
  user_id: string;
  title: string;
  content?: string | null;
  outline?: string | null; // JSON string
  scripture?: string | null;
  tags: string; // JSON string
  status: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
  visibility: 'private' | 'congregation' | 'public';
  date?: string | null; // ISO datetime string
  notes?: string | null;
  series_id?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  deleted_at?: string | null; // ISO datetime string
  synced_at?: string | null;
  dirty: number; // 0 or 1
  op: 'upsert' | 'delete';
  version: number;
}

// ExpressJS API types (external representation)
export interface APISeriesRecord {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_date?: string | null; // ISO date string
  end_date?: string | null; // ISO date string
  image_url?: string | null;
  tags?: string[] | null;
  status: 'planning' | 'active' | 'completed' | 'archived';
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  deleted_at?: string | null; // ISO datetime string
}

export interface APISermonRecord {
  id: string;
  user_id: string;
  title: string;
  content?: string | null;
  outline?: unknown | null; // JSON object
  scripture?: string | null;
  tags?: string[] | null;
  status: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
  visibility: 'private' | 'congregation' | 'public';
  date?: string | null; // ISO datetime string
  notes?: string | null;
  series_id?: string | null;
  duration?: number | null;
  audio_url?: string | null;
  video_url?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  deleted_at?: string | null; // ISO datetime string
}

/**
 * Utility functions for JSON parsing with fallbacks
 */
function parseJsonSafe<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error);
    return fallback;
  }
}

function stringifyJsonSafe(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('Failed to stringify JSON:', value, error);
    return JSON.stringify(null);
  }
}

/**
 * Validates and sanitizes string input
 */
function sanitizeString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

/**
 * Validates and sanitizes array input
 */
function sanitizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  return [];
}

/**
 * Validates ISO date string
 */
function validateISODate(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : value.trim();
  }
  return null;
}

/**
 * Data transformation class for series and sermons
 */
export class DataTransformer {
  /**
   * Convert SQLite series record to API format for pushing to ExpressJS
   */
  static seriesToApi(sqliteRecord: SQLiteSeriesRecord): APISeriesRecord {
    return {
      id: sqliteRecord.id,
      user_id: sqliteRecord.user_id,
      title: sqliteRecord.title,
      description: sanitizeString(sqliteRecord.description),
      start_date: validateISODate(sqliteRecord.start_date),
      end_date: validateISODate(sqliteRecord.end_date),
      image_url: sanitizeString(sqliteRecord.image_url),
      tags: sanitizeStringArray(parseJsonSafe(sqliteRecord.tags, [])),
      status: sqliteRecord.status,
      created_at: sqliteRecord.created_at,
      updated_at: sqliteRecord.updated_at,
      deleted_at: validateISODate(sqliteRecord.deleted_at),
    };
  }

  /**
   * Convert API series record to SQLite format for storing locally
   */
  static seriesFromApi(apiRecord: APISeriesRecord): Partial<SQLiteSeriesRecord> {
    return {
      id: apiRecord.id,
      user_id: apiRecord.user_id,
      title: apiRecord.title,
      description: sanitizeString(apiRecord.description),
      start_date: validateISODate(apiRecord.start_date),
      end_date: validateISODate(apiRecord.end_date),
      image_url: sanitizeString(apiRecord.image_url),
      tags: stringifyJsonSafe(sanitizeStringArray(apiRecord.tags)),
      status: apiRecord.status,
      created_at: apiRecord.created_at,
      updated_at: apiRecord.updated_at,
      deleted_at: validateISODate(apiRecord.deleted_at),
      // Sync metadata will be set by the sync service
      synced_at: new Date().toISOString(),
      dirty: 0,
      op: 'upsert' as const,
      version: 0,
    };
  }

  /**
   * Convert SQLite sermon record to API format for pushing to ExpressJS
   */
  static sermonToApi(sqliteRecord: SQLiteSermonRecord): APISermonRecord {
    return {
      id: sqliteRecord.id,
      user_id: sqliteRecord.user_id,
      title: sqliteRecord.title,
      content: sanitizeString(sqliteRecord.content),
      outline: parseJsonSafe(sqliteRecord.outline, null),
      scripture: sanitizeString(sqliteRecord.scripture),
      tags: sanitizeStringArray(parseJsonSafe(sqliteRecord.tags, [])),
      status: sqliteRecord.status,
      visibility: sqliteRecord.visibility,
      date: validateISODate(sqliteRecord.date),
      notes: sanitizeString(sqliteRecord.notes),
      series_id: sanitizeString(sqliteRecord.series_id),
      created_at: sqliteRecord.created_at,
      updated_at: sqliteRecord.updated_at,
      deleted_at: validateISODate(sqliteRecord.deleted_at),
    };
  }

  /**
   * Convert API sermon record to SQLite format for storing locally
   */
  static sermonFromApi(apiRecord: APISermonRecord): Partial<SQLiteSermonRecord> {
    return {
      id: apiRecord.id,
      user_id: apiRecord.user_id,
      title: apiRecord.title,
      content: sanitizeString(apiRecord.content),
      outline: stringifyJsonSafe(apiRecord.outline),
      scripture: sanitizeString(apiRecord.scripture),
      tags: stringifyJsonSafe(sanitizeStringArray(apiRecord.tags)),
      status: apiRecord.status,
      visibility: apiRecord.visibility,
      date: validateISODate(apiRecord.date),
      notes: sanitizeString(apiRecord.notes),
      series_id: sanitizeString(apiRecord.series_id),
      created_at: apiRecord.created_at,
      updated_at: apiRecord.updated_at,
      deleted_at: validateISODate(apiRecord.deleted_at),
      // Sync metadata will be set by the sync service
      synced_at: new Date().toISOString(),
      dirty: 0,
      op: 'upsert' as const,
      version: 0,
    };
  }

  /**
   * Convert SQLite series record to repository DTO format
   */
  static seriesRecordToDTO(sqliteRecord: SQLiteSeriesRecord): SeriesDTO {
    return {
      id: sqliteRecord.id,
      userId: sqliteRecord.user_id,
      title: sqliteRecord.title,
      description: sqliteRecord.description,
      startDate: sqliteRecord.start_date,
      endDate: sqliteRecord.end_date,
      imageUrl: sqliteRecord.image_url,
      tags: sanitizeStringArray(parseJsonSafe(sqliteRecord.tags, [])),
      status: sqliteRecord.status,
      createdAt: sqliteRecord.created_at,
      updatedAt: sqliteRecord.updated_at,
    };
  }

  /**
   * Convert SQLite sermon record to repository DTO format
   */
  static sermonRecordToDTO(sqliteRecord: SQLiteSermonRecord): SermonDTO {
    return {
      id: sqliteRecord.id,
      userId: sqliteRecord.user_id,
      title: sqliteRecord.title,
      content: sqliteRecord.content,
      outline: parseJsonSafe(sqliteRecord.outline, null),
      scripture: sqliteRecord.scripture,
      tags: sanitizeStringArray(parseJsonSafe(sqliteRecord.tags, [])),
      status: sqliteRecord.status,
      visibility: sqliteRecord.visibility,
      date: sqliteRecord.date,
      notes: sqliteRecord.notes,
      seriesId: sqliteRecord.series_id,
      createdAt: sqliteRecord.created_at,
      updatedAt: sqliteRecord.updated_at,
    };
  }

  /**
   * Validate series data before API submission
   */
  static validateSeriesForApi(data: APISeriesRecord): string[] {
    const errors: string[] = [];

    if (!data.id || typeof data.id !== 'string') {
      errors.push('Series ID is required and must be a string');
    }

    if (!data.user_id || typeof data.user_id !== 'string') {
      errors.push('User ID is required and must be a string');
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Series title is required and must be a non-empty string');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Series title must be 255 characters or less');
    }

    if (data.image_url && data.image_url.length > 500) {
      errors.push('Image URL must be 500 characters or less');
    }

    if (data.status && !['planning', 'active', 'completed', 'archived'].includes(data.status)) {
      errors.push('Series status must be one of: planning, active, completed, archived');
    }

    return errors;
  }

  /**
   * Validate sermon data before API submission
   */
  static validateSermonForApi(data: APISermonRecord): string[] {
    const errors: string[] = [];

    if (!data.id || typeof data.id !== 'string') {
      errors.push('Sermon ID is required and must be a string');
    }

    if (!data.user_id || typeof data.user_id !== 'string') {
      errors.push('User ID is required and must be a string');
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Sermon title is required and must be a non-empty string');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Sermon title must be 255 characters or less');
    }

    if (data.status && !['draft', 'preparing', 'ready', 'delivered', 'archived'].includes(data.status)) {
      errors.push('Sermon status must be one of: draft, preparing, ready, delivered, archived');
    }

    if (data.visibility && !['private', 'congregation', 'public'].includes(data.visibility)) {
      errors.push('Sermon visibility must be one of: private, congregation, public');
    }

    return errors;
  }
}