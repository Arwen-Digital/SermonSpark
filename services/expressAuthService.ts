import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  username: string;
  email: string;
  email_confirmed: boolean;
  blocked: boolean;
  deleted_at: string | null;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    full_name: string | null;
    title: string | null;
    church: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  title?: string;
  church?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class ExpressAuthService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_EXPRESS_API_URL || 'http://localhost:3000';
    this.loadToken();
  }

  private async loadToken(): Promise<void> {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  private async saveToken(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      this.token = accessToken;
      await AsyncStorage.setItem('auth_token', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refresh_token', refreshToken);
      }
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  private async clearToken(): Promise<void> {
    try {
      this.token = null;
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data.data || data;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    if (!this.token) {
      await this.loadToken();
    }
    
    if (!this.token) {
      return false;
    }

    try {
      const response = await this.makeRequest('/auth/me');
      return response.ok;
    } catch (error) {
      // Offline or network failure should not show a red overlay; treat as not authenticated online
      if (__DEV__) {
        console.warn('Authentication check failed (likely offline):', error);
      }
      return false;
    }
  }

  // Ensure a profile row exists for current user; create minimal if missing
  async ensureProfileExists(): Promise<void> {
    try {
      // Call the /auth/me endpoint which will create a profile if missing
      await this.getUser();
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      // Don't throw - this is a best-effort operation
    }
  }

  // Get current user
  async getUser(): Promise<User | null> {
    if (!this.token) {
      await this.loadToken();
    }
    
    if (!this.token) {
      return null;
    }

    try {
      const response = await this.makeRequest('/auth/me');
      if (!response.ok) {
        return null;
      }
      
      const result = await this.handleResponse<{ user: User }>(response);
      return result.user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Sign up new user
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<AuthResponse>(response);
      
      if (result.accessToken) {
        await this.saveToken(result.accessToken, result.refreshToken);
      }

      return result;
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during signup');
    }
  }

  // Sign in user
  async signin(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<AuthResponse>(response);
      
      if (result.accessToken) {
        await this.saveToken(result.accessToken, result.refreshToken);
      }

      return result;
    } catch (error) {
      console.error('Signin error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during sign in');
    }
  }

  // Sign out user
  async signout(): Promise<void> {
    try {
      if (this.token) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Signout error:', error);
      // Continue with local cleanup even if server request fails
    } finally {
      await this.clearToken();
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await this.makeRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during password reset request');
    }
  }

  // Get current user profile (refresh from server)
  async getCurrentUser(): Promise<User> {
    const user = await this.getUser();
    if (!user) throw new Error('No authenticated user');
    return user;
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await this.makeRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const result = await this.handleResponse<{ user: User }>(response);
      return result.user;
    } catch (error) {
      console.error('Update profile error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during profile update');
    }
  }

  // Get pastor profile (for compatibility with existing code)
  async getPastorProfile(): Promise<any> {
    try {
      const user = await this.getUser();
      if (!user) throw new Error('No authenticated user');

      return {
        id: user.id,
        full_name: user.profile.full_name,
        title: user.profile.title,
        church: user.profile.church,
      };
    } catch (error) {
      console.error('Get pastor profile error:', error);
      throw error;
    }
  }

  // Make authenticated request (for compatibility with existing code)
  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, options);
  }
}

export default new ExpressAuthService();