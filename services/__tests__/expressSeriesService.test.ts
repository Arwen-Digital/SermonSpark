import { expressSeriesService } from '../expressSeriesService';
import { httpClient } from '../httpClient';
import { Series } from '../../types';

// Mock dependencies
jest.mock('../httpClient');

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('ExpressSeriesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSeries: Series = {
    id: '789e4567-e89b-12d3-a456-426614174002',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Series',
    description: 'This is a test sermon series',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    image_url: 'https://example.com/series-image.jpg',
    tags: ['series', 'faith', 'growth'],
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    sermon_count: 5,
    sermons: [
      {
        id: '456e4567-e89b-12d3-a456-426614174001',
        title: 'Series Sermon 1',
        status: 'ready',
        date: '2024-01-07T10:00:00.000Z'
      },
      {
        id: '456e4567-e89b-12d3-a456-426614174002',
        title: 'Series Sermon 2',
        status: 'draft',
        date: '2024-01-14T10:00:00.000Z'
      }
    ]
  };

  describe('getSeries', () => {
    it('should fetch series successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          series: [mockSeries],
          total: 1,
          page: 1,
          limit: 10
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getSeries();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/series');
      expect(result).toEqual([mockSeries]);
    });

    it('should fetch series with filters', async () => {
      const activeSeries = { ...mockSeries, status: 'active' as const };
      const mockResponse = {
        success: true,
        data: {
          series: [activeSeries],
          total: 1,
          page: 1,
          limit: 10
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const filters = {
        status: 'active' as const,
        limit: 5,
        offset: 0
      };

      const result = await expressSeriesService.getSeries(filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/series?status=active&limit=5&offset=0');
      expect(result).toEqual([activeSeries]);
    });

    it('should handle empty series list', async () => {
      const mockResponse = {
        success: true,
        data: {
          series: [],
          total: 0,
          page: 1,
          limit: 10
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getSeries();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Database error' }
        })
      } as Response);

      await expect(expressSeriesService.getSeries()).rejects.toThrow('Database error');
    });
  });

  describe('getActiveSeries', () => {
    it('should fetch only active series', async () => {
      const activeSeries = { ...mockSeries, status: 'active' as const };
      const mockResponse = {
        success: true,
        data: {
          series: [activeSeries],
          total: 1
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getActiveSeries();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/series/active');
      expect(result).toEqual([activeSeries]);
      expect(result[0].status).toBe('active');
    });

    it('should handle no active series', async () => {
      const mockResponse = {
        success: true,
        data: {
          series: [],
          total: 0
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getActiveSeries();

      expect(result).toEqual([]);
    });
  });

  describe('getSeriesById', () => {
    it('should fetch series by ID with sermons', async () => {
      const mockResponse = {
        success: true,
        data: mockSeries,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getSeriesById(mockSeries.id);

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/series/${mockSeries.id}`);
      expect(result).toEqual(mockSeries);
      expect(result?.sermons).toHaveLength(2);
      expect(result?.sermon_count).toBe(5);
    });

    it('should handle series not found', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Series not found' }
        })
      } as Response);

      const result = await expressSeriesService.getSeriesById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle unauthorized access', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' }
        })
      } as Response);

      await expect(expressSeriesService.getSeriesById(mockSeries.id))
        .rejects.toThrow('Authentication required');
    });
  });

  describe('createSeries', () => {
    it('should create series successfully', async () => {
      const seriesData = {
        title: 'New Series',
        description: 'New series description',
        start_date: '2024-02-01',
        end_date: '2024-11-30',
        tags: ['new', 'series'],
        status: 'planning' as const
      };

      const createdSeries = {
        ...mockSeries,
        ...seriesData,
        id: 'new-series-id',
        sermon_count: 0,
        sermons: []
      };

      const mockResponse = {
        success: true,
        data: createdSeries,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.createSeries(seriesData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/series', seriesData);
      expect(result).toEqual(createdSeries);
      expect(result.title).toBe('New Series');
      expect(result.sermon_count).toBe(0);
    });

    it('should create series with minimal data', async () => {
      const minimalData = {
        title: 'Minimal Series',
        status: 'planning' as const
      };

      const createdSeries = {
        id: 'minimal-series-id',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Minimal Series',
        description: null,
        start_date: null,
        end_date: null,
        image_url: null,
        tags: [],
        status: 'planning',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        sermon_count: 0,
        sermons: []
      };

      const mockResponse = {
        success: true,
        data: createdSeries,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.createSeries(minimalData);

      expect(result.title).toBe('Minimal Series');
      expect(result.description).toBeNull();
      expect(result.tags).toEqual([]);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        status: 'planning' as const
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              { path: 'title', msg: 'Title is required' }
            ]
          }
        })
      } as Response);

      await expect(expressSeriesService.createSeries(invalidData))
        .rejects.toThrow('Validation failed');
    });

    it('should handle creation errors', async () => {
      const seriesData = {
        title: 'Test Series',
        status: 'planning' as const
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to create series' }
        })
      } as Response);

      await expect(expressSeriesService.createSeries(seriesData))
        .rejects.toThrow('Failed to create series');
    });
  });

  describe('updateSeries', () => {
    it('should update series successfully', async () => {
      const updates = {
        title: 'Updated Series Title',
        description: 'Updated description',
        status: 'active' as const
      };

      const updatedSeries = {
        ...mockSeries,
        ...updates
      };

      const mockResponse = {
        success: true,
        data: updatedSeries,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.updateSeries(mockSeries.id, updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith(`/series/${mockSeries.id}`, updates);
      expect(result).toEqual(updatedSeries);
      expect(result?.title).toBe('Updated Series Title');
      expect(result?.status).toBe('active');
    });

    it('should update series dates', async () => {
      const updates = {
        start_date: '2024-03-01',
        end_date: '2024-10-31'
      };

      const updatedSeries = {
        ...mockSeries,
        ...updates
      };

      const mockResponse = {
        success: true,
        data: updatedSeries,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.updateSeries(mockSeries.id, updates);

      expect(result?.start_date).toBe('2024-03-01');
      expect(result?.end_date).toBe('2024-10-31');
    });

    it('should handle series not found', async () => {
      const updates = { title: 'Updated Title' };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Series not found' }
        })
      } as Response);

      const result = await expressSeriesService.updateSeries('nonexistent-id', updates);

      expect(result).toBeNull();
    });

    it('should handle validation errors', async () => {
      const invalidUpdates = {
        title: 'a'.repeat(256) // Too long
      };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title is too long',
            details: [
              { path: 'title', msg: 'Title must be less than 255 characters' }
            ]
          }
        })
      } as Response);

      await expect(expressSeriesService.updateSeries(mockSeries.id, invalidUpdates))
        .rejects.toThrow('Title is too long');
    });
  });

  describe('deleteSeries', () => {
    it('should delete series successfully (soft delete)', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Series deleted successfully' },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.delete.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      await expressSeriesService.deleteSeries(mockSeries.id);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(`/series/${mockSeries.id}`);
    });

    it('should handle series not found', async () => {
      mockHttpClient.delete.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Series not found' }
        })
      } as Response);

      await expect(expressSeriesService.deleteSeries('nonexistent-id'))
        .rejects.toThrow('Series not found');
    });

    it('should handle series with sermons', async () => {
      mockHttpClient.delete.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: { 
            code: 'CONFLICT', 
            message: 'Cannot delete series with associated sermons' 
          }
        })
      } as Response);

      await expect(expressSeriesService.deleteSeries(mockSeries.id))
        .rejects.toThrow('Cannot delete series with associated sermons');
    });
  });

  describe('Data Format Compatibility', () => {
    it('should handle series without sermons', async () => {
      const seriesWithoutSermons = {
        ...mockSeries,
        sermon_count: 0,
        sermons: []
      };

      const mockResponse = {
        success: true,
        data: {
          series: [seriesWithoutSermons],
          total: 1
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getSeries();

      expect(result[0].sermon_count).toBe(0);
      expect(result[0].sermons).toEqual([]);
    });

    it('should handle series with minimal data', async () => {
      const minimalSeries = {
        id: 'minimal-id',
        user_id: 'user-id',
        title: 'Minimal Series',
        description: null,
        start_date: null,
        end_date: null,
        image_url: null,
        tags: [],
        status: 'planning',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        sermon_count: 0,
        sermons: []
      };

      const mockResponse = {
        success: true,
        data: minimalSeries
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getSeriesById('minimal-id');

      expect(result).toEqual(minimalSeries);
      expect(result?.description).toBeNull();
      expect(result?.start_date).toBeNull();
      expect(result?.tags).toEqual([]);
    });

    it('should handle date formatting correctly', async () => {
      const seriesWithDates = {
        ...mockSeries,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        created_at: '2024-01-01T12:00:00.000Z',
        updated_at: '2024-01-15T15:30:00.000Z'
      };

      const mockResponse = {
        success: true,
        data: seriesWithDates
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getSeriesById(mockSeries.id);

      expect(result?.start_date).toBe('2024-01-01');
      expect(result?.end_date).toBe('2024-12-31');
      expect(result?.created_at).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle tag arrays correctly', async () => {
      const seriesWithTags = {
        ...mockSeries,
        tags: ['faith', 'hope', 'love', 'growth', 'discipleship']
      };

      const mockResponse = {
        success: true,
        data: seriesWithTags
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getSeriesById(mockSeries.id);

      expect(result?.tags).toEqual(['faith', 'hope', 'love', 'growth', 'discipleship']);
      expect(Array.isArray(result?.tags)).toBe(true);
    });

    it('should handle sermon aggregation data', async () => {
      const seriesWithAggregation = {
        ...mockSeries,
        sermon_count: 10,
        sermons: [
          {
            id: 'sermon-1',
            title: 'Sermon 1',
            status: 'delivered',
            date: '2024-01-07T10:00:00.000Z'
          },
          {
            id: 'sermon-2',
            title: 'Sermon 2',
            status: 'ready',
            date: '2024-01-14T10:00:00.000Z'
          },
          {
            id: 'sermon-3',
            title: 'Sermon 3',
            status: 'draft',
            date: null
          }
        ]
      };

      const mockResponse = {
        success: true,
        data: seriesWithAggregation
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSeriesService.getSeriesById(mockSeries.id);

      expect(result?.sermon_count).toBe(10);
      expect(result?.sermons).toHaveLength(3);
      expect(result?.sermons[0].status).toBe('delivered');
      expect(result?.sermons[2].date).toBeNull();
    });

    it('should handle different series statuses', async () => {
      const statuses = ['planning', 'active', 'completed', 'archived'] as const;
      
      for (const status of statuses) {
        const seriesWithStatus = {
          ...mockSeries,
          status
        };

        const mockResponse = {
          success: true,
          data: {
            series: [seriesWithStatus],
            total: 1
          }
        };

        mockHttpClient.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse
        } as Response);

        const result = await expressSeriesService.getSeries({ status });

        expect(result[0].status).toBe(status);
      }
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed JSON responses', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      await expect(expressSeriesService.getSeries()).rejects.toThrow('Invalid JSON');
    });

    it('should handle unexpected response structure', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          // Missing success field and data structure
          series: [mockSeries]
        })
      } as Response);

      await expect(expressSeriesService.getSeries()).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(expressSeriesService.getSeries()).rejects.toThrow('Request timeout');
    });

    it('should handle server errors with detailed messages', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to connect to database',
            details: 'Connection pool exhausted'
          }
        })
      } as Response);

      await expect(expressSeriesService.createSeries({
        title: 'Test',
        status: 'planning'
      })).rejects.toThrow('Failed to connect to database');
    });

    it('should handle partial update failures', async () => {
      mockHttpClient.put.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          success: false,
          error: {
            code: 'UNPROCESSABLE_ENTITY',
            message: 'End date cannot be before start date',
            details: {
              start_date: '2024-12-01',
              end_date: '2024-01-01'
            }
          }
        })
      } as Response);

      await expect(expressSeriesService.updateSeries(mockSeries.id, {
        start_date: '2024-12-01',
        end_date: '2024-01-01'
      })).rejects.toThrow('End date cannot be before start date');
    });
  });
});