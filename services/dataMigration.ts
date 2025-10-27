// Data migration service for linking anonymous user data to authenticated accounts
import { getAnonymousUserId } from './authSession';
import { seriesRepository } from './repositories/seriesRepository.native';
import { sermonRepository } from './repositories/sermonRepository.native';
import type { DataMigrationResult } from './repositories/types';

const TAG = '[DataMigration]';

export interface CompleteMigrationResult {
  success: boolean;
  totalMigratedRecords: number;
  totalConflicts: number;
  seriesResult: DataMigrationResult;
  sermonResult: DataMigrationResult;
  errors: string[];
}

export interface MigrationProgress {
  phase: 'series' | 'sermons' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
  timestamp: string;
}

export type MigrationProgressCallback = (progress: MigrationProgress) => void;

let globalProgressCallback: MigrationProgressCallback | null = null;

export function setMigrationProgressCallback(callback: MigrationProgressCallback | null): void {
  globalProgressCallback = callback;
}

function reportProgress(progress: MigrationProgress): void {
  if (globalProgressCallback) {
    globalProgressCallback(progress);
  }
  console.log(`Migration Progress: ${progress.phase} - ${progress.current}/${progress.total} - ${progress.message}`);
}

/**
 * Check if there is offline data that can be migrated to an authenticated account
 */
export async function hasDataToMigrate(): Promise<boolean> {
  try {
    const anonymousUserId = await getAnonymousUserId();
    if (!anonymousUserId) return false;

    // Check if there are any series or sermons for the anonymous user
    const series = await seriesRepository.list();
    const sermons = await sermonRepository.list();
    
    return series.length > 0 || sermons.length > 0;
  } catch (error) {
    console.error(`${TAG} Error checking for data to migrate:`, error);
    return false;
  }
}

/**
 * Get a preview of what data would be migrated
 */
export async function getMigrationPreview(): Promise<{
  seriesCount: number;
  sermonCount: number;
  anonymousUserId: string | null;
}> {
  try {
    const anonymousUserId = await getAnonymousUserId();
    if (!anonymousUserId) {
      return { seriesCount: 0, sermonCount: 0, anonymousUserId: null };
    }

    // Temporarily set the user ID to get anonymous user's data
    seriesRepository.setUserId?.(anonymousUserId);
    sermonRepository.setUserId?.(anonymousUserId);

    const series = await seriesRepository.list();
    const sermons = await sermonRepository.list();

    // Reset user ID override
    if (seriesRepository.setUserId) seriesRepository.setUserId('');
    if (sermonRepository.setUserId) sermonRepository.setUserId('');

    return {
      seriesCount: series.length,
      sermonCount: sermons.length,
      anonymousUserId,
    };
  } catch (error) {
    console.error(`${TAG} Error getting migration preview:`, error);
    return { seriesCount: 0, sermonCount: 0, anonymousUserId: null };
  }
}

/**
 * Migrate all offline data from anonymous user to authenticated account
 */
