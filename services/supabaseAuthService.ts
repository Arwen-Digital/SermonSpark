import { supabase } from './supabaseClient';

export interface User {
  id: string;  // Changed from number to string (UUID)
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

class SupabaseAuthService {
  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  // Get current user
  async getUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, title, church')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || '',
      email: user.email || '',
      confirmed: !!user.email_confirmed_at,
      blocked: false, // Supabase doesn't have blocked status like Strapi
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
      fullName: profile?.full_name || undefined,
      title: profile?.title || undefined,
      church: profile?.church || undefined,
    };
  }

  // Sign up new user
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          }
        }
      });

      if (error) throw error;
      if (!authData.user) throw new Error('No user returned from signup');

      // Create profile if we have additional data
      if (data.fullName || data.title || data.church) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: data.fullName || null,
            title: data.title || null,
            church: data.church || null,
          });

        if (profileError) {
          console.warn('Failed to create profile:', profileError);
          // Don't fail signup if profile creation fails
        }
      }

      const user: User = {
        id: authData.user.id,
        username: data.username,
        email: authData.user.email || '',
        confirmed: !!authData.user.email_confirmed_at,
        blocked: false,
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at || authData.user.created_at,
        fullName: data.fullName,
        title: data.title,
        church: data.church,
      };

      return {
        jwt: authData.session?.access_token || '',
        user,
      };
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
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.identifier, // Supabase uses email for sign in
        password: data.password,
      });

      if (error) throw error;
      if (!authData.user || !authData.session) throw new Error('No user returned from signin');

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, title, church')
        .eq('id', authData.user.id)
        .single();

      const user: User = {
        id: authData.user.id,
        username: authData.user.user_metadata?.username || authData.user.email?.split('@')[0] || '',
        email: authData.user.email || '',
        confirmed: !!authData.user.email_confirmed_at,
        blocked: false,
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at || authData.user.created_at,
        fullName: profile?.full_name || undefined,
        title: profile?.title || undefined,
        church: profile?.church || undefined,
      };

      return {
        jwt: authData.session.access_token,
        user,
      };
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Signout error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      // Update auth metadata if username is being changed
      if (updates.username) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { username: updates.username }
        });
        if (authError) throw authError;
      }

      // Update profile table
      const profileUpdates: any = {};
      if (updates.fullName !== undefined) profileUpdates.full_name = updates.fullName;
      if (updates.title !== undefined) profileUpdates.title = updates.title;
      if (updates.church !== undefined) profileUpdates.church = updates.church;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            ...profileUpdates,
          });
        
        if (profileError) throw profileError;
      }

      // Return updated user
      return await this.getCurrentUser();
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return profile || null;
  }

  // Legacy method for compatibility - not needed with Supabase but keeping for interface compatibility
  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      ...(session && { Authorization: `Bearer ${session.access_token}` }),
      ...options.headers,
    };

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    return fetch(`${baseUrl}/rest/v1${endpoint}`, {
      ...options,
      headers,
    });
  }
}

export default new SupabaseAuthService();