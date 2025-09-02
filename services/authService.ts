import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiBase(): string {
  // 1) Explicit env (best): EXPO_PUBLIC_API_URL
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }

  // 2) Derive from Expo dev host (works on LAN)
  //    In Expo Go, hostUri typically looks like "192.168.1.10:8081"
  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host && /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `http://${host}:1337`;
    }
  }

  // 3) Platform-specific fallback for emulators/simulators
  if (Platform.OS === 'android') {
    // Android emulator maps host machine to 10.0.2.2
    return 'http://10.0.2.2:1337';
  }

  // 4) Default (may not work on physical device)
  return 'http://localhost:1337';
}

const STRAPI_BASE_URL = resolveApiBase();
const API_BASE_URL = `${STRAPI_BASE_URL}/api`;
const TOKEN_KEY = '@sermon_spark_token';
const USER_KEY = '@sermon_spark_user';

export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  // Custom fields for pastor profile
  fullName?: string;
  title?: string;
  church?: string;
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  title?: string;
  church?: string;
}

export interface LoginData {
  identifier: string; // email or username
  password: string;
}

class AuthService {
  // Store token in AsyncStorage
  async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  // Get stored token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Store user data
  async storeUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
      throw new Error('Failed to store user data');
    }
  }

  // Get stored user
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Clear stored auth data
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  }

  // Sign up new user
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Signup error response:', errorData);
        throw new Error(errorData.error?.message || errorData.message?.[0]?.messages?.[0]?.message || 'Signup failed');
      }

      const authData: AuthResponse = await response.json();
      
      // Store token and user data
      await this.storeToken(authData.jwt);
      await this.storeUser(authData.user);

      // Create pastor profile if fullName is provided (required field)
      if (data.fullName && data.fullName.trim()) {
        try {
          const profileData: any = {
            fullName: data.fullName.trim(),
          };
          
          // Only add optional fields if they have actual content
          if (data.title && data.title.trim()) {
            profileData.title = data.title.trim();
          }
          if (data.church && data.church.trim()) {
            profileData.church = data.church.trim();
          }
          
          await this.createPastorProfileWithUser(authData.user.id, profileData);
        } catch (profileError) {
          console.warn('Failed to create pastor profile:', profileError);
          // Don't fail the signup if profile creation fails
        }
      }
      
      return authData;
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
      const response = await fetch(`${API_BASE_URL}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: data.identifier,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Sign in failed');
      }

      const authData: AuthResponse = await response.json();
      
      // Store token and user data
      await this.storeToken(authData.jwt);
      await this.storeUser(authData.user);
      
      return authData;
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
      await this.clearAuthData();
    } catch (error) {
      console.error('Signout error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Password reset request failed');
      }

      // Strapi doesn't return data for forgot password, just check if request was successful
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during password reset request');
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.makeAuthenticatedRequest('/users/me');
      
      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const user: User = await response.json();
      await this.storeUser(user); // Update stored user data
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error while fetching user profile');
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = await this.getUser();
      if (!currentUser) {
        throw new Error('No user found');
      }

      const response = await this.makeAuthenticatedRequest(`/users/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Profile update failed');
      }

      const updatedUser: User = await response.json();
      await this.storeUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during profile update');
    }
  }

  // Create pastor profile with user relationship
  async createPastorProfileWithUser(userId: number, profileData: {
    fullName?: string;
    title?: string;
    church?: string;
  }): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest('/pastor-profiles', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            ...profileData,
            user: userId
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Pastor profile creation error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error?.message || `Pastor profile creation failed (${response.status})`);
      }

      const profileResult = await response.json();
      console.log('Pastor profile created successfully with user relationship:', profileResult);
      return profileResult;
    } catch (error) {
      console.error('Create pastor profile error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during pastor profile creation');
    }
  }

  // Get pastor profile
  async getPastorProfile(): Promise<any> {
    try {
      const currentUser = await this.getUser();
      if (!currentUser) {
        throw new Error('No user found');
      }

      const response = await this.makeAuthenticatedRequest(
        `/pastor-profiles?filters[user][id][$eq]=${currentUser.id}&populate=*`
      );

      if (!response.ok) {
        throw new Error('Failed to get pastor profile');
      }

      const data = await response.json();
      return data.data?.[0] || null;
    } catch (error) {
      console.error('Get pastor profile error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error while fetching pastor profile');
    }
  }
}

export default new AuthService();
