import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocks
import { httpClient } from '../httpClient';

describe('HttpClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Basic HTTP methods', () => {
    it('should make GET requests with query parameters', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 1, name: 'test' } }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/api/test', { limit: 10, offset: 0 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test?limit=10&offset=0'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should make POST requests with data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 1 } }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const testData = { name: 'test', value: 123 };
      const result = await httpClient.post('/api/test', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual({ id: 1 });
    });

    it('should make PUT requests with data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 1, updated: true } }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const testData = { name: 'updated test' };
      const result = await httpClient.put('/api/test/1', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData),
        })
      );
      expect(result).toEqual({ id: 1, updated: true });
    });

    it('should make DELETE requests', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.delete('/api/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Authentication', () => {
    it('should include Authorization header when token is available', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Set a token
      await httpClient.setAuthToken('test-token');

      await httpClient.get('/api/protected');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: { message: 'Invalid data' } }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(httpClient.get('/api/test')).rejects.toThrow('Invalid data');
    });

    it('should handle network errors with retry', async () => {
      const networkError = new Error('Network error');
      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: 1 } }),
        });

      const result = await httpClient.get('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('Interceptors', () => {
    it('should apply request interceptors', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Add request interceptor that adds a custom header
      httpClient.addRequestInterceptor((config) => ({
        ...config,
        options: {
          ...config.options,
          headers: {
            ...config.options.headers,
            'X-Custom-Header': 'test-value',
          },
        },
      }));

      await httpClient.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value',
          }),
        })
      );
    });

    it('should apply response interceptors', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 1, name: 'test' } }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Add response interceptor that transforms the data
      httpClient.addResponseInterceptor({
        onFulfilled: (data: any) => ({
          ...data,
          transformed: true,
        }),
      });

      const result = await httpClient.get('/api/test');

      expect(result).toEqual({ id: 1, name: 'test', transformed: true });
    });
  });
});