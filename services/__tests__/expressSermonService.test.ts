import { expressSermonService } from '../expressSermonService';
import { httpClient } from '../httpClient';
import { SermonDto } from '../../types';

// Mock dependencies
jest.mock('../httpClient');

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('ExpressSermonService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSermon: SermonDto = {
    id: '456e4567-e89b-12d3-a456-426614174001',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    series_id: '789e4567-e89b-12d3-a456-426614174002',
    title: 'Test Sermon',
    content: 'This is test sermon content',
    outline: {
      introduction: 'Test introduction',
      points: ['Point 1', 'Point 2', 'Point 3'],
      conclusion: 'Test conclusion'
    },
    scripture: 'John 3:16',
    tags: ['faith', 'love', 'grace'],
    status: 'draft',
    visibility: 'private',
    date: '2024-01-15T10:00:00.000Z',
    notes: 'Test sermon notes',
    duration: 30,
    audio_url: null,
    video_url: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    series: {
      id: '789e4567-e89b-12d3-a456-426614174002',
      title: 'Test Series',
      description: 'Test series description'
    }
  };

  describe('getSermons', () => {
    it('should fetch sermons successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          sermons: [mockSermon],
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

      const result = await expressSermonService.getSermons();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/sermons');
      expect(result).toEqual([mockSermon]);
    });

    it('should fetch sermons with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          sermons: [mockSermon],
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
        status: 'draft' as const,
        series_id: '789e4567-e89b-12d3-a456-426614174002',
        limit: 5,
        offset: 10
      };

      const result = await expressSermonService.getSermons(filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/sermons?status=draft&series_id=789e4567-e89b-12d3-a456-426614174002&limit=5&offset=10');
      expect(result).toEqual([mockSermon]);
    });

    it('should handle empty sermon list', async () => {
      const mockResponse = {
        success: true,
        data: {
          sermons: [],
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

      const result = await expressSermonService.getSermons();

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

      await expect(expressSermonService.getSermons()).rejects.toThrow('Database error');
    });

    it('should handle network errors', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(expressSermonService.getSermons()).rejects.toThrow('Network error');
    });
  });

  describe('getSermonById', () => {
    it('should fetch sermon by ID successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockSermon,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.getSermonById(mockSermon.id);

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/sermons/${mockSermon.id}`);
      expect(result).toEqual(mockSermon);
    });

    it('should handle sermon not found', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sermon not found' }
        })
      } as Response);

      await expect(expressSermonService.getSermonById('nonexistent-id'))
        .rejects.toThrow('Sermon not found');
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

      await expect(expressSermonService.getSermonById(mockSermon.id))
        .rejects.toThrow('Authentication required');
    });
  });

  describe('createSermon', () => {
    it('should create sermon successfully', async () => {
      const sermonData = {
        title: 'New Sermon',
        content: 'New sermon content',
        outline: { points: ['Point 1'] },
        scripture: 'Romans 8:28',
        tags: ['hope'],
        status: 'draft' as const,
        visibility: 'private' as const,
        notes: 'New sermon notes'
      };

      const createdSermon = {
        ...mockSermon,
        ...sermonData,
        id: 'new-sermon-id'
      };

      const mockResponse = {
        success: true,
        data: createdSermon,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.createSermon(sermonData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/sermons', sermonData);
      expect(result).toEqual(createdSermon);
    });

    it('should create sermon with series relationship', async () => {
      const sermonData = {
        title: 'Series Sermon',
        content: 'Sermon in series',
        series_id: '789e4567-e89b-12d3-a456-426614174002',
        status: 'draft' as const,
        visibility: 'private' as const
      };

      const createdSermon = {
        ...mockSermon,
        ...sermonData,
        id: 'series-sermon-id'
      };

      const mockResponse = {
        success: true,
        data: createdSermon,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.createSermon(sermonData);

      expect(result.series_id).toBe(sermonData.series_id);
      expect(result.series).toBeTruthy();
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        content: 'Content',
        status: 'draft' as const,
        visibility: 'private' as const
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

      await expect(expressSermonService.createSermon(invalidData))
        .rejects.toThrow('Validation failed');
    });

    it('should handle creation errors', async () => {
      const sermonData = {
        title: 'Test Sermon',
        content: 'Content',
        status: 'draft' as const,
        visibility: 'private' as const
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to create sermon' }
        })
      } as Response);

      await expect(expressSermonService.createSermon(sermonData))
        .rejects.toThrow('Failed to create sermon');
    });
  });

  describe('updateSermon', () => {
    it('should update sermon successfully', async () => {
      const updates = {
        title: 'Updated Sermon Title',
        content: 'Updated content',
        status: 'ready' as const
      };

      const updatedSermon = {
        ...mockSermon,
        ...updates
      };

      const mockResponse = {
        success: true,
        data: updatedSermon,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.updateSermon(mockSermon.id, updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith(`/sermons/${mockSermon.id}`, updates);
      expect(result).toEqual(updatedSermon);
    });

    it('should update sermon series relationship', async () => {
      const updates = {
        series_id: 'new-series-id'
      };

      const updatedSermon = {
        ...mockSermon,
        series_id: 'new-series-id',
        series: {
          id: 'new-series-id',
          title: 'New Series',
          description: 'New series description'
        }
      };

      const mockResponse = {
        success: true,
        data: updatedSermon,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.updateSermon(mockSermon.id, updates);

      expect(result.series_id).toBe('new-series-id');
      expect(result.series?.title).toBe('New Series');
    });

    it('should handle sermon not found', async () => {
      const updates = { title: 'Updated Title' };

      mockHttpClient.put.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sermon not found' }
        })
      } as Response);

      await expect(expressSermonService.updateSermon('nonexistent-id', updates))
        .rejects.toThrow('Sermon not found');
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

      await expect(expressSermonService.updateSermon(mockSermon.id, invalidUpdates))
        .rejects.toThrow('Title is too long');
    });
  });

  describe('deleteSermon', () => {
    it('should delete sermon successfully (soft delete)', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Sermon deleted successfully' },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockHttpClient.delete.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      await expressSermonService.deleteSermon(mockSermon.id);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(`/sermons/${mockSermon.id}`);
    });

    it('should handle sermon not found', async () => {
      mockHttpClient.delete.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sermon not found' }
        })
      } as Response);

      await expect(expressSermonService.deleteSermon('nonexistent-id'))
        .rejects.toThrow('Sermon not found');
    });

    it('should handle unauthorized deletion', async () => {
      mockHttpClient.delete.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot delete sermon' }
        })
      } as Response);

      await expect(expressSermonService.deleteSermon(mockSermon.id))
        .rejects.toThrow('Cannot delete sermon');
    });
  });

  describe('Data Format Compatibility', () => {
    it('should handle sermons without series', async () => {
      const sermonWithoutSeries = {
        ...mockSermon,
        series_id: null,
        series: null
      };

      const mockResponse = {
        success: true,
        data: {
          sermons: [sermonWithoutSeries],
          total: 1
        }
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.getSermons();

      expect(result[0].series_id).toBeNull();
      expect(result[0].series).toBeNull();
    });

    it('should handle sermons with minimal data', async () => {
      const minimalSermon = {
        id: 'minimal-id',
        user_id: 'user-id',
        title: 'Minimal Sermon',
        content: null,
        outline: null,
        scripture: null,
        tags: [],
        status: 'draft',
        visibility: 'private',
        date: null,
        notes: null,
        duration: null,
        audio_url: null,
        video_url: null,
        series_id: null,
        series: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        data: minimalSermon
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.getSermonById('minimal-id');

      expect(result).toEqual(minimalSermon);
      expect(result.content).toBeNull();
      expect(result.outline).toBeNull();
      expect(result.tags).toEqual([]);
    });

    it('should handle complex outline structures', async () => {
      const complexOutline = {
        introduction: 'Complex introduction',
        points: [
          {
            title: 'Main Point 1',
            subpoints: ['Sub 1.1', 'Sub 1.2'],
            scripture: 'John 1:1'
          },
          {
            title: 'Main Point 2',
            subpoints: ['Sub 2.1'],
            scripture: 'John 1:2'
          }
        ],
        conclusion: 'Complex conclusion',
        application: 'Practical application'
      };

      const sermonWithComplexOutline = {
        ...mockSermon,
        outline: complexOutline
      };

      const mockResponse = {
        success: true,
        data: sermonWithComplexOutline
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.getSermonById(mockSermon.id);

      expect(result.outline).toEqual(complexOutline);
      expect(result.outline.points).toHaveLength(2);
      expect(result.outline.points[0].subpoints).toHaveLength(2);
    });

    it('should handle date formatting correctly', async () => {
      const sermonWithDate = {
        ...mockSermon,
        date: '2024-12-25T09:00:00.000Z', // Christmas service
        created_at: '2024-01-01T12:00:00.000Z',
        updated_at: '2024-01-15T15:30:00.000Z'
      };

      const mockResponse = {
        success: true,
        data: sermonWithDate
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.getSermonById(mockSermon.id);

      expect(result.date).toBe('2024-12-25T09:00:00.000Z');
      expect(new Date(result.date!).getTime()).toBe(new Date('2024-12-25T09:00:00.000Z').getTime());
    });

    it('should handle tag arrays correctly', async () => {
      const sermonWithTags = {
        ...mockSermon,
        tags: ['faith', 'hope', 'love', 'grace', 'salvation']
      };

      const mockResponse = {
        success: true,
        data: sermonWithTags
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const result = await expressSermonService.getSermonById(mockSermon.id);

      expect(result.tags).toEqual(['faith', 'hope', 'love', 'grace', 'salvation']);
      expect(Array.isArray(result.tags)).toBe(true);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed JSON responses', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      await expect(expressSermonService.getSermons()).rejects.toThrow('Invalid JSON');
    });

    it('should handle unexpected response structure', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          // Missing success field and data structure
          sermons: [mockSermon]
        })
      } as Response);

      await expect(expressSermonService.getSermons()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(expressSermonService.getSermons()).rejects.toThrow('Request timeout');
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

      await expect(expressSermonService.createSermon({
        title: 'Test',
        content: 'Content',
        status: 'draft',
        visibility: 'private'
      })).rejects.toThrow('Failed to connect to database');
    });
  });
});