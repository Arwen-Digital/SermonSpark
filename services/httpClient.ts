import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for sync operations
export interface SyncHttpClient {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
  delete(endpoint: string): Promise<void>;
}

// Request/Response interceptor types
export interface RequestInterceptor {
  (config: RequestConfig): Promise<RequestConfig> | RequestConfig;
}

export interface ResponseInterceptor {
  onFulfilled?: <T>(response: T) => T | Promise<T>;
  onRejected?: (error: Error) => Error | Promise<Error>;
}

export interface RequestConfig {
  endpoint: string;
  options: RequestInit;
  includeAuth: boolean;
  retryCount?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: Error) => boolean;
}

// HTTP client configuration for Express.js backend with sync capabilities
class HttpClient implements SyncHttpClient {
  private baseURL: string;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryCondition: (error: Error) => {
      // Retry on network errors and 5xx server errors
      return error.message.includes('fetch') || 
             error.message.includes('Network') ||
             error.message.includes('500') ||
             error.message.includes('502') ||
             error.message.includes('503') ||
             error.message.includes('504');
    }
  };

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_EXPRESS_API_URL || 'http://localhost:3000';
    this.initializeTokens();
  }

  private async initializeTokens() {
    try {
      if (Platform.OS === 'web') {
        this.authToken = localStorage.getItem('auth_token');
        this.refreshToken = localStorage.getItem('refresh_token');
      } else {
        this.authToken = await AsyncStorage.getItem('auth_token');
        this.refreshToken = await AsyncStorage.getItem('refresh_token');
      }
    } catch (error) {
      console.warn('Failed to initialize tokens:', error);
    }
  }

  private async getAuthToken(): Promise<string | null> {
    if (this.authToken) {
      return this.authToken;
    }

    try {
      if (Platform.OS === 'web') {
        this.authToken = localStorage.getItem('auth_token');
      } else {
        this.authToken = await AsyncStorage.getItem('auth_token');
      }
      return this.authToken;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    if (this.refreshToken) {
      return this.refreshToken;
    }

    try {
      if (Platform.OS === 'web') {
        this.refreshToken = localStorage.getItem('refresh_token');
      } else {
        this.refreshToken = await AsyncStorage.getItem('refresh_token');
      }
      return this.refreshToken;
    } catch (error) {
      console.warn('Failed to get refresh token:', error);
      return null;
    }
  }

  async setAuthToken(token: string | null) {
    this.authToken = token;
    try {
      if (Platform.OS === 'web') {
        if (token) {
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_token');
        }
      } else {
        if (token) {
          await AsyncStorage.setItem('auth_token', token);
        } else {
          await AsyncStorage.removeItem('auth_token');
        }
      }
    } catch (error) {
      console.warn('Failed to set auth token:', error);
    }
  }

  async setRefreshToken(token: string | null) {
    this.refreshToken = token;
    try {
      if (Platform.OS === 'web') {
        if (token) {
          localStorage.setItem('refresh_token', token);
        } else {
          localStorage.removeItem('refresh_token');
        }
      } else {
        if (token) {
          await AsyncStorage.setItem('refresh_token', token);
        } else {
          await AsyncStorage.removeItem('refresh_token');
        }
      }
    } catch (error) {
      console.warn('Failed to set refresh token:', error);
    }
  }

  async clearTokens() {
    this.authToken = null;
    this.refreshToken = null;
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      } else {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('refresh_token');
      }
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  private async getHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Token refresh logic
  private async refreshAuthToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      throw error;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      if (!data.success || !data.data.accessToken) {
        throw new Error('Invalid refresh response');
      }

      const newAccessToken = data.data.accessToken;
      const newRefreshToken = data.data.refreshToken;

      await this.setAuthToken(newAccessToken);
      if (newRefreshToken) {
        await this.setRefreshToken(newRefreshToken);
      }

      return newAccessToken;
    } catch (error) {
      // Clear tokens on refresh failure
      await this.clearTokens();
      throw new Error('Authentication expired. Please log in again.');
    }
  }

  // Interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  private async handleResponse<T>(response: Response, config: RequestConfig): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If we can't parse the error response, use the default message
      }

      // Handle authentication errors with token refresh
      if (response.status === 401 && config.includeAuth) {
        try {
          await this.refreshAuthToken();
          // Retry the original request with new token
          return this.executeRequest<T>(config);
        } catch (refreshError) {
          throw new Error('Authentication expired. Please log in again.');
        }
      }

      const error = new Error(errorMessage);
      
      // Apply response interceptors for errors
      let processedError = error;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onRejected) {
          try {
            processedError = await Promise.resolve(interceptor.onRejected(processedError));
          } catch (interceptorError) {
            processedError = interceptorError instanceof Error ? interceptorError : new Error('Interceptor error');
          }
        }
      }

      throw processedError;
    }

    try {
      const data = await response.json();
      // Handle Express.js response format
      if (data.success === false) {
        throw new Error(data.error?.message || 'Request failed');
      }
      
      let result = data.success ? data.data : data;
      
      // Apply response interceptors for success
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onFulfilled) {
          try {
            result = await Promise.resolve(interceptor.onFulfilled(result));
          } catch (interceptorError) {
            throw interceptorError instanceof Error ? interceptorError : new Error('Interceptor error');
          }
        }
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to parse response');
    }
  }

  // Retry logic with exponential backoff
  private async executeWithRetry<T>(config: RequestConfig): Promise<T> {
    let lastError: Error;
    const retryCount = config.retryCount || 0;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>({ ...config, retryCount: attempt });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry if it's the last attempt or if retry condition is not met
        if (attempt === this.retryConfig.maxRetries || !this.retryConfig.retryCondition?.(lastError)) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;
        
        // If clearly offline, don't block UI. Fail fast without sleeping.
        if (typeof navigator !== 'undefined' && 'onLine' in navigator && navigator.onLine === false) {
          throw lastError;
        }
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }

    throw lastError!;
  }

  // Core request execution
  private async executeRequest<T>(config: RequestConfig): Promise<T> {
    // Apply request interceptors
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      try {
        processedConfig = await Promise.resolve(interceptor(processedConfig));
      } catch (error) {
        throw error instanceof Error ? error : new Error('Request interceptor error');
      }
    }

    const headers = await this.getHeaders(processedConfig.includeAuth);
    const finalOptions = {
      ...processedConfig.options,
      headers: {
        ...headers,
        ...processedConfig.options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${processedConfig.endpoint}`, finalOptions);
    return this.handleResponse<T>(response, processedConfig);
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (endpoint.includes('?') ? '&' : '?') + queryString;
      }
    }

    const config: RequestConfig = {
      endpoint: url,
      options: { method: 'GET' },
      includeAuth: true,
    };

    return this.executeWithRetry<T>(config);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const config: RequestConfig = {
      endpoint,
      options: {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth: true,
    };

    return this.executeWithRetry<T>(config);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const config: RequestConfig = {
      endpoint,
      options: {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth: true,
    };

    return this.executeWithRetry<T>(config);
  }

  async delete(endpoint: string): Promise<void> {
    const config: RequestConfig = {
      endpoint,
      options: { method: 'DELETE' },
      includeAuth: true,
    };

    await this.executeWithRetry<void>(config);
  }

  // Legacy methods for backward compatibility
  async getLegacy<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const config: RequestConfig = {
      endpoint,
      options: { method: 'GET' },
      includeAuth,
    };

    return this.executeWithRetry<T>(config);
  }

  async postLegacy<T>(endpoint: string, data?: any, includeAuth: boolean = true): Promise<T> {
    const config: RequestConfig = {
      endpoint,
      options: {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth,
    };

    return this.executeWithRetry<T>(config);
  }

  async putLegacy<T>(endpoint: string, data?: any, includeAuth: boolean = true): Promise<T> {
    const config: RequestConfig = {
      endpoint,
      options: {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth,
    };

    return this.executeWithRetry<T>(config);
  }

  async deleteLegacy<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const config: RequestConfig = {
      endpoint,
      options: { method: 'DELETE' },
      includeAuth,
    };

    return this.executeWithRetry<T>(config);
  }

  // Helper method for authenticated requests (backward compatibility)
  async makeAuthenticatedRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const config: RequestConfig = {
      endpoint,
      options: options || { method: 'GET' },
      includeAuth: true,
    };

    return this.executeWithRetry<T>(config);
  }
}

export const httpClient = new HttpClient();
export default httpClient;