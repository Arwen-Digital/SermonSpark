/**
 * Integration test for HTTP Client
 * This test verifies that the HTTP client can be instantiated and has the expected interface
 */

import { httpClient } from '../httpClient';

describe('HttpClient Integration', () => {
  it('should have the required sync interface methods', () => {
    expect(typeof httpClient.get).toBe('function');
    expect(typeof httpClient.post).toBe('function');
    expect(typeof httpClient.put).toBe('function');
    expect(typeof httpClient.delete).toBe('function');
  });

  it('should have token management methods', () => {
    expect(typeof httpClient.setAuthToken).toBe('function');
    expect(typeof httpClient.setRefreshToken).toBe('function');
    expect(typeof httpClient.clearTokens).toBe('function');
  });

  it('should have interceptor methods', () => {
    expect(typeof httpClient.addRequestInterceptor).toBe('function');
    expect(typeof httpClient.addResponseInterceptor).toBe('function');
  });

  it('should have retry configuration method', () => {
    expect(typeof httpClient.setRetryConfig).toBe('function');
  });

  it('should have backward compatibility methods', () => {
    expect(typeof httpClient.makeAuthenticatedRequest).toBe('function');
  });
});