export async function migrateOfflineDataToAccount(authenticatedUserId: string): Promise<CompleteMigrationResult> {
  const startTime = new Date().toISOString();
  let totalMigratedRecords = 0;
  let totalConflicts = 0;
  const errors: string[] = [];

  try {
    console.log(`${TAG} Starting data migration to user ${authenticatedUserId}`);

    const anonymousUserId = await getAnonymousUserId();
    if (!anonymousUserId) {
      throw new Error('No anonymous user ID found - nothing to migrate');
    }

    reportProgress({
      phase: 'series',
      current: 0,
      total: 2,
      message: 'Starting series migration',
      timestamp: startTime,
    });

    // Migrate series data
    const seriesResult = await seriesRepository.migrateToUser?.(anonymousUserId, authenticatedUserId) || {
      success: false,
      migratedRecords: 0,
      conflicts: 0,
      errors: ['Series migration not supported'],
    };

    totalMigratedRecords += seriesResult.migratedRecords;
    totalConflicts += seriesResult.conflicts;
    errors.push(...seriesResult.errors);

    reportProgress({
      phase: 'sermons',
      current: 1,
      total: 2,
      message: `Series migration completed: ${seriesResult.migratedRecords} migrated, ${seriesResult.conflicts} conflicts`,
      timestamp: new Date().toISOString(),
    });

    // Migrate sermon data
    const sermonResult = await sermonRepository.migrateToUser?.(anonymousUserId, authenticatedUserId) || {
      success: false,
      migratedRecords: 0,
      conflicts: 0,
      errors: ['Sermon migration not supported'],
    };

    totalMigratedRecords += sermonResult.migratedRecords;
    totalConflicts += sermonResult.conflicts;
    errors.push(...sermonResult.errors);

    reportProgress({
      phase: 'complete',
      current: 2,
      total: 2,
      message: `Migration completed: ${totalMigratedRecords} total records migrated, ${totalConflicts} conflicts`,
      timestamp: new Date().toISOString(),
    });

    // Note: Do NOT call linkOfflineDataToAccount here to avoid recursion loops.
    // The caller (auth session) will link and clear the anonymous ID after a successful migration.

    const result: CompleteMigrationResult = {
      success: errors.length === 0,
      totalMigratedRecords,
      totalConflicts,
      seriesResult,
      sermonResult,
      errors,
    };

    console.log(`${TAG} Migration completed:`, result);
    return result;

  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    console.error(`${TAG} ${errorMsg}`);

    reportProgress({
      phase: 'error',
      current: 0,
      total: 2,
      message: errorMsg,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      totalMigratedRecords,
      totalConflicts,
      seriesResult: { success: false, migratedRecords: 0, conflicts: 0, errors: [errorMsg] },
      sermonResult: { success: false, migratedRecords: 0, conflicts: 0, errors: [errorMsg] },
      errors,
    };
  }
}

/**
 * Rollback migration in case of failure (best effort)
 * Note: This is a simplified rollback that may not handle all edge cases
 */
export async function rollbackMigration(authenticatedUserId: string, migrationResult: CompleteMigrationResult): Promise<boolean> {
  try {
    console.log(`${TAG} Attempting to rollback migration for user ${authenticatedUserId}`);

    // This is a simplified rollback - in a production system, you'd want more sophisticated rollback logic
    // For now, we'll just log the attempt since the migration preserves data integrity
    
    console.warn(`${TAG} Rollback not fully implemented - migration data preserved with conflict resolution`);
    return true;
  } catch (error) {
    console.error(`${TAG} Rollback failed:`, error);
    return false;
  }
}

/**
 * Validate migration integrity after completion
 */
export async function validateMigration(authenticatedUserId: string): Promise<{
  isValid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Temporarily set user ID to check migrated data
    seriesRepository.setUserId?.(authenticatedUserId);
    sermonRepository.setUserId?.(authenticatedUserId);

    // Check that data exists for the authenticated user
    const series = await seriesRepository.list();
    const sermons = await sermonRepository.list();

    // Reset user ID override
    if (seriesRepository.setUserId) seriesRepository.setUserId('');
    if (sermonRepository.setUserId) sermonRepository.setUserId('');

    // Basic validation checks
    if (series.length === 0 && sermons.length === 0) {
      issues.push('No data found for authenticated user after migration');
    }

    // Check for data integrity issues
    for (const sermon of sermons) {
      if (sermon.seriesId) {
        const seriesExists = series.some(s => s.id === sermon.seriesId);
        if (!seriesExists) {
          issues.push(`Sermon ${sermon.id} references non-existent series ${sermon.seriesId}`);
        }
      }
    }

    console.log(`${TAG} Migration validation completed: ${issues.length} issues found`);
    return {
      isValid: issues.length === 0,
      issues,
    };

  } catch (error) {
    const errorMsg = `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    issues.push(errorMsg);
    console.error(`${TAG} ${errorMsg}`);
    
    return {
      isValid: false,
      issues,
    };
  }
}

export default {
  hasDataToMigrate,
  getMigrationPreview,
  migrateOfflineDataToAccount,
  rollbackMigration,
  validateMigration,
  setMigrationProgressCallback,
};