import * as dataMigration from '../dataMigration';
import { seriesRepository } from '../repositories/seriesRepository.native';
import { sermonRepository } from '../repositories/sermonRepository.native';
import * as authSession from '../authSession';
import type { DataMigrationResult } from '../repositories/types';

// Mock dependencies
jest.mock('../repositories/seriesRepository.native');
jest.mock('../repositories/sermonRepository.native');
jest.mock('../authSession');

const mockSeriesRepository = seriesRepository as jest.Mocked<typeof seriesRepository>;
const mockSermonRepository = sermonRepository as jest.Mocked<typeof sermonRepository>;
const mockAuthSession = authSession as jest.Mocked<typeof authSession>;

describe('DataMigration - Account Linking', () => {
  const mockAnonymousUserId = 'anon_1234567890_test';
  const mockAuthenticatedUserId = 'auth-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockAuthSession.getAnonymousUserId.mockResolvedValue(mockAnonymousUserId);
    mockAuthSession.linkOfflineDataToAccount.mockResolvedValue();
    
    mockSeriesRepository.list.mockResolvedValue([]);
    mockSermonRepository.list.mockResolvedValue([]);
    mockSeriesRepository.setUserId = jest.fn();
    mockSermonRepository.setUserId = jest.fn();
    mockSeriesRepository.migrateToUser = jest.fn();
    mockSermonRepository.migrateToUser = jest.fn();
  });

  describe('hasDataToMigrate', () => {
    it('should return true when anonymous user has series data', async () => {
      mockSeriesRepository.list.mockResolvedValueOnce([
        { id: 'series-1', title: 'Test Series', userId: mockAnonymousUserId }
      ] as any);

      const result = await dataMigration.hasDataToMigrate();

      expect(result).toBe(true);
    });

    it('should return true when anonymous user has sermon data', async () => {
      mockSermonRepository.list.mockResolvedValueOnce([
        { id: 'sermon-1', title: 'Test Sermon', userId: mockAnonymousUserId }
      ] as any);

      const result = await dataMigration.hasDataToMigrate();

      expect(result).toBe(true);
    });

    it('should return true when anonymous user has both series and sermon data', async () => {
      mockSeriesRepository.list.mockResolvedValueOnce([
        { id: 'series-1', title: 'Test Series', userId: mockAnonymousUserId }
      ] as any);
      mockSermonRepository.list.mockResolvedValueOnce([
        { id: 'sermon-1', title: 'Test Sermon', userId: mockAnonymousUserId }
      ] as any);

      const result = await dataMigration.hasDataToMigrate();

      expect(result).toBe(true);
    });

    it('should return false when no anonymous user ID exists', async () => {
      mockAuthSession.getAnonymousUserId.mockResolvedValueOnce(null);

      const result = await dataMigration.hasDataToMigrate();

      expect(result).toBe(false);
      expect(mockSeriesRepository.list).not.toHaveBeenCalled();
      expect(mockSermonRepository.list).not.toHaveBeenCalled();
    });

    it('should return false when anonymous user has no data', async () => {
      mockSeriesRepository.list.mockResolvedValueOnce([]);
      mockSermonRepository.list.mockResolvedValueOnce([]);

      const result = await dataMigration.hasDataToMigrate();

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockSeriesRepository.list.mockRejectedValueOnce(new Error('Database error'));

      const result = await dataMigration.hasDataToMigrate();

      expect(result).toBe(false);
    });
  });

  describe('getMigrationPreview', () => {
    it('should return preview with series and sermon counts', async () => {
      const mockSeries = [
        { id: 'series-1', title: 'Series 1' },
        { id: 'series-2', title: 'Series 2' }
      ];
      const mockSermons = [
        { id: 'sermon-1', title: 'Sermon 1' },
        { id: 'sermon-2', title: 'Sermon 2' },
        { id: 'sermon-3', title: 'Sermon 3' }
      ];

      mockSeriesRepository.list.mockResolvedValueOnce(mockSeries as any);
      mockSermonRepository.list.mockResolvedValueOnce(mockSermons as any);

      const result = await dataMigration.getMigrationPreview();

      expect(result).toEqual({
        seriesCount: 2,
        sermonCount: 3,
        anonymousUserId: mockAnonymousUserId,
      });

      // Verify repositories were called with anonymous user ID
      expect(mockSeriesRepository.setUserId).toHaveBeenCalledWith(mockAnonymousUserId);
      expect(mockSermonRepository.setUserId).toHaveBeenCalledWith(mockAnonymousUserId);
      
      // Verify user ID was reset after preview
      expect(mockSeriesRepository.setUserId).toHaveBeenCalledWith('');
      expect(mockSermonRepository.setUserId).toHaveBeenCalledWith('');
    });

    it('should return empty preview when no anonymous user ID exists', async () => {
      mockAuthSession.getAnonymousUserId.mockResolvedValueOnce(null);

      const result = await dataMigration.getMigrationPreview();

      expect(result).toEqual({
        seriesCount: 0,
        sermonCount: 0,
        anonymousUserId: null,
      });

      expect(mockSeriesRepository.list).not.toHaveBeenCalled();
      expect(mockSermonRepository.list).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      mockSeriesRepository.list.mockRejectedValueOnce(new Error('Database error'));

      const result = await dataMigration.getMigrationPreview();

      expect(result).toEqual({
        seriesCount: 0,
        sermonCount: 0,
        anonymousUserId: null,
      });
    });

    it('should reset user ID even when errors occur', async () => {
      mockSeriesRepository.list.mockRejectedValueOnce(new Error('Database error'));

      await dataMigration.getMigrationPreview();

      expect(mockSeriesRepository.setUserId).toHaveBeenCalledWith('');
      expect(mockSermonRepository.setUserId).toHaveBeenCalledWith('');
    });
  });

  describe('migrateOfflineDataToAccount', () => {
    const mockSeriesResult: DataMigrationResult = {
      success: true,
      migratedRecords: 2,
      conflicts: 0,
      errors: [],
    };

    const mockSermonResult: DataMigrationResult = {
      success: true,
      migratedRecords: 3,
      conflicts: 1,
      errors: [],
    };

    beforeEach(() => {
      mockSeriesRepository.migrateToUser!.mockResolvedValue(mockSeriesResult);
      mockSermonRepository.migrateToUser!.mockResolvedValue(mockSermonResult);
    });

    it('should successfully migrate all data to authenticated account', async () => {
      const result = await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);

      expect(result).toEqual({
        success: true,
        totalMigratedRecords: 5,
        totalConflicts: 1,
        seriesResult: mockSeriesResult,
        sermonResult: mockSermonResult,
        errors: [],
      });

      expect(mockSeriesRepository.migrateToUser).toHaveBeenCalledWith(
        mockAnonymousUserId,
        mockAuthenticatedUserId
      );
      expect(mockSermonRepository.migrateToUser).toHaveBeenCalledWith(
        mockAnonymousUserId,
        mockAuthenticatedUserId
      );
      expect(mockAuthSession.linkOfflineDataToAccount).toHaveBeenCalledWith(mockAuthenticatedUserId);
    });

    it('should handle case when no anonymous user ID exists', async () => {
      mockAuthSession.getAnonymousUserId.mockResolvedValueOnce(null);

      await expect(dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId))
        .rejects.toThrow('No anonymous user ID found - nothing to migrate');

      expect(mockSeriesRepository.migrateToUser).not.toHaveBeenCalled();
      expect(mockSermonRepository.migrateToUser).not.toHaveBeenCalled();
    });

    it('should handle series migration failure', async () => {
      const failedSeriesResult: DataMigrationResult = {
        success: false,
        migratedRecords: 0,
        conflicts: 0,
        errors: ['Series migration failed'],
      };

      mockSeriesRepository.migrateToUser!.mockResolvedValueOnce(failedSeriesResult);

      const result = await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Series migration failed');
      expect(result.seriesResult).toEqual(failedSeriesResult);
      expect(mockAuthSession.linkOfflineDataToAccount).not.toHaveBeenCalled();
    });

    it('should handle sermon migration failure', async () => {
      const failedSermonResult: DataMigrationResult = {
        success: false,
        migratedRecords: 0,
        conflicts: 0,
        errors: ['Sermon migration failed'],
      };

      mockSermonRepository.migrateToUser!.mockResolvedValueOnce(failedSermonResult);

      const result = await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Sermon migration failed');
      expect(result.sermonResult).toEqual(failedSermonResult);
      expect(mockAuthSession.linkOfflineDataToAccount).not.toHaveBeenCalled();
    });

    it('should continue migration when auth session linking fails', async () => {
      mockAuthSession.linkOfflineDataToAccount.mockRejectedValueOnce(new Error('Linking failed'));

      const result = await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to link offline data to account: Linking failed');
      expect(result.totalMigratedRecords).toBe(5);
      expect(result.totalConflicts).toBe(1);
    });

    it('should handle repositories without migration support', async () => {
      mockSeriesRepository.migrateToUser = undefined;
      mockSermonRepository.migrateToUser = undefined;

      const result = await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Series migration not supported');
      expect(result.errors).toContain('Sermon migration not supported');
    });

    it('should handle migration errors gracefully', async () => {
      mockSeriesRepository.migrateToUser!.mockRejectedValueOnce(new Error('Database error'));

      const result = await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Migration failed: Database error');
    });

    it('should accumulate errors from multiple sources', async () => {
      const seriesResultWithErrors: DataMigrationResult = {
        success: true,
        migratedRecords: 1,
        conflicts: 0,
        errors: ['Series warning'],
      };

      const sermonResultWithErrors: DataMigrationResult = {
        success: true,
        migratedRecords: 2,
        conflicts: 1,
        errors: ['Sermon warning'],
      };

      mockSeriesRepository.migrateToUser!.mockResolvedValueOnce(seriesResultWithErrors);
      mockSermonRepository.migrateToUser!.mockResolvedValueOnce(sermonResultWithErrors);
      mockAuthSession.linkOfflineDataToAccount.mockRejectedValueOnce(new Error('Link error'));

      const result = await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);

      expect(result.errors).toEqual([
        'Series warning',
        'Sermon warning',
        'Failed to link offline data to account: Link error',
      ]);
    });
  });

  describe('validateMigration', () => {
    it('should validate successful migration with data integrity', async () => {
      const mockSeries = [
        { id: 'series-1', title: 'Series 1' },
        { id: 'series-2', title: 'Series 2' }
      ];
      const mockSermons = [
        { id: 'sermon-1', title: 'Sermon 1', seriesId: 'series-1' },
        { id: 'sermon-2', title: 'Sermon 2', seriesId: 'series-2' },
        { id: 'sermon-3', title: 'Sermon 3', seriesId: null }
      ];

      mockSeriesRepository.list.mockResolvedValueOnce(mockSeries as any);
      mockSermonRepository.list.mockResolvedValueOnce(mockSermons as any);

      const result = await dataMigration.validateMigration(mockAuthenticatedUserId);

      expect(result.isValid).toBe(true);
      expect(result.issues).toEqual([]);

      // Verify repositories were called with authenticated user ID
      expect(mockSeriesRepository.setUserId).toHaveBeenCalledWith(mockAuthenticatedUserId);
      expect(mockSermonRepository.setUserId).toHaveBeenCalledWith(mockAuthenticatedUserId);
      
      // Verify user ID was reset after validation
      expect(mockSeriesRepository.setUserId).toHaveBeenCalledWith('');
      expect(mockSermonRepository.setUserId).toHaveBeenCalledWith('');
    });

    it('should detect missing data after migration', async () => {
      mockSeriesRepository.list.mockResolvedValueOnce([]);
      mockSermonRepository.list.mockResolvedValueOnce([]);

      const result = await dataMigration.validateMigration(mockAuthenticatedUserId);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('No data found for authenticated user after migration');
    });

    it('should detect data integrity issues with missing series references', async () => {
      const mockSeries = [
        { id: 'series-1', title: 'Series 1' }
      ];
      const mockSermons = [
        { id: 'sermon-1', title: 'Sermon 1', seriesId: 'series-1' },
        { id: 'sermon-2', title: 'Sermon 2', seriesId: 'missing-series' }
      ];

      mockSeriesRepository.list.mockResolvedValueOnce(mockSeries as any);
      mockSermonRepository.list.mockResolvedValueOnce(mockSermons as any);

      const result = await dataMigration.validateMigration(mockAuthenticatedUserId);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Sermon sermon-2 references non-existent series missing-series');
    });

    it('should handle validation errors gracefully', async () => {
      mockSeriesRepository.list.mockRejectedValueOnce(new Error('Database error'));

      const result = await dataMigration.validateMigration(mockAuthenticatedUserId);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Validation failed: Database error');
    });

    it('should reset user ID even when validation fails', async () => {
      mockSeriesRepository.list.mockRejectedValueOnce(new Error('Database error'));

      await dataMigration.validateMigration(mockAuthenticatedUserId);

      expect(mockSeriesRepository.setUserId).toHaveBeenCalledWith('');
      expect(mockSermonRepository.setUserId).toHaveBeenCalledWith('');
    });

    it('should allow sermons without series references', async () => {
      const mockSeries = [
        { id: 'series-1', title: 'Series 1' }
      ];
      const mockSermons = [
        { id: 'sermon-1', title: 'Sermon 1', seriesId: 'series-1' },
        { id: 'sermon-2', title: 'Sermon 2', seriesId: null },
        { id: 'sermon-3', title: 'Sermon 3', seriesId: undefined }
      ];

      mockSeriesRepository.list.mockResolvedValueOnce(mockSeries as any);
      mockSermonRepository.list.mockResolvedValueOnce(mockSermons as any);

      const result = await dataMigration.validateMigration(mockAuthenticatedUserId);

      expect(result.isValid).toBe(true);
      expect(result.issues).toEqual([]);
    });
  });

  describe('Migration Progress Tracking', () => {
    it('should call progress callback during migration', async () => {
      const progressCallback = jest.fn();
      dataMigration.setMigrationProgressCallback(progressCallback);

      mockSeriesRepository.migrateToUser!.mockResolvedValue({
        success: true,
        migratedRecords: 2,
        conflicts: 0,
        errors: [],
      });

      mockSermonRepository.migrateToUser!.mockResolvedValue({
        success: true,
        migratedRecords: 3,
        conflicts: 1,
        errors: [],
      });

      await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'series',
          current: 0,
          total: 2,
          message: 'Starting series migration',
        })
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'sermons',
          current: 1,
          total: 2,
          message: 'Series migration completed: 2 migrated, 0 conflicts',
        })
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'complete',
          current: 2,
          total: 2,
          message: 'Migration completed: 5 total records migrated, 1 conflicts',
        })
      );

      // Clean up
      dataMigration.setMigrationProgressCallback(null);
    });

    it('should call progress callback on migration error', async () => {
      const progressCallback = jest.fn();
      dataMigration.setMigrationProgressCallback(progressCallback);

      mockAuthSession.getAnonymousUserId.mockResolvedValueOnce(null);

      await expect(dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId))
        .rejects.toThrow();

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'error',
          message: 'Migration failed: No anonymous user ID found - nothing to migrate',
        })
      );

      // Clean up
      dataMigration.setMigrationProgressCallback(null);
    });

    it('should handle null progress callback gracefully', async () => {
      dataMigration.setMigrationProgressCallback(null);

      mockSeriesRepository.migrateToUser!.mockResolvedValue({
        success: true,
        migratedRecords: 1,
        conflicts: 0,
        errors: [],
      });

      mockSermonRepository.migrateToUser!.mockResolvedValue({
        success: true,
        migratedRecords: 1,
        conflicts: 0,
        errors: [],
      });

      // Should not throw error
      await dataMigration.migrateOfflineDataToAccount(mockAuthenticatedUserId);
    });
  });

  describe('rollbackMigration', () => {
    it('should attempt rollback and return success', async () => {
      const mockMigrationResult = {
        success: false,
        totalMigratedRecords: 3,
        totalConflicts: 1,
        seriesResult: { success: true, migratedRecords: 1, conflicts: 0, errors: [] },
        sermonResult: { success: false, migratedRecords: 2, conflicts: 1, errors: ['Error'] },
        errors: ['Error'],
      };

      const result = await dataMigration.rollbackMigration(mockAuthenticatedUserId, mockMigrationResult);

      expect(result).toBe(true);
    });

    it('should handle rollback errors', async () => {
      // Mock console methods to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockMigrationResult = {
        success: false,
        totalMigratedRecords: 0,
        totalConflicts: 0,
        seriesResult: { success: false, migratedRecords: 0, conflicts: 0, errors: [] },
        sermonResult: { success: false, migratedRecords: 0, conflicts: 0, errors: [] },
        errors: [],
      };

      const result = await dataMigration.rollbackMigration(mockAuthenticatedUserId, mockMigrationResult);

      expect(result).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });
});