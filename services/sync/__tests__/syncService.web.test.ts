/**
 * Tests for web sync service implementation
 */

import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../authSession', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-id'),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

import { httpClient } from '../httpClient';
import {
  syncAll,
  syncSeries,
  syncSermons,
  queueSeriesOperation,
  queueSermonOperation,
  getSyncStatus,
  clearPendingOperations,
  forceFullSync,
} from '../syncService.web';

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('Web Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('syncAll', () => {
    it('should complete sync successfully with no data', async () => {
      // Mock empty API responses
      mockHttpClient.get.mockResolvedValue({
        series: [],
        pagination: { page: 1, limit: 100, total: 0, hasMore: false },
      });

      const result = await syncAll();

      expect(result.success).toBe(true);
      expect(result.seriesStats.pushed).toBe(0);
      expect(result.seriesStats.pulled).toBe(0);
      expect(result.sermonStats.pushed).toBe(0);
      expect(result.sermonStats.pulled).toBe(0);
      expect(result.totalErrors).toHaveLength(0);
    });

    it('should handle authentication errors', async () => {
      // Mock getCurrentUserId to return null (not authenticated)
      const { getCurrentUserId } = await import('../authSession');
      (getCurrentUserId as jest.Mock).mockResolvedValueOnce(null);

      const result = await syncAll();

      expect(result.success).toBe(false);
      expect(result.totalErrors).toContain(expect.stringContaining('User not authenticated'));
    });
  });

  describe('syncSeries', () => {
    it('should pull series data from API', async () => {
      const mockSeries = [
        {
          id: 'series-1',
          user_id: 'test-user-id',
          title: 'Test Series',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValue({
        series: mockSeries,
        pagination: { page: 1, limit: 100, total: 1, hasMore: false },
      });

      const result = await syncSeries();

      expect(result.pulled).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/series', expect.any(Object));
    });

    it('should process pending operations', async () => {
      // Mock pending operations in localStorage
      const mockState = {
        lastSyncAt: null,
        pendingOperations: {
          series: [
            {
              id: 'series-1',
              type: 'create',
              data: { title: 'New Series' },
              timestamp: '2024-01-01T00:00:00Z',
              retryCount: 0,
            },
          ],
          sermons: [],
        },
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockState));

      mockHttpClient.post.mockResolvedValue({ id: 'series-1' });
      mockHttpClient.get.mockResolvedValue({
        series: [],
        pagination: { page: 1, limit: 100, total: 0, hasMore: false },
      });

      const result = await syncSeries();

      expect(result.pushed).toBe(1);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/series', { title: 'New Series' });
    });
  });

  describe('syncSermons', () => {
    it('should pull sermon data from API', async () => {
      const mockSermons = [
        {
          id: 'sermon-1',
          user_id: 'test-user-id',
          title: 'Test Sermon',
          status: 'draft',
          visibility: 'private',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValue({
        sermons: mockSermons,
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      });

      const result = await syncSermons();

      expect(result.pulled).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/sermons', expect.any(Object));
    });
  });

  describe('queue operations', () => {
    it('should queue series operations', async () => {
      await queueSeriesOperation('series-1', 'create', { title: 'New Series' });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should queue sermon operations', async () => {
      await queueSermonOperation('sermon-1', 'update', { title: 'Updated Sermon' });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      const mockState = {
        lastSyncAt: '2024-01-01T00:00:00Z',
        pendingOperations: {
          series: [{ id: 'series-1', type: 'create' }],
          sermons: [],
        },
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockState));

      const status = await getSyncStatus();

      expect(status.lastSyncAt).toBe('2024-01-01T00:00:00Z');
      expect(status.pendingOperations.series).toBe(1);
      expect(status.pendingOperations.sermons).toBe(0);
      expect(status.isOnline).toBe(true);
    });
  });

  describe('clearPendingOperations', () => {
    it('should clear all pending operations', async () => {
      await clearPendingOperations();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"pendingOperations":{"series":[],"sermons":[]}')
      );
    });
  });

  describe('forceFullSync', () => {
    it('should clear timestamps and perform full sync', async () => {
      mockHttpClient.get.mockResolvedValue({
        series: [],
        sermons: [],
        pagination: { page: 1, limit: 100, total: 0, hasMore: false },
      });

      const result = await forceFullSync();

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('lastPulledAt.series'),
        ''
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('lastPulledAt.sermons'),
        ''
      );
    });
  });
});