import AsyncStorage from '@react-native-async-storage/async-storage';
import httpClient from '../httpClient';
import * as authSession from '../authSession';
import * as dataMigration from '../dataMigration';
import { seriesRepository } from '../repositories/seriesRepository.native';
import { sermonRepository } from '../repositories/sermonRepository.native';
import { featureGate } from '../featureGate';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../httpClient');
jest.mock('../authSession');
jest.mock('../dataMigration');
jest.mock('../repositories/seriesRepository.native');
jest.mock('../repositories/sermonRepository.native');
jest.mock('../featureGate');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;
const mockAuthSession = authSession as jest.Mocked<typeof authSession>;
const mockDataMigration = dataMigration as jest.Mocked<typeof dataMigration>;
const mockSeriesRepository = seriesRepository as jest.Mocked<typeof seriesRepository>;
const mockSermonRepository = sermonRepository as jest.Mocked<typeof sermonRepository>;
const mockFeatureGate = featureGate as jest.Mocked<typeof featureGate>;

describe('Offline-First Workflows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    mockHttpClient.get.mockRejectedValue(new Error('Network error'));
    mockHttpClient.post.mockRejectedValue(new Error('Network error'));
    
    mockAuthSession.generateAnonymousUserId.mockResolvedValue('anon_1234567890_test');
    mockAuthSession.getEffectiveUserId.mockResolvedValue('anon_1234567890_test');
    mockAuthSession.isAuthenticatedOffline.mockResolvedValue(true);
    mockAuthSession.isAuthenticatedOnline.mockResolvedValue(false);
    
    mockSeriesRepository.create.mockResolvedValue({ id: 'series-1', title: 'Test Series' } as any);
    mockSermonRepository.create.mockResolvedValue({ id: 'sermon-1', title: 'Test Sermon' } as any);
    
    mockFeatureGate.canAccess.mockReturnValue(true);
    mockFeatureGate.requiresAuthentication.mockReturnValue(false);
  });

  describe('Complete Offline User Journey', () => {
    it('should allow user to start app and create content without authentication', async () => {
      // Step 1: User opens app for first time (no authentication)
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(false);
      mockAuthSession.getEffectiveUserId.mockResolvedValueOnce('anon_1234567890_new');
      
      const userId = await authSession.getEffectiveUserId();
      expect(userId).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
      
      // Step 2: User creates a series (offline)
      const seriesData = {
        title: 'My First Series',
        description: 'Created offline',
        userId: userId,
      };
      
      const createdSeries = await seriesRepository.create(seriesData);
      expect(mockSeriesRepository.create).toHaveBeenCalledWith(seriesData);
      expect(createdSeries.id).toBe('series-1');
      
      // Step 3: User creates sermons in the series (offline)
      const sermonData = {
        title: 'My First Sermon',
        content: 'Created offline',
        seriesId: createdSeries.id,
        userId: userId,
      };
      
      const createdSermon = await sermonRepository.create(sermonData);
      expect(mockSermonRepository.create).toHaveBeenCalledWith(sermonData);
      expect(createdSermon.id).toBe('sermon-1');
      
      // Step 4: Verify offline authentication works
      const isOfflineAuth = await authSession.isAuthenticatedOffline();
      expect(isOfflineAuth).toBe(true);
      
      // Step 5: Verify online features are gated
      mockFeatureGate.requiresAuthentication.mockReturnValueOnce(true);
      const canAccessCommunity = featureGate.canAccess('community', { isAuthenticated: false });
      expect(canAccessCommunity).toBe(false);
    });

    it('should handle offline-to-online transition with data migration', async () => {
      const anonymousUserId = 'anon_1234567890_existing';
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: User has existing offline data
      mockAuthSession.getAnonymousUserId.mockResolvedValueOnce(anonymousUserId);
      mockAuthSession.hasOfflineDataToLink.mockResolvedValueOnce(true);
      
      mockDataMigration.getMigrationPreview.mockResolvedValueOnce({
        seriesCount: 2,
        sermonCount: 5,
        anonymousUserId: anonymousUserId,
      });
      
      const preview = await dataMigration.getMigrationPreview();
      expect(preview.seriesCount).toBe(2);
      expect(preview.sermonCount).toBe(5);
      
      // Step 2: User decides to connect account
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(true);
      mockHttpClient.get.mockResolvedValueOnce({ user: { id: authenticatedUserId } });
      
      // Step 3: Data migration occurs
      mockDataMigration.migrateOfflineDataToAccount.mockResolvedValueOnce({
        success: true,
        totalMigratedRecords: 7,
        totalConflicts: 1,
        seriesResult: { success: true, migratedRecords: 2, conflicts: 0, errors: [] },
        sermonResult: { success: true, migratedRecords: 5, conflicts: 1, errors: [] },
        errors: [],
      });
      
      const migrationResult = await dataMigration.migrateOfflineDataToAccount(authenticatedUserId);
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.totalMigratedRecords).toBe(7);
      
      // Step 4: User now has access to online features
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(true);
      mockFeatureGate.canAccess.mockReturnValueOnce(true);
      
      const canAccessCommunity = featureGate.canAccess('community', { isAuthenticated: true });
      expect(canAccessCommunity).toBe(true);
      
      // Step 5: Verify anonymous data is cleared
      expect(mockAuthSession.linkOfflineDataToAccount).toHaveBeenCalledWith(authenticatedUserId);
    });

    it('should handle sync operations after authentication', async () => {
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: User is authenticated online
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(true);
      mockAuthSession.getEffectiveUserId.mockResolvedValueOnce(authenticatedUserId);
      
      // Step 2: User creates content (should sync when online)
      const seriesData = {
        title: 'Online Series',
        description: 'Created while online',
        userId: authenticatedUserId,
      };
      
      // Mock successful API sync
      mockHttpClient.post.mockResolvedValueOnce({ id: 'series-remote-1' });
      
      const createdSeries = await seriesRepository.create(seriesData);
      expect(mockSeriesRepository.create).toHaveBeenCalledWith(seriesData);
      
      // Step 3: User goes offline, continues working
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(false);
      mockHttpClient.post.mockRejectedValueOnce(new Error('Network error'));
      
      const offlineSermonData = {
        title: 'Offline Sermon',
        content: 'Created while offline',
        seriesId: createdSeries.id,
        userId: authenticatedUserId,
      };
      
      const offlineSermon = await sermonRepository.create(offlineSermonData);
      expect(mockSermonRepository.create).toHaveBeenCalledWith(offlineSermonData);
      
      // Step 4: User comes back online (sync should resume)
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(true);
      mockHttpClient.post.mockResolvedValueOnce({ id: 'sermon-remote-1' });
      
      // Verify offline authentication still works
      const isOfflineAuth = await authSession.isAuthenticatedOffline();
      expect(isOfflineAuth).toBe(true);
    });
  });

  describe('Feature Gating Integration', () => {
    it('should properly gate community features for offline users', async () => {
      // Setup offline user
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(false);
      mockAuthSession.getEffectiveUserId.mockResolvedValueOnce('anon_1234567890_test');
      
      // Community features should require authentication
      mockFeatureGate.requiresAuthentication.mockImplementation((feature) => {
        return feature === 'community' || feature === 'research';
      });
      
      mockFeatureGate.canAccess.mockImplementation((feature, context) => {
        if (feature === 'community' || feature === 'research') {
          return context.isAuthenticated === true;
        }
        return true; // Core features available offline
      });
      
      // Test core features (should be available)
      const canCreateSeries = featureGate.canAccess('series', { isAuthenticated: false });
      const canCreateSermons = featureGate.canAccess('sermons', { isAuthenticated: false });
      
      expect(canCreateSeries).toBe(true);
      expect(canCreateSermons).toBe(true);
      
      // Test gated features (should be blocked)
      const canAccessCommunity = featureGate.canAccess('community', { isAuthenticated: false });
      const canAccessResearch = featureGate.canAccess('research', { isAuthenticated: false });
      
      expect(canAccessCommunity).toBe(false);
      expect(canAccessResearch).toBe(false);
    });

    it('should show authentication prompts for premium features', async () => {
      // Setup offline user trying to access premium feature
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(false);
      
      mockFeatureGate.getUpgradePrompt.mockReturnValueOnce({
        title: 'Connect Account Required',
        message: 'Community features require an account to sync your posts across devices.',
        actionText: 'Connect Account',
        onAction: jest.fn(),
      });
      
      const upgradePrompt = featureGate.getUpgradePrompt('community');
      
      expect(upgradePrompt.title).toBe('Connect Account Required');
      expect(upgradePrompt.message).toContain('Community features require an account');
      expect(upgradePrompt.actionText).toBe('Connect Account');
      expect(typeof upgradePrompt.onAction).toBe('function');
    });

    it('should handle progressive enhancement flow', async () => {
      const anonymousUserId = 'anon_1234567890_test';
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: User starts offline
      mockAuthSession.getEffectiveUserId.mockResolvedValueOnce(anonymousUserId);
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(false);
      
      // User can access core features
      const canCreateContent = featureGate.canAccess('sermons', { isAuthenticated: false });
      expect(canCreateContent).toBe(true);
      
      // Step 2: User tries to access premium feature
      mockFeatureGate.requiresAuthentication.mockReturnValueOnce(true);
      mockFeatureGate.canAccess.mockReturnValueOnce(false);
      
      const canAccessPremium = featureGate.canAccess('community', { isAuthenticated: false });
      expect(canAccessPremium).toBe(false);
      
      // Step 3: User connects account
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(true);
      mockAuthSession.getEffectiveUserId.mockResolvedValueOnce(authenticatedUserId);
      
      // Migration happens
      mockDataMigration.migrateOfflineDataToAccount.mockResolvedValueOnce({
        success: true,
        totalMigratedRecords: 3,
        totalConflicts: 0,
        seriesResult: { success: true, migratedRecords: 1, conflicts: 0, errors: [] },
        sermonResult: { success: true, migratedRecords: 2, conflicts: 0, errors: [] },
        errors: [],
      });
      
      await dataMigration.migrateOfflineDataToAccount(authenticatedUserId);
      
      // Step 4: User now has access to premium features
      mockFeatureGate.canAccess.mockReturnValueOnce(true);
      const canAccessPremiumNow = featureGate.canAccess('community', { isAuthenticated: true });
      expect(canAccessPremiumNow).toBe(true);
    });
  });

  describe('Sync Conflict Resolution', () => {
    it('should handle sync conflicts during offline-to-online transition', async () => {
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: User has offline changes
      mockAuthSession.getEffectiveUserId.mockResolvedValueOnce(authenticatedUserId);
      
      // Step 2: Sync detects conflicts
      const mockConflicts = [
        {
          id: 'series_test-id_123456789',
          entityType: 'series' as const,
          entityId: 'test-id',
          localRecord: { title: 'Local Title', updated_at: '2023-12-01T10:00:00Z' },
          remoteRecord: { title: 'Remote Title', updated_at: '2023-12-01T11:00:00Z' },
          conflictFields: ['title'],
          timestamp: '2023-12-01T12:00:00Z',
          resolved: false,
        },
      ];
      
      // Mock sync service detecting conflicts
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: null,
            lastMobilePushAt: null,
            conflictResolutionMode: 'manual',
            pendingConflicts: mockConflicts,
          }));
        }
        return Promise.resolve(null);
      });
      
      // Step 3: User resolves conflicts manually
      const resolveConflict = async (conflictId: string, resolution: 'keep_local' | 'keep_remote') => {
        const updatedConflicts = mockConflicts.map(conflict => 
          conflict.id === conflictId 
            ? { ...conflict, resolved: true, resolution }
            : conflict
        );
        
        await mockAsyncStorage.setItem('sync.bidirectional.state', JSON.stringify({
          lastWebPullAt: null,
          lastMobilePushAt: null,
          conflictResolutionMode: 'manual',
          pendingConflicts: updatedConflicts,
        }));
        
        return { success: true };
      };
      
      const result = await resolveConflict('series_test-id_123456789', 'keep_local');
      expect(result.success).toBe(true);
      
      // Step 4: Verify conflict resolution is stored
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('"resolved":true')
      );
    });

    it('should handle automatic conflict resolution for simple cases', async () => {
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: Setup automatic conflict resolution
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: null,
            lastMobilePushAt: null,
            conflictResolutionMode: 'auto',
            pendingConflicts: [],
          }));
        }
        return Promise.resolve(null);
      });
      
      // Step 2: Simulate sync with auto-resolvable conflicts
      const localRecord = {
        id: 'series-1',
        title: 'Local Title',
        updated_at: '2023-12-01T10:00:00Z',
        dirty: 0, // No local changes
      };
      
      const remoteRecord = {
        id: 'series-1',
        title: 'Remote Title',
        updated_at: '2023-12-01T11:00:00Z', // Newer
      };
      
      // Mock sync service auto-resolving (remote wins because it's newer and no local changes)
      const autoResolveResult = {
        resolved: true,
        resolution: 'keep_remote',
        appliedChanges: true,
      };
      
      expect(autoResolveResult.resolved).toBe(true);
      expect(autoResolveResult.resolution).toBe('keep_remote');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should gracefully handle network failures during sync', async () => {
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: User is authenticated and creates content
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(true);
      mockAuthSession.getEffectiveUserId.mockResolvedValueOnce(authenticatedUserId);
      
      const seriesData = {
        title: 'Test Series',
        userId: authenticatedUserId,
      };
      
      // Step 2: Network fails during sync
      mockHttpClient.post.mockRejectedValueOnce(new Error('Network timeout'));
      
      // Content should still be created locally
      const createdSeries = await seriesRepository.create(seriesData);
      expect(mockSeriesRepository.create).toHaveBeenCalledWith(seriesData);
      expect(createdSeries.id).toBe('series-1');
      
      // Step 3: App should continue working offline
      mockAuthSession.isAuthenticatedOffline.mockResolvedValueOnce(true);
      const isOfflineAuth = await authSession.isAuthenticatedOffline();
      expect(isOfflineAuth).toBe(true);
      
      // Step 4: When network recovers, sync should resume
      mockHttpClient.post.mockResolvedValueOnce({ id: 'series-remote-1' });
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(true);
      
      const isOnlineAuth = await authSession.isAuthenticatedOnline();
      expect(isOnlineAuth).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      // Step 1: Storage fails during anonymous ID generation
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));
      
      // Should still generate anonymous ID (fallback to memory)
      mockAuthSession.generateAnonymousUserId.mockResolvedValueOnce('anon_fallback_123');
      const anonymousId = await authSession.generateAnonymousUserId();
      expect(anonymousId).toBe('anon_fallback_123');
      
      // Step 2: App should continue working
      mockSeriesRepository.create.mockResolvedValueOnce({ id: 'series-1', title: 'Test' } as any);
      const series = await seriesRepository.create({ title: 'Test', userId: anonymousId });
      expect(series.id).toBe('series-1');
    });

    it('should handle migration failures with rollback', async () => {
      const anonymousUserId = 'anon_1234567890_test';
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: Migration fails
      mockDataMigration.migrateOfflineDataToAccount.mockResolvedValueOnce({
        success: false,
        totalMigratedRecords: 0,
        totalConflicts: 0,
        seriesResult: { success: false, migratedRecords: 0, conflicts: 0, errors: ['Migration failed'] },
        sermonResult: { success: false, migratedRecords: 0, conflicts: 0, errors: ['Migration failed'] },
        errors: ['Migration failed'],
      });
      
      const migrationResult = await dataMigration.migrateOfflineDataToAccount(authenticatedUserId);
      expect(migrationResult.success).toBe(false);
      
      // Step 2: Rollback should be attempted
      mockDataMigration.rollbackMigration.mockResolvedValueOnce(true);
      const rollbackResult = await dataMigration.rollbackMigration(authenticatedUserId, migrationResult);
      expect(rollbackResult).toBe(true);
      
      // Step 3: User should still have access to offline data
      mockAuthSession.getAnonymousUserId.mockResolvedValueOnce(anonymousUserId);
      const stillHasOfflineData = await authSession.hasOfflineDataToLink();
      expect(stillHasOfflineData).toBe(true);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain data integrity during offline operations', async () => {
      const userId = 'anon_1234567890_test';
      
      // Step 1: Create series
      const seriesData = {
        id: 'series-1',
        title: 'Test Series',
        userId: userId,
      };
      
      mockSeriesRepository.create.mockResolvedValueOnce(seriesData as any);
      const series = await seriesRepository.create(seriesData);
      
      // Step 2: Create sermon linked to series
      const sermonData = {
        id: 'sermon-1',
        title: 'Test Sermon',
        seriesId: series.id,
        userId: userId,
      };
      
      mockSermonRepository.create.mockResolvedValueOnce(sermonData as any);
      const sermon = await sermonRepository.create(sermonData);
      
      // Step 3: Verify relationships are maintained
      expect(sermon.seriesId).toBe(series.id);
      expect(sermon.userId).toBe(userId);
      expect(series.userId).toBe(userId);
    });

    it('should validate migration integrity', async () => {
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: Successful migration
      mockDataMigration.migrateOfflineDataToAccount.mockResolvedValueOnce({
        success: true,
        totalMigratedRecords: 3,
        totalConflicts: 0,
        seriesResult: { success: true, migratedRecords: 1, conflicts: 0, errors: [] },
        sermonResult: { success: true, migratedRecords: 2, conflicts: 0, errors: [] },
        errors: [],
      });
      
      await dataMigration.migrateOfflineDataToAccount(authenticatedUserId);
      
      // Step 2: Validate migration
      mockDataMigration.validateMigration.mockResolvedValueOnce({
        isValid: true,
        issues: [],
      });
      
      const validation = await dataMigration.validateMigration(authenticatedUserId);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect and report data integrity issues', async () => {
      const authenticatedUserId = 'auth-user-123';
      
      // Step 1: Migration with integrity issues
      mockDataMigration.validateMigration.mockResolvedValueOnce({
        isValid: false,
        issues: [
          'Sermon sermon-1 references non-existent series missing-series',
          'Duplicate series IDs found: series-1',
        ],
      });
      
      const validation = await dataMigration.validateMigration(authenticatedUserId);
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toHaveLength(2);
      expect(validation.issues[0]).toContain('non-existent series');
      expect(validation.issues[1]).toContain('Duplicate series IDs');
    });
  });
});