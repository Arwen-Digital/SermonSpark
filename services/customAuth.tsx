/**
 * Custom Authentication Service
 * Provides AuthProvider, useAuth hook, and auth functions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../convex/_generated/api';
import { convexClient } from './convexClient';

// Storage keys
export const STORAGE_KEYS = {
    accessToken: 'auth.accessToken',
    refreshToken: 'auth.refreshToken',
    userId: 'auth.userId',
    userEmail: 'auth.userEmail',
    username: 'auth.username',
} as const;

/**
 * Get stored access token (for use outside components)
 */
export async function getStoredAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.accessToken);
}

// Types
export interface User {
    id: string;
    email: string;
    username?: string;
}

export interface AuthState {
    isLoading: boolean;
    isSignedIn: boolean;
    user: User | null;
    accessToken: string | null;
}

export interface AuthContextValue extends AuthState {
    signUp: (email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<boolean>;
}

// Context
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return true;

        // Add 30 second buffer to refresh before actual expiry
        return Date.now() >= (payload.exp * 1000 - 30000);
    } catch {
        return true;
    }
}

/**
 * AuthProvider component
 * Wraps the app and provides authentication state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isLoading: true,
        isSignedIn: false,
        user: null,
        accessToken: null,
    });

    // Load stored auth state on mount
    useEffect(() => {
        loadStoredAuth();
    }, []);

    // Set up Convex auth when access token changes
    useEffect(() => {
        if (state.accessToken) {
            convexClient.setAuth(async () => state.accessToken);
        } else {
            convexClient.setAuth(async () => null);
        }
    }, [state.accessToken]);

    /**
     * Load stored authentication from AsyncStorage
     */
    const loadStoredAuth = async () => {
        try {
            const [accessToken, refreshToken, userId, userEmail, username] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.accessToken),
                AsyncStorage.getItem(STORAGE_KEYS.refreshToken),
                AsyncStorage.getItem(STORAGE_KEYS.userId),
                AsyncStorage.getItem(STORAGE_KEYS.userEmail),
                AsyncStorage.getItem(STORAGE_KEYS.username),
            ]);

            if (accessToken && userId && userEmail) {
                // Check if access token is still valid
                if (!isTokenExpired(accessToken)) {
                    setState({
                        isLoading: false,
                        isSignedIn: true,
                        user: {
                            id: userId,
                            email: userEmail,
                            username: username || undefined,
                        },
                        accessToken,
                    });
                    return;
                }

                // Try to refresh if we have a refresh token
                if (refreshToken && !isTokenExpired(refreshToken)) {
                    const refreshed = await refreshSessionInternal(refreshToken);
                    if (refreshed) {
                        return;
                    }
                }
            }

            // No valid auth
            setState({
                isLoading: false,
                isSignedIn: false,
                user: null,
                accessToken: null,
            });
        } catch (error) {
            console.error('Error loading stored auth:', error);
            setState({
                isLoading: false,
                isSignedIn: false,
                user: null,
                accessToken: null,
            });
        }
    };

    /**
     * Store authentication data
     */
    const storeAuth = async (
        accessToken: string,
        refreshToken: string,
        user: User
    ) => {
        await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.accessToken, accessToken),
            AsyncStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken),
            AsyncStorage.setItem(STORAGE_KEYS.userId, user.id),
            AsyncStorage.setItem(STORAGE_KEYS.userEmail, user.email),
            user.username
                ? AsyncStorage.setItem(STORAGE_KEYS.username, user.username)
                : AsyncStorage.removeItem(STORAGE_KEYS.username),
        ]);
    };

    /**
     * Clear stored authentication
     */
    const clearStoredAuth = async () => {
        await Promise.all([
            AsyncStorage.removeItem(STORAGE_KEYS.accessToken),
            AsyncStorage.removeItem(STORAGE_KEYS.refreshToken),
            AsyncStorage.removeItem(STORAGE_KEYS.userId),
            AsyncStorage.removeItem(STORAGE_KEYS.userEmail),
            AsyncStorage.removeItem(STORAGE_KEYS.username),
        ]);
    };

    /**
     * Internal refresh session function
     */
    const refreshSessionInternal = async (refreshToken: string): Promise<boolean> => {
        try {
            const result = await convexClient.action(api.auth.index.refreshSession, {
                refreshToken,
            });

            if (result.success && result.accessToken && result.refreshToken) {
                const userId = await AsyncStorage.getItem(STORAGE_KEYS.userId);
                const userEmail = await AsyncStorage.getItem(STORAGE_KEYS.userEmail);
                const username = await AsyncStorage.getItem(STORAGE_KEYS.username);

                if (userId && userEmail) {
                    const user = { id: userId, email: userEmail, username: username || undefined };
                    await storeAuth(result.accessToken, result.refreshToken, user);

                    setState({
                        isLoading: false,
                        isSignedIn: true,
                        user,
                        accessToken: result.accessToken,
                    });
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error refreshing session:', error);
            return false;
        }
    };

    /**
     * Sign up with email and password
     */
    const signUp = useCallback(async (
        email: string,
        password: string,
        username?: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const result = await convexClient.action(api.auth.index.signUp, {
                email,
                password,
                username,
            });

            if (result.success && result.accessToken && result.refreshToken && result.user) {
                const user: User = {
                    id: result.user.id,
                    email: result.user.email,
                    username: result.user.username,
                };

                await storeAuth(result.accessToken, result.refreshToken, user);

                setState({
                    isLoading: false,
                    isSignedIn: true,
                    user,
                    accessToken: result.accessToken,
                });

                return { success: true };
            }

            return { success: false, error: result.error || 'Sign up failed' };
        } catch (error: any) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: error.message || 'An unexpected error occurred'
            };
        }
    }, []);

    /**
     * Sign in with email and password
     */
    const signIn = useCallback(async (
        email: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const result = await convexClient.action(api.auth.index.signIn, {
                email,
                password,
            });

            if (result.success && result.accessToken && result.refreshToken && result.user) {
                const user: User = {
                    id: result.user.id,
                    email: result.user.email,
                    username: result.user.username,
                };

                await storeAuth(result.accessToken, result.refreshToken, user);

                setState({
                    isLoading: false,
                    isSignedIn: true,
                    user,
                    accessToken: result.accessToken,
                });

                return { success: true };
            }

            return { success: false, error: result.error || 'Sign in failed' };
        } catch (error: any) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message || 'An unexpected error occurred'
            };
        }
    }, []);

    /**
     * Sign out
     */
    const signOut = useCallback(async (): Promise<void> => {
        try {
            const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);

            if (refreshToken) {
                await convexClient.action(api.auth.index.signOut, { refreshToken });
            }
        } catch (error) {
            console.error('Error during sign out:', error);
        } finally {
            await clearStoredAuth();

            setState({
                isLoading: false,
                isSignedIn: false,
                user: null,
                accessToken: null,
            });
        }
    }, []);

    /**
     * Refresh the current session
     */
    const refreshSession = useCallback(async (): Promise<boolean> => {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
        if (!refreshToken) return false;
        return refreshSessionInternal(refreshToken);
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        ...state,
        signUp,
        signIn,
        signOut,
        refreshSession,
    }), [state, signUp, signIn, signOut, refreshSession]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access auth state and functions
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
    const { isSignedIn } = useAuth();
    return isSignedIn;
}

