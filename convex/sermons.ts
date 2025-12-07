import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./auth/helpers";

export const list = authenticatedQuery({
  args: {},
  handler: async (ctx, args) => {
    const sermons = await ctx.db
      .query("sermons")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc")
      .collect();

    // Enrich with series titles
    // Note: Promise.all with async map is fine here
    return await Promise.all(
      sermons.map(async (sermon) => {
        if (!sermon.seriesId) {
          return { ...sermon, seriesTitle: null };
        }

        const series = await ctx.db.get(sermon.seriesId);
        return {
          ...sermon,
          seriesTitle: series?.title ?? null,
        };
      })
    );
  },
});

export const get = authenticatedQuery({
  args: { id: v.id("sermons") },
  handler: async (ctx, args) => {
    const sermon = await ctx.db.get(args.id);
    if (!sermon || sermon.userId !== args.userId || sermon.deletedAt) {
      throw new Error("Sermon not found");
    }

    // Enrich with series title
    let seriesTitle = null;
    if (sermon.seriesId) {
      const series = await ctx.db.get(sermon.seriesId);
      seriesTitle = series?.title ?? null;
    }

    return { ...sermon, seriesTitle };
  },
});

export const create = authenticatedMutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    outline: v.optional(v.any()),
    scripture: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("preparing"),
        v.literal("ready"),
        v.literal("delivered"),
        v.literal("archived")
      )
    ),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("congregation"), v.literal("public"))
    ),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    seriesId: v.optional(v.id("series")),
  },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    const now = new Date().toISOString();

    return await ctx.db.insert("sermons", {
      userId,
      ...rest,
      status: rest.status ?? "draft",
      visibility: rest.visibility ?? "private",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authenticatedMutation({
  args: {
    id: v.id("sermons"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    outline: v.optional(v.any()),
    scripture: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("preparing"),
        v.literal("ready"),
        v.literal("delivered"),
        v.literal("archived")
      )
    ),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("congregation"), v.literal("public"))
    ),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    seriesId: v.optional(v.id("series")),
  },
  handler: async (ctx, args) => {
    const { userId, id, ...updates } = args;

    const sermon = await ctx.db.get(id);
    if (!sermon || sermon.userId !== userId) {
      throw new Error("Sermon not found or unauthorized");
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = authenticatedMutation({
  args: { id: v.id("sermons") },
  handler: async (ctx, args) => {
    const { userId, id } = args;

    const sermon = await ctx.db.get(id);
    if (!sermon || sermon.userId !== userId) {
      throw new Error("Sermon not found or unauthorized");
    }

    return await ctx.db.patch(id, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

