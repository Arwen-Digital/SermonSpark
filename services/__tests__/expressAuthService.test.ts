import AsyncStorage from '@react-native-async-storage/async-storage';
import { expressAuthService } from '../expressAuthService';
import { httpClient } from '../httpClient';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../httpClient');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('ExpressAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('Authentication Flow', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      username: 'testuser',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      profile: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Test User',
        title: 'Pastor',
        church: 'Test Church'
      }
    };

    const mockAuthResponse = {
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
        expiresIn: 3600
      },
      timestamp: '2024-01-01T00:00:00.000Z'
    };

    describe('signup', () => {
      it('should register a new user successfully', async () => {
        mockHttpClient.post.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockAuthResponse
        } as Response);

        const signupData = {
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          full_name: 'Test User',
          title: 'Pastor',
          church: 'Test Church'
        };

        const result = await expressAuthService.signup(signupData);

        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/register', signupData);
        expect(result.user).toEqual(mockUser);
        expect(result.session).toEqual({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser
        });

        // Verify tokens are stored
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'mock-access-token');
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'mock-refresh-token');
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      });

      it('should handle signup validation errors', async () => {
        const errorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              { path: 'email', msg: 'Please provide a valid email address' }
            ]
          },
          timestamp: '2024-01-01T00:00:00.000Z'
        };

        mockHttpClient.post.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => errorResponse
        } as Response);

        const signupData = {
          email: 'invalid-email',
          password: 'password123',
          username: 'testuser'
        };

        const result = await expressAuthService.signup(signupData);

        expect(result.error).toEqual({
          message: 'Validation failed',
          details: errorResponse.error.details
        });
        expect(result.user).toBeNull();
        expect(result.session).toBeNull();
      });

      it('should handle duplicate user errors', async () => {
        const errorResponse = {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'A user with this email address already exists'
          },
          timestamp: '2024-01-01T00:00:00.000Z'
        };

        mockHttpClient.post.mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => errorResponse
        } as Response);

        const signupData = {
          email: 'existing@example.com',
          password: 'password123',
          username: 'testuser'
        };

        const result = await expressAuthService.signup(signupData);

        expect(result.error).toEqual({
          message: 'A user with this email address already exists'
        });
      });
    });

    describe('signin', () => {
      it('should login user successfully', async () => {
        mockHttpClient.post.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockAuthResponse
        } as Response);

        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const result = await expressAuthService.signin(loginData);

        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', loginData);
        expect(result.user).toEqual(mockUser);
        expect(result.session).toEqual({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser
        });

        // Verify tokens are stored
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'mock-access-token');
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'mock-refresh-token');
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      });

      it('should handle invalid credentials', async () => {
        const errorResponse = {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          },
          timestamp: '2024-01-01T00:00:00.000Z'
        };

        mockHttpClient.post.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => errorResponse
        } as Response);

        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword'
        };

        const result = await expressAuthService.signin(loginData);

        expect(result.error).toEqual({
          message: 'Invalid email or password'
        });
        expect(result.user).toBeNull();
        expect(result.session).toBeNull();
      });
    });

    describe('signout', () => {
      it('should logout user successfully', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('mock-access-token');
        mockHttpClient.post.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { message: 'Logout successful' }
          })
        } as Response);

        const result = await expressAuthService.signout();

        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/logout');
        expect(result.error).toBeNull();

        // Verify tokens are cleared
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('access_token');
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user');
      });

      it('should clear local storage even if API call fails', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('mock-access-token');
        mockHttpClient.post.mockRejectedValueOnce(new Error('Network error'));

        const result = await expressAuthService.signout();

        expect(result.error).toBeNull();

        // Verify tokens are still cleared
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('access_token');
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user');
      });
    });
  });

  describe('User Management', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      username: 'testuser',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      profile: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Test User',
        title: 'Pastor',
        church: 'Test Church'
      }
    };

    describe('getUser', () => {
      it('should return cached user when available', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockUser));

        const user = await expressAuthService.getUser();

        expect(user).toEqual(mockUser);
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('user');
      });

      it('should return null when no cached user', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null);

        const user = await expressAuthService.getUser();

        expect(user).toBeNull();
      });

      it('should handle corrupted cached user data', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('invalid-json');

        const user = await expressAuthService.getUser();

        expect(user).toBeNull();
      });
    });

    describe('getCurrentUser', () => {
      it('should fetch current user from API', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('mock-access-token');
        mockHttpClient.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { user: mockUser },
            timestamp: '2024-01-01T00:00:00.000Z'
          })
        } as Response);

        const user = await expressAuthService.getCurrentUser();

        expect(mockHttpClient.get).toHaveBeenCalledWith('/auth/me');
        expect(user).toEqual(mockUser);

        // Verify user is cached
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      });

      it('should handle unauthenticated user', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null);

        const user = await expressAuthService.getCurrentUser();

        expect(user).toBeNull();
        expect(mockHttpClient.get).not.toHaveBeenCalled();
      });

      it('should handle API errors', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('mock-access-token');
        mockHttpClient.get.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid token' }
          })
        } as Response);

        const user = await expressAuthService.getCurrentUser();

        expect(user).toBeNull();
        
        // Verify tokens are cleared on auth error
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('access_token');
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user');
      });
    });

    describe('updateProfile', () => {
      it('should update user profile successfully', async () => {
        const updatedUser = {
          ...mockUser,
          profile: {
            ...mockUser.profile,
            full_name: 'Updated Name',
            title: 'Senior Pastor'
          }
        };

        mockAsyncStorage.getItem.mockResolvedValueOnce('mock-access-token');
        mockHttpClient.put.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { user: updatedUser },
            timestamp: '2024-01-01T00:00:00.000Z'
          })
        } as Response);

        const profileUpdates = {
          full_name: 'Updated Name',
          title: 'Senior Pastor'
        };

        const result = await expressAuthService.updateProfile(profileUpdates);

        expect(mockHttpClient.put).toHaveBeenCalledWith('/auth/profile', profileUpdates);
        expect(result).toEqual(updatedUser);

        // Verify updated user is cached
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
      });

      it('should handle validation errors', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('mock-access-token');
        mockHttpClient.put.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { path: 'full_name', msg: 'Full name is too long' }
              ]
            }
          })
        } as Response);

        const profileUpdates = {
          full_name: 'a'.repeat(256)
        };

        await expect(expressAuthService.updateProfile(profileUpdates))
          .rejects.toThrow('Validation failed');
      });
    });

    describe('isAuthenticated', () => {
      it('should return true when access token exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('mock-access-token');

        const isAuth = await expressAuthService.isAuthenticated();

        expect(isAuth).toBe(true);
      });

      it('should return false when no access token', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null);

        const isAuth = await expressAuthService.isAuthenticated();

        expect(isAuth).toBe(false);
      });
    });
  });

  describe('Password Management', () => {
    describe('forgotPassword', () => {
      it('should send password reset request successfully', async () => {
        mockHttpClient.post.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { message: 'Password reset link has been sent to your email' },
            timestamp: '2024-01-01T00:00:00.000Z'
          })
        } as Response);

        await expressAuthService.forgotPassword('test@example.com');

        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
          email: 'test@example.com'
        });
      });

      it('should handle invalid email', async () => {
        mockHttpClient.post.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid email format'
            }
          })
        } as Response);

        await expect(expressAuthService.forgotPassword('invalid-email'))
          .rejects.toThrow('Invalid email format');
      });
    });
  });

  describe('HTTP Client Integration', () => {
    describe('makeAuthenticatedRequest', () => {
      it('should make authenticated requests with token', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('mock-access-token');
        mockHttpClient.request.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'test' })
        } as Response);

        const response = await expressAuthService.makeAuthenticatedRequest('/test-endpoint', {
          method: 'GET'
        });

        expect(mockHttpClient.request).toHaveBeenCalledWith('/test-endpoint', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-access-token'
          }
        });
        expect(response.ok).toBe(true);
      });

      it('should handle requests without token', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null);

        await expect(expressAuthService.makeAuthenticatedRequest('/test-endpoint'))
          .rejects.toThrow('No access token available');
      });

      it('should handle token refresh on 401 errors', async () => {
        mockAsyncStorage.getItem
          .mockResolvedValueOnce('expired-token') // First call for access token
          .mockResolvedValueOnce('mock-refresh-token'); // Second call for refresh token

        // First request fails with 401
        mockHttpClient.request.mockResolvedValueOnce({
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
        mockHttpClient.request.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' })
        } as Response);

        const response = await expressAuthService.makeAuthenticatedRequest('/test-endpoint');

        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/refresh', {
          refresh_token: 'mock-refresh-token'
        });
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'new-access-token');
        expect(response.ok).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockHttpClient.post.mockRejectedValueOnce(new Error('Network request failed'));

      const result = await expressAuthService.signin({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.error).toEqual({
        message: 'Network request failed'
      });
      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
    });

    it('should handle JSON parsing errors', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      const result = await expressAuthService.signin({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.error).toEqual({
        message: 'Invalid JSON'
      });
    });

    it('should handle AsyncStorage errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const user = await expressAuthService.getUser();

      expect(user).toBeNull();
    });
  });

  describe('Data Format Compatibility', () => {
    it('should transform Express response to Supabase-compatible format', async () => {
      const expressResponse = {
        success: true,
        data: {
          accessToken: 'express-token',
          refreshToken: 'express-refresh',
          user: {
            id: '123',
            email: 'test@example.com',
            username: 'testuser',
            profile: {
              full_name: 'Test User'
            }
          },
          expiresIn: 3600
        }
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => expressResponse
      } as Response);

      const result = await expressAuthService.signin({
        email: 'test@example.com',
        password: 'password123'
      });

      // Should match Supabase AuthResponse format
      expect(result.session).toEqual({
        access_token: 'express-token',
        refresh_token: 'express-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: expressResponse.data.user
      });
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        profile: {
          full_name: null,
          title: null,
          church: null
        }
      };

      mockHttpClient.post.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'token',
            refreshToken: 'refresh',
            user: minimalUser,
            expiresIn: 3600
          }
        })
      } as Response);

      const result = await expressAuthService.signin({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.user).toEqual(minimalUser);
      expect(result.user?.profile.full_name).toBeNull();
    });
  });
});