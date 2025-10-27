import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOrCreate = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      return existing;
    }

    // Return a default profile if none exists
    // The mutation can create it when user updates their profile
    return {
      userId: identity.subject,
      fullName: identity.name ?? null,
      title: null,
      church: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
});

export const update = mutation({
  args: {
    fullName: v.optional(v.string()),
    title: v.optional(v.string()),
    church: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const now = new Date().toISOString();
      return await ctx.db.insert("profiles", {
        userId: identity.subject,
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

