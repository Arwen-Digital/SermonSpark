/**
 * Tests for bidirectional sync functionality
 */

import { Platform } from 'react-native';

// Mock Platform to test native functionality
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock database functions
const mockDb = {
  exec: jest.fn(),
  queryAll: jest.fn(),
  queryFirst: jest.fn(),
};

jest.mock('../../../services/db/index.native', () => mockDb);

// Mock auth session
jest.mock('../../../services/authSession', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-id'),
  isAuthenticatedOnline: jest.fn().mockResolvedValue(true),
}));

// Mock http client
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../../services/httpClient', () => ({
  httpClient: mockHttpClient,
}));

describe('Bidirectional Sync', () => {
  let syncService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset AsyncStorage mock
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    
    // Reset database mocks
    mockDb.exec.mockResolvedValue(undefined);
    mockDb.queryAll.mockResolvedValue([]);
    mockDb.queryFirst.mockResolvedValue(null);
    
    // Reset HTTP client mocks
    mockHttpClient.get.mockResolvedValue({ series: [], sermons: [] });
    mockHttpClient.post.mockResolvedValue({});
    mockHttpClient.put.mockResolvedValue({});
    mockHttpClient.delete.mockResolvedValue({});
    
    // Import sync service after mocks are set up
    syncService = require('../syncService.native');
  });

  describe('Conflict Resolution', () => {
    it('should detect conflicts when local and remote records have different timestamps', async () => {
      const localRecord = {
        id: 'test-series-1',
        updated_at: '2023-12-01T10:00:00Z',
        dirty: 0,
        deleted_at: null,
      };

      const remoteRecord = {
        id: 'test-series-1',
        updated_at: '2023-12-01T11:00:00Z',
        deleted_at: null,
      };

      // Mock database to return local record
      mockDb.queryFirst.mockResolvedValueOnce(localRecord);

      // Mock HTTP response with remote record
      mockHttpClient.get.mockResolvedValueOnce({
        series: [remoteRecord],
        pagination: { total: 1, hasMore: false },
      });

      const result = await syncService.syncFromWebPlatform();

      expect(result.conflicts).toBeGreaterThan(0);
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE series SET'),
        expect.any(Array)
      );
    });

    it('should prefer local record when it has unsaved changes (dirty=1)', async () => {
      const localRecord = {
        id: 'test-series-1',
        updated_at: '2023-12-01T10:00:00Z',
        dirty: 1, // Has unsaved changes
        deleted_at: null,
      };

      const remoteRecord = {
        id: 'test-series-1',
        updated_at: '2023-12-01T11:00:00Z',
        deleted_at: null,
      };

      // Mock database to return local record
      mockDb.queryFirst.mockResolvedValueOnce(localRecord);

      // Mock HTTP response with remote record
      mockHttpClient.get.mockResolvedValueOnce({
        series: [remoteRecord],
        pagination: { total: 1, hasMore: false },
      });

      const result = await syncService.syncFromWebPlatform();

      // Should not update local record since it has unsaved changes
      expect(mockDb.exec).not.toHaveBeenCalledWith(
        expect.stringContaining('UPDATE series SET title'),
        expect.any(Array)
      );
    });

    it('should add conflict to pending list when manual resolution is required', async () => {
      const localRecord = {
        id: 'test-series-1',
        updated_at: '2023-12-01T10:00:00Z',
        dirty: 1,
        deleted_at: null,
      };

      const remoteRecord = {
        id: 'test-series-1',
        updated_at: '2023-12-01T10:02:00Z', // Very close timestamp
        deleted_at: null,
      };

      // Mock database to return local record
      mockDb.queryFirst.mockResolvedValueOnce(localRecord);

      // Mock HTTP response with remote record
      mockHttpClient.get.mockResolvedValueOnce({
        series: [remoteRecord],
        pagination: { total: 1, hasMore: false },
      });

      // Mock bidirectional sync state
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

      const result = await syncService.syncFromWebPlatform();

      expect(result.conflicts).toBeGreaterThan(0);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('pendingConflicts')
      );
    });
  });

  describe('Incremental Sync', () => {
    it('should only fetch records updated since last sync', async () => {
      const lastWebPullAt = '2023-12-01T09:00:00Z';
      
      // Mock bidirectional sync state with last pull timestamp
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt,
            lastMobilePushAt: null,
            conflictResolutionMode: 'auto',
            pendingConflicts: [],
          }));
        }
        return Promise.resolve(null);
      });

      await syncService.syncFromWebPlatform();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/sync/series',
        expect.objectContaining({
          include_deleted: true,
          platform_source: 'web',
          updated_at: lastWebPullAt,
        })
      );
    });

    it('should update last web pull timestamp after successful sync', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        series: [],
        pagination: { total: 0, hasMore: false },
      });

      mockHttpClient.get.mockResolvedValueOnce({
        sermons: [],
        pagination: { total: 0, hasMore: false },
      });

      await syncService.syncFromWebPlatform();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('lastWebPullAt')
      );
    });
  });

  describe('Sync Status Monitoring', () => {
    it('should return enhanced sync status with conflict count', async () => {
      // Mock sync queue
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.queue') {
          return Promise.resolve(JSON.stringify([]));
        }
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: '2023-12-01T10:00:00Z',
            lastMobilePushAt: null,
            conflictResolutionMode: 'auto',
            pendingConflicts: [
              { id: 'conflict-1', resolved: false },
              { id: 'conflict-2', resolved: true },
            ],
          }));
        }
        return Promise.resolve(null);
      });

      const status = await syncService.getEnhancedSyncStatus();

      expect(status).toMatchObject({
        isOnline: true,
        isAuthenticated: true,
        pendingOperations: 0,
        lastWebSyncAt: '2023-12-01T10:00:00Z',
        pendingConflicts: 1, // Only unresolved conflicts
      });
    });
  });

  describe('Manual Conflict Resolution', () => {
    it('should resolve conflict by keeping local record', async () => {
      const conflictId = 'series_test-id_123456789';
      
      // Mock bidirectional sync state with pending conflict
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: null,
            lastMobilePushAt: null,
            conflictResolutionMode: 'auto',
            pendingConflicts: [
              {
                id: conflictId,
                entityType: 'series',
                entityId: 'test-id',
                localRecord: { title: 'Local Title' },
                remoteRecord: { title: 'Remote Title' },
                conflictFields: ['title'],
                timestamp: '2023-12-01T10:00:00Z',
                resolved: false,
              },
            ],
          }));
        }
        return Promise.resolve(null);
      });

      await syncService.resolveConflictManually(conflictId, 'keep_local');

      // Should mark conflict as resolved but not update local record
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('"resolved":true')
      );
    });

    it('should resolve conflict by accepting remote record', async () => {
      const conflictId = 'series_test-id_123456789';
      
      // Mock bidirectional sync state with pending conflict
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: null,
            lastMobilePushAt: null,
            conflictResolutionMode: 'auto',
            pendingConflicts: [
              {
                id: conflictId,
                entityType: 'series',
                entityId: 'test-id',
                localRecord: { title: 'Local Title' },
                remoteRecord: { 
                  id: 'test-id',
                  user_id: 'user-1',
                  title: 'Remote Title',
                  created_at: '2023-12-01T09:00:00Z',
                  updated_at: '2023-12-01T10:00:00Z',
                },
                conflictFields: ['title'],
                timestamp: '2023-12-01T10:00:00Z',
                resolved: false,
              },
            ],
          }));
        }
        return Promise.resolve(null);
      });

      await syncService.resolveConflictManually(conflictId, 'keep_remote');

      // Should update local record with remote data
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE series SET title'),
        expect.arrayContaining(['Remote Title'])
      );
    });
  });
});