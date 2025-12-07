/**
 * Auth internal queries
 * These are called by actions, not directly from client
 */

import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/**
 * Get user by email
 */
export const getUserByEmail = internalQuery({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
    },
});

/**
 * Get user by username
 */
export const getUserByUsername = internalQuery({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
    },
});

/**
 * Get user by ID
 */
export const getUserById = internalQuery({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

/**
 * Get session by token hash
 */
export const getSessionByTokenHash = internalQuery({
    args: {
        tokenHash: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sessions")
            .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
            .first();
    },
});

/**
 * Get all sessions for a user
 */
export const getUserSessions = internalQuery({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});
