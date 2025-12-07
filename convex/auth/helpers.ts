/**
 * Auth helpers for protected Convex mutations and queries
 * Provides utilities to check authentication in handlers
 */

import { ObjectType, PropertyValidators, v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "../_generated/server";
import { verifyToken } from "./jwt";

export type AuthContext = QueryCtx | MutationCtx;

/**
 * Error thrown when authentication is required
 */
export class AuthenticationError extends Error {
    constructor(message: string = "Authentication required") {
        super(message);
        this.name = "AuthenticationError";
    }
}

/**
 * Require authentication - throws if not authenticated
 * Verifies the JWT token and returns the user ID
 */
export async function requireAuth(
    ctx: AuthContext,
    token: string | null | undefined
): Promise<string> {
    if (!token) {
        throw new AuthenticationError("No token provided");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new AuthenticationError("Server configuration error");
    }

    const payload = await verifyToken(token, jwtSecret);
    if (!payload) {
        throw new AuthenticationError("Invalid or expired token");
    }

    if (payload.type !== 'access') {
        throw new AuthenticationError("Invalid token type");
    }

    return payload.userId;
}

/**
 * Check if a token is valid and associated with a user
 */
export async function isAuthenticated(
    ctx: AuthContext,
    token: string | null | undefined
): Promise<boolean> {
    try {
        await requireAuth(ctx, token);
        return true;
    } catch {
        return false;
    }
}

/**
 * Helper to create protected queries
 * Use this to wrap queries that require authentication
 */
export function authenticatedQuery<Args extends PropertyValidators, Returns>(
    config: {
        args: Args,
        handler: (ctx: QueryCtx, args: ObjectType<Args> & { userId: string }) => Promise<Returns>
    }
) {
    return query({
        args: {
            ...config.args,
            token: v.optional(v.string())
        },
        handler: async (ctx, args: any) => {
            const userId = await requireAuth(ctx, args.token);
            const { token, ...rest } = args;
            return config.handler(ctx, { ...rest, userId });
        },
    });
}

/**
 * Helper to create protected mutations
 * Use this to wrap mutations that require authentication
 */
export function authenticatedMutation<Args extends PropertyValidators, Returns>(
    config: {
        args: Args,
        handler: (ctx: MutationCtx, args: ObjectType<Args> & { userId: string }) => Promise<Returns>
    }
) {
    return mutation({
        args: {
            ...config.args,
            token: v.optional(v.string())
        },
        handler: async (ctx, args: any) => {
            const userId = await requireAuth(ctx, args.token);
            const { token, ...rest } = args;
            return config.handler(ctx, { ...rest, userId });
        },
    });
}
