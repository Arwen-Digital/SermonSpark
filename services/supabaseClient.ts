import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a cross-platform storage adapter
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Web storage using localStorage
    return {
      getItem: async (key: string) => {
        if (typeof window === 'undefined' || !window.localStorage) {
          return null
        }
        return window.localStorage.getItem(key)
      },
      setItem: async (key: string, value: string) => {
        if (typeof window === 'undefined' || !window.localStorage) {
          return
        }
        window.localStorage.setItem(key, value)
      },
      removeItem: async (key: string) => {
        if (typeof window === 'undefined' || !window.localStorage) {
          return
        }
        window.localStorage.removeItem(key)
      },
    }
  } else {
    // Mobile storage - import AsyncStorage dynamically
    let AsyncStorage: any
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default
    } catch (error) {
      console.warn('AsyncStorage not available:', error)
      return {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      }
    }
    return AsyncStorage
  }
}

// Configuration based on platform
const getSupabaseConfig = () => {
  if (Platform.OS === 'web') {
    // For web - use session storage without persistence to avoid AsyncStorage issues
    return {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Disable persistence for web for now
        detectSessionInUrl: true,
      },
    }
  } else {
    // For mobile - use AsyncStorage
    return {
      auth: {
        storage: createStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, getSupabaseConfig())

// Database type definitions based on our schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          title: string | null
          church: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          title?: string | null
          church?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          title?: string | null
          church?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      series: {
        Row: {
          id: string
          title: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sermons: {
        Row: {
          id: string
          title: string
          content: string | null
          outline: any | null
          scripture: string | null
          tags: string[] | null
          status: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived'
          visibility: 'private' | 'congregation' | 'public'
          date: string | null
          notes: string | null
          duration: number | null
          audio_url: string | null
          video_url: string | null
          user_id: string
          series_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          outline?: any | null
          scripture?: string | null
          tags?: string[] | null
          status?: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived'
          visibility?: 'private' | 'congregation' | 'public'
          date?: string | null
          notes?: string | null
          duration?: number | null
          audio_url?: string | null
          video_url?: string | null
          user_id: string
          series_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          outline?: any | null
          scripture?: string | null
          tags?: string[] | null
          status?: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived'
          visibility?: 'private' | 'congregation' | 'public'
          date?: string | null
          notes?: string | null
          duration?: number | null
          audio_url?: string | null
          video_url?: string | null
          user_id?: string
          series_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}