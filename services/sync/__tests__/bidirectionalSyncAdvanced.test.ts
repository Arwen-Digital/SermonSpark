import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import httpClient from '../../httpClient';
import * as authSession from '../../authSession';

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
jest.mock('../../db/index.native', () => mockDb);

// Mock auth session
jest.mock('../../authSession');
const mockAuthSession = authSession as jest.Mocked<typeof authSession>;

// Mock http client
jest.mock('../../httpClient');
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('Bidirectional Sync - Advanced Operations', () => {
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
    
    // Reset auth session mocks
    mockAuthSession.getCurrentUserId.mockResolvedValue('test-user-id');
    mockAuthSession.isAuthenticatedOnline.mockResolvedValue(true);
    
    // Import sync service after mocks are set up
    syncService = require('../syncService.native');
  });

  describe('Cross-Platform Data Synchronization', () => {
    it('should sync data from web platform to mobile', async () => {
      const webSeriesData = [
        {
          id: 'series-1',
          user_id: 'test-user-id',
          title: 'Web Series',
          description: 'Created on web',
          status: 'active',
          platform_source: 'web',
          created_at: '2023-12-01T10:00:00Z',
          updated_at: '2023-12-01T11:00:00Z',
        },
      ];

      const webSermonData = [
        {
          id: 'sermon-1',
          user_id: 'test-user-id',
          series_id: 'series-1',
          title: 'Web Sermon',
          content: 'Created on web platform',
          status: 'draft',
          platform_source: 'web',
          created_at: '2023-12-01T10:30:00Z',
          updated_at: '2023-12-01T11:30:00Z',
        },
      ];

      // Mock API responses for web data
      mockHttpClient.get
        .mockResolvedValueOnce({
          series: webSeriesData,
          pagination: { total: 1, hasMore: false },
        })
        .mockResolvedValueOnce({
          sermons: webSermonData,
          pagination: { total: 1, hasMore: false },
        });

      // Mock local database queries (no existing data)
      mockDb.queryFirst.mockResolvedValue(null);

      const result = await syncService.syncFromWebPlatform();

      expect(result.success).toBe(true);
      expect(result.seriesStats.pulled).toBe(1);
      expect(result.sermonStats.pulled).toBe(1);

      // Verify data was inserted into local database
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO series'),
        expect.arrayContaining(['series-1', 'test-user-id', 'Web Series'])
      );

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO sermons'),
        expect.arrayContaining(['sermon-1', 'test-user-id', 'series-1', 'Web Sermon'])
      );
    });

    it('should sync mobile changes to web platform', async () => {
      const mobileSeriesData = [
        {
          id: 'series-mobile-1',
          user_id: 'test-user-id',
          title: 'Mobile Series',
          description: 'Created on mobile',
          status: 'active',
          platform_source: 'mobile',
          dirty: 1,
          created_at: '2023-12-01T12:00:00Z',
          updated_at: '2023-12-01T13:00:00Z',
        },
      ];

      const mobileSermonData = [
        {
          id: 'sermon-mobile-1',
          user_id: 'test-user-id',
          series_id: 'series-mobile-1',
          title: 'Mobile Sermon',
          content: 'Created on mobile platform',
          status: 'draft',
          platform_source: 'mobile',
          dirty: 1,
          created_at: '2023-12-01T12:30:00Z',
          updated_at: '2023-12-01T13:30:00Z',
        },
      ];

      // Mock local database queries (dirty records)
      mockDb.queryAll
        .mockResolvedValueOnce(mobileSeriesData) // Dirty series
        .mockResolvedValueOnce(mobileSermonData); // Dirty sermons

      // Mock successful API sync
      mockHttpClient.post
        .mockResolvedValueOnce({ id: 'series-mobile-1', synced: true })
        .mockResolvedValueOnce({ id: 'sermon-mobile-1', synced: true });

      const result = await syncService.syncToWebPlatform();

      expect(result.success).toBe(true);
      expect(result.seriesStats.pushed).toBe(1);
      expect(result.sermonStats.pushed).toBe(1);

      // Verify API calls were made
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/sync/series', {
        series: expect.arrayContaining([
          expect.objectContaining({
            id: 'series-mobile-1',
            title: 'Mobile Series',
            platform_source: 'mobile',
          }),
        ]),
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/sync/sermons', {
        sermons: expect.arrayContaining([
          expect.objectContaining({
            id: 'sermon-mobile-1',
            title: 'Mobile Sermon',
            platform_source: 'mobile',
          }),
        ]),
      });

      // Verify dirty flags were cleared
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE series SET dirty = 0'),
        expect.arrayContaining(['series-mobile-1'])
      );
    });

    it('should handle bidirectional sync with both platforms having changes', async () => {
      // Mock bidirectional sync state
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: '2023-12-01T09:00:00Z',
            lastMobilePushAt: '2023-12-01T09:00:00Z',
            conflictResolutionMode: 'auto',
            pendingConflicts: [],
          }));
        }
        return Promise.resolve(null);
      });

      // Mock web changes since last sync
      const webChanges = [
        {
          id: 'series-1',
          title: 'Updated on Web',
          updated_at: '2023-12-01T10:00:00Z',
          platform_source: 'web',
        },
      ];

      // Mock mobile changes to push
      const mobileChanges = [
        {
          id: 'series-2',
          title: 'Created on Mobile',
          dirty: 1,
          updated_at: '2023-12-01T10:30:00Z',
          platform_source: 'mobile',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({
        series: webChanges,
        pagination: { total: 1, hasMore: false },
      });

      mockDb.queryAll.mockResolvedValueOnce(mobileChanges);
      mockHttpClient.post.mockResolvedValueOnce({ success: true });

      const result = await syncService.performBidirectionalSync();

      expect(result.success).toBe(true);
      expect(result.webPullStats.pulled).toBe(1);
      expect(result.mobilePushStats.pushed).toBe(1);
      expect(result.conflicts).toBe(0);

      // Verify timestamps were updated
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('lastWebPullAt')
      );
    });
  });

  describe('Conflict Detection and Resolution', () => {
    it('should detect conflicts when same record is modified on both platforms', async () => {
      const conflictingRecordId = 'series-conflict-1';
      
      // Local record (modified on mobile)
      const localRecord = {
        id: conflictingRecordId,
        title: 'Mobile Title',
        description: 'Modified on mobile',
        updated_at: '2023-12-01T10:00:00Z',
        dirty: 1,
        platform_source: 'mobile',
      };

      // Remote record (modified on web)
      const remoteRecord = {
        id: conflictingRecordId,
        title: 'Web Title',
        description: 'Modified on web',
        updated_at: '2023-12-01T10:05:00Z',
        platform_source: 'web',
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
            conflictResolutionMode: 'manual',
            pendingConflicts: [],
          }));
        }
        return Promise.resolve(null);
      });

      const result = await syncService.syncFromWebPlatform();

      expect(result.conflicts).toBeGreaterThan(0);
      
      // Verify conflict was added to pending list
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('pendingConflicts')
      );
    });

    it('should auto-resolve conflicts based on timestamp when no local changes', async () => {
      const recordId = 'series-auto-resolve-1';
      
      // Local record (not dirty, older)
      const localRecord = {
        id: recordId,
        title: 'Old Title',
        updated_at: '2023-12-01T09:00:00Z',
        dirty: 0, // No local changes
        platform_source: 'web',
      };

      // Remote record (newer)
      const remoteRecord = {
        id: recordId,
        title: 'New Title',
        updated_at: '2023-12-01T10:00:00Z',
        platform_source: 'web',
      };

      mockDb.queryFirst.mockResolvedValueOnce(localRecord);
      mockHttpClient.get.mockResolvedValueOnce({
        series: [remoteRecord],
        pagination: { total: 1, hasMore: false },
      });

      // Mock auto-resolution mode
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

      expect(result.conflicts).toBe(0); // Auto-resolved
      
      // Verify local record was updated with remote data
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE series SET'),
        expect.arrayContaining(['New Title'])
      );
    });

    it('should preserve local changes when auto-resolving conflicts', async () => {
      const recordId = 'series-preserve-local-1';
      
      // Local record (has unsaved changes)
      const localRecord = {
        id: recordId,
        title: 'Local Changes',
        updated_at: '2023-12-01T09:00:00Z',
        dirty: 1, // Has local changes
        platform_source: 'mobile',
      };

      // Remote record (newer but should not override local changes)
      const remoteRecord = {
        id: recordId,
        title: 'Remote Changes',
        updated_at: '2023-12-01T10:00:00Z',
        platform_source: 'web',
      };

      mockDb.queryFirst.mockResolvedValueOnce(localRecord);
      mockHttpClient.get.mockResolvedValueOnce({
        series: [remoteRecord],
        pagination: { total: 1, hasMore: false },
      });

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

      // Should create a conflict since local has unsaved changes
      expect(result.conflicts).toBeGreaterThan(0);
      
      // Local record should not be updated
      expect(mockDb.exec).not.toHaveBeenCalledWith(
        expect.stringContaining('UPDATE series SET title'),
        expect.arrayContaining(['Remote Changes'])
      );
    });

    it('should handle manual conflict resolution', async () => {
      const conflictId = 'series_conflict-1_123456789';
      
      // Mock pending conflict
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: null,
            lastMobilePushAt: null,
            conflictResolutionMode: 'manual',
            pendingConflicts: [
              {
                id: conflictId,
                entityType: 'series',
                entityId: 'conflict-1',
                localRecord: { 
                  id: 'conflict-1',
                  title: 'Local Title',
                  description: 'Local description',
                  updated_at: '2023-12-01T10:00:00Z',
                },
                remoteRecord: { 
                  id: 'conflict-1',
                  title: 'Remote Title',
                  description: 'Remote description',
                  updated_at: '2023-12-01T10:05:00Z',
                },
                conflictFields: ['title', 'description'],
                timestamp: '2023-12-01T10:10:00Z',
                resolved: false,
              },
            ],
          }));
        }
        return Promise.resolve(null);
      });

      // Resolve conflict by keeping remote version
      const result = await syncService.resolveConflictManually(conflictId, 'keep_remote');

      expect(result.success).toBe(true);
      
      // Verify local record was updated with remote data
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE series SET'),
        expect.arrayContaining(['Remote Title', 'Remote description'])
      );

      // Verify conflict was marked as resolved
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('"resolved":true')
      );
    });
  });

  describe('Sync Queue Management', () => {
    it('should queue operations when offline', async () => {
      // Mock offline state
      mockAuthSession.isAuthenticatedOnline.mockResolvedValueOnce(false);

      const operationData = {
        id: 'series-queue-1',
        type: 'create' as const,
        entityType: 'series' as const,
        data: {
          title: 'Queued Series',
          description: 'Created while offline',
        },
        timestamp: '2023-12-01T10:00:00Z',
        retryCount: 0,
      };

      await syncService.queueSyncOperation(operationData);

      // Verify operation was queued
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.queue',
        expect.stringContaining('series-queue-1')
      );
    });

    it('should process queued operations when coming back online', async () => {
      // Mock queued operations
      const queuedOperations = [
        {
          id: 'op-1',
          type: 'create',
          entityType: 'series',
          entityId: 'series-1',
          data: { title: 'Queued Series 1' },
          timestamp: '2023-12-01T10:00:00Z',
          retryCount: 0,
        },
        {
          id: 'op-2',
          type: 'update',
          entityType: 'sermon',
          entityId: 'sermon-1',
          data: { title: 'Updated Sermon' },
          timestamp: '2023-12-01T10:05:00Z',
          retryCount: 0,
        },
      ];

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.queue') {
          return Promise.resolve(JSON.stringify(queuedOperations));
        }
        return Promise.resolve(null);
      });

      // Mock successful API responses
      mockHttpClient.post.mockResolvedValue({ success: true });
      mockHttpClient.put.mockResolvedValue({ success: true });

      const result = await syncService.processSyncQueue();

      expect(result.processedOperations).toBe(2);
      expect(result.failedOperations).toBe(0);

      // Verify API calls were made
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/series', { title: 'Queued Series 1' });
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/sermons/sermon-1', { title: 'Updated Sermon' });

      // Verify queue was cleared
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('sync.queue', '[]');
    });

    it('should handle retry logic for failed operations', async () => {
      const failedOperation = {
        id: 'op-retry-1',
        type: 'create',
        entityType: 'series',
        entityId: 'series-retry-1',
        data: { title: 'Retry Series' },
        timestamp: '2023-12-01T10:00:00Z',
        retryCount: 2, // Already retried twice
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.queue') {
          return Promise.resolve(JSON.stringify([failedOperation]));
        }
        return Promise.resolve(null);
      });

      // Mock API failure
      mockHttpClient.post.mockRejectedValueOnce(new Error('Server error'));

      const result = await syncService.processSyncQueue();

      expect(result.processedOperations).toBe(0);
      expect(result.failedOperations).toBe(1);

      // Verify operation was updated with increased retry count
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.queue',
        expect.stringContaining('"retryCount":3')
      );
    });

    it('should remove operations that exceed max retry attempts', async () => {
      const maxRetriedOperation = {
        id: 'op-max-retry-1',
        type: 'create',
        entityType: 'series',
        entityId: 'series-max-retry-1',
        data: { title: 'Max Retry Series' },
        timestamp: '2023-12-01T10:00:00Z',
        retryCount: 5, // Exceeds max retries (typically 3-5)
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.queue') {
          return Promise.resolve(JSON.stringify([maxRetriedOperation]));
        }
        return Promise.resolve(null);
      });

      // Mock API failure
      mockHttpClient.post.mockRejectedValueOnce(new Error('Persistent error'));

      const result = await syncService.processSyncQueue();

      expect(result.processedOperations).toBe(0);
      expect(result.failedOperations).toBe(1);
      expect(result.removedOperations).toBe(1);

      // Verify operation was removed from queue
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('sync.queue', '[]');
    });
  });

  describe('Incremental Sync Optimization', () => {
    it('should only fetch records updated since last sync', async () => {
      const lastSyncTimestamp = '2023-12-01T09:00:00Z';
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: lastSyncTimestamp,
            lastMobilePushAt: null,
            conflictResolutionMode: 'auto',
            pendingConflicts: [],
          }));
        }
        return Promise.resolve(null);
      });

      await syncService.syncFromWebPlatform();

      // Verify API was called with timestamp filter
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/sync/series',
        expect.objectContaining({
          updated_at: lastSyncTimestamp,
          include_deleted: true,
          platform_source: 'web',
        })
      );
    });

    it('should handle deleted records in incremental sync', async () => {
      const deletedRecord = {
        id: 'series-deleted-1',
        title: 'Deleted Series',
        deleted_at: '2023-12-01T11:00:00Z',
        updated_at: '2023-12-01T11:00:00Z',
        platform_source: 'web',
      };

      mockHttpClient.get.mockResolvedValueOnce({
        series: [deletedRecord],
        pagination: { total: 1, hasMore: false },
      });

      const result = await syncService.syncFromWebPlatform();

      expect(result.success).toBe(true);
      expect(result.seriesStats.deleted).toBe(1);

      // Verify local record was marked as deleted
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE series SET deleted_at'),
        expect.arrayContaining(['2023-12-01T11:00:00Z', 'series-deleted-1'])
      );
    });

    it('should batch large sync operations', async () => {
      // Mock large dataset
      const largeBatch = Array.from({ length: 150 }, (_, i) => ({
        id: `series-${i}`,
        title: `Series ${i}`,
        updated_at: '2023-12-01T10:00:00Z',
        platform_source: 'web',
      }));

      mockHttpClient.get.mockResolvedValueOnce({
        series: largeBatch.slice(0, 100),
        pagination: { total: 150, hasMore: true, page: 1 },
      }).mockResolvedValueOnce({
        series: largeBatch.slice(100, 150),
        pagination: { total: 150, hasMore: false, page: 2 },
      });

      const result = await syncService.syncFromWebPlatform();

      expect(result.success).toBe(true);
      expect(result.seriesStats.pulled).toBe(150);

      // Verify multiple API calls were made for pagination
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sync Status and Monitoring', () => {
    it('should provide comprehensive sync status', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.queue') {
          return Promise.resolve(JSON.stringify([
            { id: 'op-1', type: 'create', retryCount: 0 },
            { id: 'op-2', type: 'update', retryCount: 1 },
          ]));
        }
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve(JSON.stringify({
            lastWebPullAt: '2023-12-01T10:00:00Z',
            lastMobilePushAt: '2023-12-01T09:30:00Z',
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
        pendingOperations: 2,
        lastWebSyncAt: '2023-12-01T10:00:00Z',
        lastMobileSyncAt: '2023-12-01T09:30:00Z',
        pendingConflicts: 1, // Only unresolved conflicts
        syncInProgress: false,
      });
    });

    it('should track sync progress during operations', async () => {
      const progressCallback = jest.fn();
      syncService.setSyncProgressCallback(progressCallback);

      mockHttpClient.get.mockResolvedValueOnce({
        series: [{ id: 'series-1', title: 'Test' }],
        pagination: { total: 1, hasMore: false },
      });

      await syncService.syncFromWebPlatform();

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'pulling_series',
          current: 0,
          total: 1,
          message: expect.stringContaining('Syncing series'),
        })
      );

      // Clean up
      syncService.setSyncProgressCallback(null);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await syncService.syncFromWebPlatform();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Network timeout'));
      
      // Verify sync state was not corrupted
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('lastWebPullAt')
      );
    });

    it('should handle partial sync failures', async () => {
      // Series sync succeeds
      mockHttpClient.get.mockResolvedValueOnce({
        series: [{ id: 'series-1', title: 'Success' }],
        pagination: { total: 1, hasMore: false },
      });

      // Sermons sync fails
      mockHttpClient.get.mockRejectedValueOnce(new Error('Sermons API error'));

      const result = await syncService.performBidirectionalSync();

      expect(result.success).toBe(false);
      expect(result.webPullStats.pulled).toBe(1); // Series succeeded
      expect(result.errors).toContain(expect.stringContaining('Sermons API error'));
    });

    it('should recover from corrupted sync state', async () => {
      // Mock corrupted sync state
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'sync.bidirectional.state') {
          return Promise.resolve('invalid-json');
        }
        return Promise.resolve(null);
      });

      const result = await syncService.syncFromWebPlatform();

      // Should initialize with default state and continue
      expect(result.success).toBe(true);
      
      // Verify state was reset
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync.bidirectional.state',
        expect.stringContaining('conflictResolutionMode')
      );
    });
  });
});