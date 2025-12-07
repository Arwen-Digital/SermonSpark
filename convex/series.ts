import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./auth/helpers";

export const list = authenticatedQuery({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query("series")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc")
      .collect();
  },
});

export const get = authenticatedQuery({
  args: { id: v.id("series") },
  handler: async (ctx, args) => {
    const series = await ctx.db.get(args.id);
    if (!series || series.userId !== args.userId || series.deletedAt) {
      throw new Error("Series not found");
    }

    return series;
  },
});

export const create = authenticatedMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    const now = new Date().toISOString();

    return await ctx.db.insert("series", {
      userId,
      ...rest,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authenticatedMutation({
  args: {
    id: v.id("series"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { userId, id, ...updates } = args;

    const series = await ctx.db.get(id);
    if (!series || series.userId !== userId) {
      throw new Error("Series not found or unauthorized");
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = authenticatedMutation({
  args: { id: v.id("series") },
  handler: async (ctx, args) => {
    const { userId, id } = args;

    const series = await ctx.db.get(id);
    if (!series || series.userId !== userId) {
      throw new Error("Series not found or unauthorized");
    }

    return await ctx.db.patch(id, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});
