/**
 * Auth internal mutations
 * These are called by actions, not directly from client
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Create a new user record
 */
export const createUser = internalMutation({
    args: {
        email: v.string(),
        passwordHash: v.string(),
        username: v.optional(v.string()),
        authProvider: v.union(
            v.literal("email"),
            v.literal("google"),
            v.literal("apple")
        ),
        authProviderId: v.optional(v.string()),
        isEmailVerified: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();

        const userId = await ctx.db.insert("users", {
            email: args.email,
            passwordHash: args.passwordHash,
            username: args.username,
            authProvider: args.authProvider,
            authProviderId: args.authProviderId,
            isEmailVerified: args.isEmailVerified,
            createdAt: now,
            updatedAt: now,
        });

        return userId;
    },
});

/**
 * Create a new session record
 */
export const createSession = internalMutation({
    args: {
        userId: v.id("users"),
        tokenHash: v.string(),
        expiresAt: v.string(),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const sessionId = await ctx.db.insert("sessions", {
            userId: args.userId,
            tokenHash: args.tokenHash,
            expiresAt: args.expiresAt,
            userAgent: args.userAgent,
            createdAt: new Date().toISOString(),
        });

        return sessionId;
    },
});

/**
 * Delete session by token hash
 */
export const deleteSessionByTokenHash = internalMutation({
    args: {
        tokenHash: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
            .first();

        if (session) {
            await ctx.db.delete(session._id);
        }
    },
});

/**
 * Delete all sessions for a user
 */
export const deleteAllUserSessions = internalMutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        for (const session of sessions) {
            await ctx.db.delete(session._id);
        }
    },
});

/**
 * Update user's email verification status
 */
export const verifyUserEmail = internalMutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            isEmailVerified: true,
            updatedAt: new Date().toISOString(),
        });
    },
});

/**
 * Update user password
 */
export const updatePassword = internalMutation({
    args: {
        userId: v.id("users"),
        newPasswordHash: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            passwordHash: args.newPasswordHash,
            updatedAt: new Date().toISOString(),
        });
    },
});
