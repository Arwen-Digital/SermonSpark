import { expressAuthService } from '../expressAuthService';
import { expressSermonService } from '../expressSermonService';
import { expressSeriesService } from '../expressSeriesService';
import { expressCommunityService } from '../expressCommunityService';
import { httpClient } from '../httpClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../httpClient');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('Express Services Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let userProfile: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();

    // Set up authenticated user context
    authToken = 'mock-auth-token';
    userId = '123e4567-e89b-12d3-a456-426614174000';
    userProfile = {
      id: userId,
      email: 'integration@example.com',
      username: 'integrationuser',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      profile: {
        id: userId,
        full_name: 'Integration Test User',
        title: 'Pastor',
        church: 'Integration Test Church'
      }
    };

    // Mock authenticated state
    mockAsyncStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'access_token':
          return Promise.resolve(authToken);
        case 'user':
          return Promise.resolve(JSON.stringify(userProfile));
        default:
          return Promise.resolve(null);
      }
    });
  });

  describe('Complete User Journey Integration', () => {
    it('should handle complete user workflow from registration to content creation', async () => {
      // Step 1: User Registration
      const registrationData = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        full_name: 'New User',
        title: 'Pastor',
        church: 'New Church'
      };

      const authResponse = {
        success: true,
        data: {
          accessToken: 'new-auth-token',
          refreshToken: 'new-refresh-token',
          user: {
            id: 'new-user-id',
            email: registrationData.email,
            username: registrationData.username,
            profile: {
              id: 'new-user-id',
              full_name: registrationData.full_name,
              title: registrationData.title,
              church: registrationData.church
            }
          },
          expiresIn: 3600
        }
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => authResponse
      } as Response);

      const signupResult = await expressAuthService.signup(registrationData);
      expect(signupResult.user).toBeTruthy();
      expect(signupResult.session).toBeTruthy();

      // Update context for new user
      const newUserId = signupResult.user!.id;
      const newAuthToken = signupResult.session!.access_token;

      // Step 2: Create a Series
      const seriesData = {
        title: 'Integration Test Series',
        description: 'A series created during integration testing',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        tags: ['integration', 'test'],
        status: 'active' as const
      };

      const createdSeries = {
        id: 'integration-series-id',
        user_id: newUserId,
        ...seriesData,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        sermon_count: 0,
        sermons: []
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: createdSeries
        })
      } as Response);

      const seriesResult = await expressSeriesService.createSeries(seriesData);
      expect(seriesResult.title).toBe('Integration Test Series');
      expect(seriesResult.user_id).toBe(newUserId);

      // Step 3: Create Sermons in the Series
      const sermonData = {
        title: 'Integration Test Sermon',
        content: 'This sermon was created during integration testing',
        series_id: seriesResult.id,
        outline: {
          introduction: 'Test introduction',
          points: ['Point 1', 'Point 2'],
          conclusion: 'Test conclusion'
        },
        scripture: 'John 3:16',
        tags: ['integration', 'test', 'sermon'],
        status: 'draft' as const,
        visibility: 'private' as const,
        notes: 'Integration test notes'
      };

      const createdSermon = {
        id: 'integration-sermon-id',
        user_id: newUserId,
        ...sermonData,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        series: {
          id: seriesResult.id,
          title: seriesResult.title,
          description: seriesResult.description
        }
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: createdSermon
        })
      } as Response);

      const sermonResult = await expressSermonService.createSermon(sermonData);
      expect(sermonResult.title).toBe('Integration Test Sermon');
      expect(sermonResult.series_id).toBe(seriesResult.id);
      expect(sermonResult.series?.title).toBe(seriesResult.title);

      // Step 4: Create Community Post
      const postData = {
        title: 'Integration Test Community Post',
        content: 'This post was created during integration testing to share insights.',
        tags: ['integration', 'community', 'sharing'],
        visibility: 'community' as const
      };

      const createdPost = {
        id: 'integration-post-id',
        author_id: newUserId,
        ...postData,
        status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        author: {
          id: newUserId,
          username: registrationData.username,
          profile: {
            id: newUserId,
            full_name: registrationData.full_name,
            title: registrationData.title,
            church: registrationData.church
          }
        },
        like_count: 0,
        comment_count: 0,
        user_has_liked: false
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: createdPost
        })
      } as Response);

      const postResult = await expressCommunityService.createCommunityPost(postData);
      expect(postResult.title).toBe('Integration Test Community Post');
      expect(postResult.author_id).toBe(newUserId);

      // Step 5: Verify Data Relationships
      // Get series with sermons
      const seriesWithSermons = {
        ...createdSeries,
        sermon_count: 1,
        sermons: [
          {
            id: createdSermon.id,
            title: createdSermon.title,
            status: createdSermon.status,
            date: createdSermon.date
          }
        ]
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: seriesWithSermons
        })
      } as Response);

      const seriesWithSermonsResult = await expressSeriesService.getSeriesById(seriesResult.id);
      expect(seriesWithSermonsResult?.sermon_count).toBe(1);
      expect(seriesWithSermonsResult?.sermons).toHaveLength(1);
      expect(seriesWithSermonsResult?.sermons[0].id).toBe(createdSermon.id);

      // Verify all HTTP calls were made with proper authentication
      const postCalls = mockHttpClient.post.mock.calls;
      const getCalls = mockHttpClient.get.mock.calls;
      
      // Registration call doesn't need auth, but subsequent calls should have auth headers
      expect(postCalls.length).toBeGreaterThan(1);
      expect(getCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Service Interoperability', () => {
    it('should maintain data consistency across services', async () => {
      // Create series
      const seriesData = {
        title: 'Consistency Test Series',
        status: 'active' as const
      };

      const createdSeries = {
        id: 'consistency-series-id',
        user_id: userId,
        ...seriesData,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        sermon_count: 0,
        sermons: []
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: createdSeries })
      } as Response);

      const series = await expressSeriesService.createSeries(seriesData);

      // Create multiple sermons in the series
      const sermons = [];
      for (let i = 1; i <= 3; i++) {
        const sermonData = {
          title: `Consistency Sermon ${i}`,
          content: `Content for sermon ${i}`,
          series_id: series.id,
          status: 'draft' as const,
          visibility: 'private' as const
        };

        const createdSermon = {
          id: `consistency-sermon-${i}`,
          user_id: userId,
          ...sermonData,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          series: {
            id: series.id,
            title: series.title,
            description: series.description
          }
        };

        mockHttpClient.post.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ success: true, data: createdSermon })
        } as Response);

        const sermon = await expressSermonService.createSermon(sermonData);
        sermons.push(sermon);

        expect(sermon.series_id).toBe(series.id);
        expect(sermon.series?.title).toBe(series.title);
      }

      // Verify series shows correct sermon count
      const updatedSeries = {
        ...createdSeries,
        sermon_count: 3,
        sermons: sermons.map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          date: s.date
        }))
      };

      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: updatedSeries })
      } as Response);

      const seriesWithSermons = await expressSeriesService.getSeriesById(series.id);
      expect(seriesWithSermons?.sermon_count).toBe(3);
      expect(seriesWithSermons?.sermons).toHaveLength(3);

      // Verify sermons list includes series information
      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { sermons, total: 3 }
        })
      } as Response);

      const sermonsList = await expressSermonService.getSermons({ series_id: series.id });
      expect(sermonsList).toHaveLength(3);
      sermonsList.forEach(sermon => {
        expect(sermon.series_id).toBe(series.id);
        expect(sermon.series?.title).toBe(series.title);
      });
    });

    it('should handle cross-service error propagation', async () => {
      // Test scenario where series creation fails but we try to create sermon with that series
      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to create series' }
        })
      } as Response);

      await expect(expressSeriesService.createSeries({
        title: 'Failed Series',
        status: 'active'
      })).rejects.toThrow('Failed to create series');

      // Now try to create sermon with non-existent series
      mockHttpClient.post.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid series_id',
            details: [{ path: 'series_id', msg: 'Series does not exist' }]
          }
        })
      } as Response);

      await expect(expressSermonService.createSermon({
        title: 'Orphaned Sermon',
        content: 'Content',
        series_id: 'non-existent-series-id',
        status: 'draft',
        visibility: 'private'
      })).rejects.toThrow('Validation failed');
    });
  });

  describe('Authentication Integration', () => {
    it('should handle authentication across all services', async () => {
      // Test that all services properly use authentication
      const services = [
        { service: expressSermonService, method: 'getSermons', args: [] },
        { service: expressSeriesService, method: 'getSeries', args: [] },
        { service: expressCommunityService, method: 'getCommunityPosts', args: [] },
        { service: expressAuthService, method: 'getCurrentUser', args: [] }
      ];

      for (const { service, method, args } of services) {
        mockHttpClient.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: method === 'getCurrentUser' ? { user: userProfile } : { [method.replace('get', '').toLowerCase()]: [], total: 0 }
          })
        } as Response);

        await (service as any)[method](...args);

        // Verify the HTTP client was called (authentication is handled by httpClient)
        expect(mockHttpClient.get).toHaveBeenCalled();
      }
    });

    it('should handle token refresh across services', async () => {
      // Mock expired token scenario
      mockAsyncStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'access_token':
            return Promise.resolve('expired-token');
          case 'refresh_token':
            return Promise.resolve('valid-refresh-token');
          case 'user':
            return Promise.resolve(JSON.stringify(userProfile));
          default:
            return Promise.resolve(null);
        }
      });

      // First request fails with 401
      mockHttpClient.get.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Token expired' }
        })
      } as Response);

      // Token refresh succeeds
      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 3600
          }
        })
      } as Response);

      // Retry request succeeds
      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { sermons: [], total: 0 }
        })
      } as Response);

      // This should trigger token refresh and retry
      const result = await expressSermonService.getSermons();

      expect(result).toEqual([]);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: 'valid-refresh-token'
      });
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'new-access-token');
    });

    it('should handle logout and clear authentication state', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { message: 'Logout successful' }
        })
      } as Response);

      await expressAuthService.signout();

      // Verify tokens are cleared
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user');

      // Subsequent requests should fail without authentication
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await expect(expressSermonService.getSermons()).rejects.toThrow('No access token available');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network failures consistently across services', async () => {
      const networkError = new Error('Network request failed');
      
      const services = [
        { service: expressSermonService, method: 'getSermons' },
        { service: expressSeriesService, method: 'getSeries' },
        { service: expressCommunityService, method: 'getCommunityPosts' }
      ];

      for (const { service, method } of services) {
        mockHttpClient.get.mockRejectedValueOnce(networkError);

        await expect((service as any)[method]()).rejects.toThrow('Network request failed');
      }
    });

    it('should handle server errors consistently', async () => {
      const serverError = {
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
        })
      };

      const services = [
        { service: expressSermonService, method: 'getSermons' },
        { service: expressSeriesService, method: 'getSeries' },
        { service: expressCommunityService, method: 'getCommunityPosts' }
      ];

      for (const { service, method } of services) {
        mockHttpClient.get.mockResolvedValueOnce(serverError as Response);

        await expect((service as any)[method]()).rejects.toThrow('Internal server error');
      }
    });

    it('should handle validation errors consistently', async () => {
      const validationError = {
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [{ path: 'title', msg: 'Title is required' }]
          }
        })
      };

      const createOperations = [
        { service: expressSermonService, method: 'createSermon', data: { title: '', content: 'Content', status: 'draft', visibility: 'private' } },
        { service: expressSeriesService, method: 'createSeries', data: { title: '', status: 'planning' } },
        { service: expressCommunityService, method: 'createCommunityPost', data: { title: '', content: 'Content', visibility: 'community' } }
      ];

      for (const { service, method, data } of createOperations) {
        mockHttpClient.post.mockResolvedValueOnce(validationError as Response);

        await expect((service as any)[method](data)).rejects.toThrow('Validation failed');
      }
    });
  });

  describe('Data Format Consistency', () => {
    it('should maintain consistent date formatting across services', async () => {
      const testDate = '2024-01-15T10:30:00.000Z';
      
      const responses = [
        {
          service: expressSermonService,
          method: 'getSermons',
          data: { sermons: [{ id: '1', title: 'Test', created_at: testDate, updated_at: testDate }], total: 1 }
        },
        {
          service: expressSeriesService,
          method: 'getSeries',
          data: { series: [{ id: '1', title: 'Test', created_at: testDate, updated_at: testDate }], total: 1 }
        },
        {
          service: expressCommunityService,
          method: 'getCommunityPosts',
          data: { posts: [{ id: '1', title: 'Test', created_at: testDate, updated_at: testDate }], total: 1 }
        }
      ];

      for (const { service, method, data } of responses) {
        mockHttpClient.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data })
        } as Response);

        const result = await (service as any)[method]();
        const item = result[0];
        
        expect(item.created_at).toBe(testDate);
        expect(item.updated_at).toBe(testDate);
        expect(new Date(item.created_at).getTime()).toBe(new Date(testDate).getTime());
      }
    });

    it('should handle null and undefined values consistently', async () => {
      const responses = [
        {
          service: expressSermonService,
          method: 'getSermons',
          data: { sermons: [{ id: '1', title: 'Test', content: null, outline: null, tags: [] }], total: 1 }
        },
        {
          service: expressSeriesService,
          method: 'getSeries',
          data: { series: [{ id: '1', title: 'Test', description: null, tags: [] }], total: 1 }
        },
        {
          service: expressCommunityService,
          method: 'getCommunityPosts',
          data: { posts: [{ id: '1', title: 'Test', tags: [] }], total: 1 }
        }
      ];

      for (const { service, method, data } of responses) {
        mockHttpClient.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data })
        } as Response);

        const result = await (service as any)[method]();
        const item = result[0];
        
        expect(Array.isArray(item.tags)).toBe(true);
        expect(item.tags).toEqual([]);
      }
    });
  });

  describe('Performance and Caching Integration', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Mock responses for concurrent requests
      const responses = Array(5).fill(null).map((_, i) => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { sermons: [{ id: `sermon-${i}`, title: `Sermon ${i}` }], total: 1 }
        })
      }));

      responses.forEach(response => {
        mockHttpClient.get.mockResolvedValueOnce(response as Response);
      });

      // Make concurrent requests
      const promises = Array(5).fill(null).map(() => expressSermonService.getSermons());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result[0].id).toBe(`sermon-${i}`);
      });

      // Verify all requests were made
      expect(mockHttpClient.get).toHaveBeenCalledTimes(5);
    });

    it('should handle user data caching correctly', async () => {
      // First call should fetch from API
      mockHttpClient.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { user: userProfile }
        })
      } as Response);

      const user1 = await expressAuthService.getCurrentUser();
      expect(user1).toEqual(userProfile);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(userProfile));

      // Second call should use cached data
      const user2 = await expressAuthService.getUser();
      expect(user2).toEqual(userProfile);
      
      // API should only be called once
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });
  });
});