/**
 * Hook to get current user
 */
export function useCurrentUser(): User | null {
    const { user } = useAuth();
    return user;
}

import { useMutation, useQuery } from "convex/react";
import { FunctionReference } from "convex/server";

// ... existing helper hooks ...

/**
 * Hook to get user ID (compatible with existing code)
 */
export function useUserId(): string | null {
    const { user } = useAuth();
    return user?.id ?? null;
}

/**
 * Hook to run an authenticated query
 * Automatically injects the access token into args
 * Skips the query if user is not authenticated
 */
export function useAuthenticatedQuery<Query extends FunctionReference<"query">>(
    query: Query,
    args?: any // loose typing for now to avoid complex generic gymnastics with modified args
) {
    const { accessToken } = useAuth();

    // If not authenticated, pass "skip" to useQuery to prevent execution
    const finalArgs = accessToken ? { ...(args || {}), token: accessToken } : "skip";

    return useQuery(query, finalArgs);
}

/**
 * Hook to run an authenticated mutation
 * Returns a wrapper function that injects the access token
 */
export function useAuthenticatedMutation<Mutation extends FunctionReference<"mutation">>(
    mutation: Mutation
) {
    const { accessToken } = useAuth();
    const mutate = useMutation(mutation);

    return useCallback(async (args?: any) => {
        if (!accessToken) {
            throw new Error("Not authenticated");
        }
        return mutate({ ...(args || {}), token: accessToken });
    }, [accessToken, mutate]);
}
