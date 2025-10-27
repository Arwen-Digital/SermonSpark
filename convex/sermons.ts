import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sermons = await ctx.db
      .query("sermons")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc")
      .collect();

    // Enrich with series titles
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

export const get = query({
  args: { id: v.id("sermons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sermon = await ctx.db.get(args.id);
    if (!sermon || sermon.userId !== identity.subject || sermon.deletedAt) {
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

export const create = mutation({
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = new Date().toISOString();

    return await ctx.db.insert("sermons", {
      userId: identity.subject,
      ...args,
      status: args.status ?? "draft",
      visibility: args.visibility ?? "private",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sermon = await ctx.db.get(args.id);
    if (!sermon || sermon.userId !== identity.subject) {
      throw new Error("Sermon not found or unauthorized");
    }

    const { id, ...updates } = args;
    return await ctx.db.patch(args.id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("sermons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sermon = await ctx.db.get(args.id);
    if (!sermon || sermon.userId !== identity.subject) {
      throw new Error("Sermon not found or unauthorized");
    }

    return await ctx.db.patch(args.id, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

