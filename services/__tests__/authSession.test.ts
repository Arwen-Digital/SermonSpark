import AsyncStorage from '@react-native-async-storage/async-storage';
import httpClient from '../httpClient';
import * as dataMigration from '../dataMigration';
import authSession, {
  generateAnonymousUserId,
  getEffectiveUserId,
  getCachedUserId,
  getCurrentUserId,
  getAnonymousUserId,
  clearAnonymousUserId,
  isAuthenticatedOffline,
  isAuthenticatedOnline,
  linkOfflineDataToAccount,
  hasOfflineDataToLink,
  cacheUserId,
  clearCachedUserId,
} from '../authSession';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../httpClient');
jest.mock('../dataMigration');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;
const mockDataMigration = dataMigration as jest.Mocked<typeof dataMigration>;

describe('AuthSession - Anonymous User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('generateAnonymousUserId', () => {
    it('should generate a new anonymous user ID when none exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const anonymousId = await generateAnonymousUserId();

      expect(anonymousId).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline.anonymousUserId',
        anonymousId
      );
    });

    it('should return existing anonymous user ID from storage', async () => {
      const existingId = 'anon_1234567890_abcdefghi';
      mockAsyncStorage.getItem.mockResolvedValueOnce(existingId);

      const anonymousId = await generateAnonymousUserId();

      expect(anonymousId).toBe(existingId);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return cached anonymous user ID from memory', async () => {
      // First call to generate and cache
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      const firstId = await generateAnonymousUserId();

      // Second call should return from memory without storage call
      mockAsyncStorage.getItem.mockClear();
      const secondId = await generateAnonymousUserId();

      expect(secondId).toBe(firstId);
      expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should generate unique IDs on multiple calls with cleared cache', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const id1 = await generateAnonymousUserId();
      await clearAnonymousUserId();
      const id2 = await generateAnonymousUserId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
    });
  });

  describe('getEffectiveUserId', () => {
    it('should return authenticated user ID when available', async () => {
      const authenticatedId = 'auth-user-123';
      mockAsyncStorage.getItem.mockResolvedValueOnce(authenticatedId);

      const userId = await getEffectiveUserId();

      expect(userId).toBe(authenticatedId);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('offline.currentUserId');
    });

    it('should fetch user ID from API when not cached', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null); // No cached user
      mockHttpClient.get.mockResolvedValueOnce({
        user: { id: 'api-user-456' }
      });

      const userId = await getEffectiveUserId();

      expect(userId).toBe('api-user-456');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/auth/me');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('offline.currentUserId', 'api-user-456');
    });

    it('should generate anonymous user ID when not authenticated', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null); // No cached user
      mockHttpClient.get.mockRejectedValueOnce(new Error('Not authenticated'));
      mockAsyncStorage.getItem.mockResolvedValueOnce(null); // No existing anonymous ID

      const userId = await getEffectiveUserId();

      expect(userId).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('offline.anonymousUserId', userId);
    });

    it('should return existing anonymous user ID when API fails', async () => {
      const existingAnonymousId = 'anon_1234567890_existing';
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // No cached authenticated user
        .mockResolvedValueOnce(existingAnonymousId); // Existing anonymous ID
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network error'));

      const userId = await getEffectiveUserId();

      expect(userId).toBe(existingAnonymousId);
    });
  });

  describe('getAnonymousUserId', () => {
    it('should return anonymous user ID from storage', async () => {
      const anonymousId = 'anon_1234567890_test';
      mockAsyncStorage.getItem.mockResolvedValueOnce(anonymousId);

      const result = await getAnonymousUserId();

      expect(result).toBe(anonymousId);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('offline.anonymousUserId');
    });

    it('should return null when no anonymous user ID exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await getAnonymousUserId();

      expect(result).toBeNull();
    });

    it('should return cached anonymous user ID from memory', async () => {
      const anonymousId = 'anon_1234567890_cached';
      
      // First call to cache the ID
      mockAsyncStorage.getItem.mockResolvedValueOnce(anonymousId);
      await getAnonymousUserId();

      // Second call should return from memory
      mockAsyncStorage.getItem.mockClear();
      const result = await getAnonymousUserId();

      expect(result).toBe(anonymousId);
      expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe('clearAnonymousUserId', () => {
    it('should clear anonymous user ID from storage and memory', async () => {
      await clearAnonymousUserId();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline.anonymousUserId');
    });

    it('should clear memory cache after clearing storage', async () => {
      // First generate an anonymous ID to cache it
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      await generateAnonymousUserId();

      // Clear the anonymous ID
      await clearAnonymousUserId();

      // Next call should generate a new ID, not return cached one
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      const newId = await generateAnonymousUserId();

      expect(newId).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('offline.anonymousUserId', newId);
    });
  });

  describe('isAuthenticatedOffline', () => {
    it('should return true when authenticated user ID exists', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('auth-user-123') // Cached user ID
        .mockResolvedValueOnce(null); // No anonymous ID needed

      const result = await isAuthenticatedOffline();

      expect(result).toBe(true);
    });

    it('should return true when anonymous user ID exists', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // No cached user ID
        .mockResolvedValueOnce('anon_1234567890_test'); // Anonymous ID exists

      const result = await isAuthenticatedOffline();

      expect(result).toBe(true);
    });

    it('should return false when no user IDs exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await isAuthenticatedOffline();

      expect(result).toBe(false);
    });

    it('should return true when both authenticated and anonymous IDs exist', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('auth-user-123')
        .mockResolvedValueOnce('anon_1234567890_test');

      const result = await isAuthenticatedOffline();

      expect(result).toBe(true);
    });
  });

  describe('isAuthenticatedOnline', () => {
    it('should return true when API returns user data', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        user: { id: 'online-user-123' }
      });

      const result = await isAuthenticatedOnline();

      expect(result).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/auth/me');
    });

    it('should return false when API returns no user data', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        user: null
      });

      const result = await isAuthenticatedOnline();

      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await isAuthenticatedOnline();

      expect(result).toBe(false);
    });

    it('should return false when API returns empty response', async () => {
      mockHttpClient.get.mockResolvedValueOnce({});

      const result = await isAuthenticatedOnline();

      expect(result).toBe(false);
    });
  });

  describe('hasOfflineDataToLink', () => {
    it('should return true when anonymous user ID exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('anon_1234567890_test');

      const result = await hasOfflineDataToLink();

      expect(result).toBe(true);
    });

    it('should return false when no anonymous user ID exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await hasOfflineDataToLink();

      expect(result).toBe(false);
    });
  });

  describe('linkOfflineDataToAccount', () => {
    const authenticatedUserId = 'auth-user-123';
    const anonymousUserId = 'anon_1234567890_test';

    beforeEach(() => {
      mockDataMigration.migrateOfflineDataToAccount.mockResolvedValue({
        success: true,
        totalMigratedRecords: 5,
        totalConflicts: 1,
        seriesResult: { success: true, migratedRecords: 2, conflicts: 0, errors: [] },
        sermonResult: { success: true, migratedRecords: 3, conflicts: 1, errors: [] },
        errors: [],
      });
    });

    it('should successfully link offline data to authenticated account', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(anonymousUserId);
      mockHttpClient.post.mockResolvedValueOnce({});

      await linkOfflineDataToAccount(authenticatedUserId);

      expect(mockDataMigration.migrateOfflineDataToAccount).toHaveBeenCalledWith(authenticatedUserId);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/auth/link-offline-data', {
        anonymousUserId,
        authenticatedUserId,
        migrationSummary: {
          seriesCount: 2,
          sermonCount: 3,
          conflicts: 1,
        }
      });
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline.anonymousUserId');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('offline.currentUserId', authenticatedUserId);
    });

    it('should handle case when no anonymous data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      await linkOfflineDataToAccount(authenticatedUserId);

      expect(mockDataMigration.migrateOfflineDataToAccount).not.toHaveBeenCalled();
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should handle local migration failure', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(anonymousUserId);
      mockDataMigration.migrateOfflineDataToAccount.mockResolvedValueOnce({
        success: false,
        totalMigratedRecords: 0,
        totalConflicts: 0,
        seriesResult: { success: false, migratedRecords: 0, conflicts: 0, errors: ['Migration failed'] },
        sermonResult: { success: false, migratedRecords: 0, conflicts: 0, errors: ['Migration failed'] },
        errors: ['Local data migration failed: Migration failed'],
      });

      await expect(linkOfflineDataToAccount(authenticatedUserId))
        .rejects.toThrow('Local data migration failed: Local data migration failed: Migration failed');

      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should continue when API linking fails but local migration succeeds', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(anonymousUserId);
      mockHttpClient.post.mockRejectedValueOnce(new Error('API error'));

      // Should not throw error
      await linkOfflineDataToAccount(authenticatedUserId);

      expect(mockDataMigration.migrateOfflineDataToAccount).toHaveBeenCalledWith(authenticatedUserId);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline.anonymousUserId');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('offline.currentUserId', authenticatedUserId);
    });

    it('should handle migration errors gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(anonymousUserId);
      mockDataMigration.migrateOfflineDataToAccount.mockRejectedValueOnce(new Error('Migration error'));

      await expect(linkOfflineDataToAccount(authenticatedUserId))
        .rejects.toThrow('Failed to migrate offline data to your account');

      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('User ID Management', () => {
    describe('cacheUserId', () => {
      it('should cache user ID in storage and memory', async () => {
        const userId = 'user-123';

        await cacheUserId(userId);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('offline.currentUserId', userId);
      });

      it('should clear user ID when null is passed', async () => {
        await cacheUserId(null);

        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline.currentUserId');
      });
    });

    describe('getCachedUserId', () => {
      it('should return cached user ID from storage', async () => {
        const userId = 'cached-user-123';
        mockAsyncStorage.getItem.mockResolvedValueOnce(userId);

        const result = await getCachedUserId();

        expect(result).toBe(userId);
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('offline.currentUserId');
      });

      it('should return null when no cached user ID exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null);

        const result = await getCachedUserId();

        expect(result).toBeNull();
      });

      it('should return cached user ID from memory on subsequent calls', async () => {
        const userId = 'memory-cached-user';
        
        // First call caches from storage
        mockAsyncStorage.getItem.mockResolvedValueOnce(userId);
        await getCachedUserId();

        // Second call should return from memory
        mockAsyncStorage.getItem.mockClear();
        const result = await getCachedUserId();

        expect(result).toBe(userId);
        expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
      });
    });

    describe('getCurrentUserId', () => {
      it('should return effective user ID', async () => {
        const userId = 'current-user-123';
        mockAsyncStorage.getItem.mockResolvedValueOnce(userId);

        const result = await getCurrentUserId();

        expect(result).toBe(userId);
      });

      it('should generate anonymous ID when no authenticated user', async () => {
        mockAsyncStorage.getItem
          .mockResolvedValueOnce(null) // No cached user
          .mockResolvedValueOnce(null); // No existing anonymous ID
        mockHttpClient.get.mockRejectedValueOnce(new Error('Not authenticated'));

        const result = await getCurrentUserId();

        expect(result).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
      });
    });

    describe('clearCachedUserId', () => {
      it('should clear cached user ID', async () => {
        await clearCachedUserId();

        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline.currentUserId');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully in generateAnonymousUserId', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await generateAnonymousUserId();

      expect(result).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
    });

    it('should handle AsyncStorage errors gracefully in getAnonymousUserId', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await getAnonymousUserId();

      expect(result).toBeNull();
    });

    it('should handle network errors in isAuthenticatedOnline', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await isAuthenticatedOnline();

      expect(result).toBe(false);
    });

    it('should handle AsyncStorage errors in isAuthenticatedOffline', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await isAuthenticatedOffline();

      expect(result).toBe(false);
    });
  });

  describe('Memory Cache Behavior', () => {
    it('should maintain separate memory caches for authenticated and anonymous users', async () => {
      // Cache authenticated user
      await cacheUserId('auth-user-123');
      
      // Generate anonymous user (should not affect authenticated cache)
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      const anonymousId = await generateAnonymousUserId();

      // Get cached authenticated user (should still be cached)
      mockAsyncStorage.getItem.mockClear();
      const cachedUserId = await getCachedUserId();

      expect(cachedUserId).toBe('auth-user-123');
      expect(anonymousId).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
      expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should clear memory caches independently', async () => {
      // Generate and cache both IDs
      await cacheUserId('auth-user-123');
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      await generateAnonymousUserId();

      // Clear only anonymous ID
      await clearAnonymousUserId();

      // Authenticated user should still be cached
      mockAsyncStorage.getItem.mockClear();
      const cachedUserId = await getCachedUserId();
      expect(cachedUserId).toBe('auth-user-123');

      // Anonymous ID should be cleared
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      const newAnonymousId = await generateAnonymousUserId();
      expect(newAnonymousId).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
    });
  });
});