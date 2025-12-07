import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./auth/helpers";

export const getOrCreate = authenticatedQuery({
  args: {},
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing;
    }

    // Return a default profile if none exists
    // The mutation can create it when user updates their profile
    // Note: We don't have user name available in JWT strictly unless we query user,
    // but the wrapper only gives userId. We could query the user table here if needed.
    // For now returning basic profile.

    // We can fetch the user to get the name if needed, or just return null name
    // Cast to any to bypass schema type check for now since we know it's a valid ID from auth
    const user: any = await ctx.db.get(args.userId as any);

    return {
      userId: args.userId,
      fullName: user?.username ?? null, // Use username as fallback or null
      title: null,
      church: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
});

export const update = authenticatedMutation({
  args: {
    fullName: v.optional(v.string()),
    title: v.optional(v.string()),
    church: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const now = new Date().toISOString();
      return await ctx.db.insert("profiles", {
        userId,
        ...updates,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
