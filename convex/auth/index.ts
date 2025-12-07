/**
 * Authentication mutations and queries
 * Core auth functions: signUp, signIn, signOut, getCurrentUser
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import {
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpiry,
    verifyToken
} from "./jwt";
import {
    hashPassword,
    hashToken,
    validatePassword,
    verifyPassword
} from "./password";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation: 3-30 chars, alphanumeric and underscores
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

/**
 * Sign up a new user with email and password
 */
export const signUp = action({
    args: {
        email: v.string(),
        password: v.string(),
        username: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{
        success: boolean;
        error?: string;
        accessToken?: string;
        refreshToken?: string;
        user?: {
            id: string;
            email: string;
            username?: string;
        };
    }> => {
        const { email, password, username } = args;
        const normalizedEmail = email.toLowerCase().trim();

        // Validate email format
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return { success: false, error: "Invalid email format" };
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return {
                success: false,
                error: passwordValidation.errors[0]
            };
        }

        // Validate username if provided
        if (username) {
            if (!USERNAME_REGEX.test(username)) {
                return {
                    success: false,
                    error: "Username must be 3-30 characters, containing only letters, numbers, and underscores"
                };
            }
        }

        // Check if email already exists
        const existingUser = await ctx.runQuery(
            "auth/queries:getUserByEmail" as any,
            { email: normalizedEmail }
        );
        if (existingUser) {
            return { success: false, error: "An account with this email already exists" };
        }

        // Check if username already exists
        if (username) {
            const existingUsername = await ctx.runQuery(
                "auth/queries:getUserByUsername" as any,
                { username }
            );
            if (existingUsername) {
                return { success: false, error: "This username is already taken" };
            }
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const userId = await ctx.runMutation(
            "auth/mutations:createUser" as any,
            {
                email: normalizedEmail,
                passwordHash,
                username: username || undefined,
                authProvider: "email",
                isEmailVerified: false,
            }
        );

        // Get JWT secret from environment
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return { success: false, error: "Server configuration error" };
        }

        // Generate tokens
        const accessToken = await generateAccessToken(userId, normalizedEmail, jwtSecret);
        const refreshToken = await generateRefreshToken(userId, normalizedEmail, jwtSecret);

        // Store refresh token hash in sessions
        const refreshTokenHash = await hashToken(refreshToken);
        await ctx.runMutation(
            "auth/mutations:createSession" as any,
            {
                userId,
                tokenHash: refreshTokenHash,
                expiresAt: getRefreshTokenExpiry().toISOString(),
            }
        );

        return {
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: userId,
                email: normalizedEmail,
                username: username || undefined,
            },
        };
    },
});

/**
 * Sign in an existing user
 */
export const signIn = action({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args): Promise<{
        success: boolean;
        error?: string;
        accessToken?: string;
        refreshToken?: string;
        user?: {
            id: string;
            email: string;
            username?: string;
        };
    }> => {
        const { email, password } = args;
        const normalizedEmail = email.toLowerCase().trim();

        // Generic error message to prevent user enumeration
        const genericError = "Invalid email or password";

        // Find user by email
        const user = await ctx.runQuery(
            "auth/queries:getUserByEmail" as any,
            { email: normalizedEmail }
        );

        if (!user) {
            return { success: false, error: genericError };
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            return { success: false, error: genericError };
        }

        // Get JWT secret from environment
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return { success: false, error: "Server configuration error" };
        }

        // Generate tokens
        const accessToken = await generateAccessToken(user._id, user.email, jwtSecret);
        const refreshToken = await generateRefreshToken(user._id, user.email, jwtSecret);

        // Store refresh token hash in sessions
        const refreshTokenHash = await hashToken(refreshToken);
        await ctx.runMutation(
            "auth/mutations:createSession" as any,
            {
                userId: user._id,
                tokenHash: refreshTokenHash,
                expiresAt: getRefreshTokenExpiry().toISOString(),
            }
        );

        return {
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        };
    },
});

/**
 * Sign out - invalidate refresh token
 */
export const signOut = action({
    args: {
        refreshToken: v.string(),
    },
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        const { refreshToken } = args;

        // Hash the token to find matching session
        const tokenHash = await hashToken(refreshToken);

        // Delete the session
        await ctx.runMutation(
            "auth/mutations:deleteSessionByTokenHash" as any,
            { tokenHash }
        );

        return { success: true };
    },
});

/**
 * Refresh access token using refresh token
 */
export const refreshSession = action({
    args: {
        refreshToken: v.string(),
    },
    handler: async (ctx, args): Promise<{
        success: boolean;
        error?: string;
        accessToken?: string;
        refreshToken?: string;
    }> => {
        const { refreshToken } = args;

        // Get JWT secret
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return { success: false, error: "Server configuration error" };
        }

        // Verify the refresh token
        const payload = await verifyToken(refreshToken, jwtSecret);
        if (!payload || payload.type !== 'refresh') {
            return { success: false, error: "Invalid refresh token" };
        }

        // Check if session exists
        const tokenHash = await hashToken(refreshToken);
        const session = await ctx.runQuery(
            "auth/queries:getSessionByTokenHash" as any,
            { tokenHash }
        );

        if (!session) {
            return { success: false, error: "Session not found" };
        }

        // Check if session is expired
        if (new Date(session.expiresAt) < new Date()) {
            await ctx.runMutation(
                "auth/mutations:deleteSessionByTokenHash" as any,
                { tokenHash }
            );
            return { success: false, error: "Session expired" };
        }

        // Get user
        const user = await ctx.runQuery(
            "auth/queries:getUserById" as any,
            { userId: payload.userId }
        );

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Generate new tokens
        const newAccessToken = await generateAccessToken(user._id, user.email, jwtSecret);
        const newRefreshToken = await generateRefreshToken(user._id, user.email, jwtSecret);

        // Delete old session and create new one
        await ctx.runMutation(
            "auth/mutations:deleteSessionByTokenHash" as any,
            { tokenHash }
        );

        const newTokenHash = await hashToken(newRefreshToken);
        await ctx.runMutation(
            "auth/mutations:createSession" as any,
            {
                userId: user._id,
                tokenHash: newTokenHash,
                expiresAt: getRefreshTokenExpiry().toISOString(),
            }
        );

        return {
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    },
});

/**
 * Verify an access token and get user info
 */
export const verifyAccessToken = action({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args): Promise<{
        valid: boolean;
        user?: {
            id: string;
            email: string;
            username?: string;
        };
    }> => {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return { valid: false };
        }

        const payload = await verifyToken(args.token, jwtSecret);
        if (!payload || payload.type !== 'access') {
            return { valid: false };
        }

        const user = await ctx.runQuery(
            "auth/queries:getUserById" as any,
            { userId: payload.userId }
        );

        if (!user) {
            return { valid: false };
        }

        return {
            valid: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        };
    },
});
