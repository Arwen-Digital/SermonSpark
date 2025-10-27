import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const item = await ctx.db
      .query("bible_cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .order("desc")
      .first();
    return item ?? null;
  },
});

export const upsert = mutation({
  args: {
    key: v.string(),
    reference: v.string(),
    translation: v.union(
      v.literal("ESV"),
      v.literal("KJV"),
      v.literal("CSB"),
      v.literal("NLT"),
      v.literal("NIV"),
    ),
    text: v.string(),
  },
  handler: async (ctx, { key, reference, translation, text }) => {
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("bible_cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { text, createdAt: now });
      return existing._id;
    }
    return await ctx.db.insert("bible_cache", {
      key,
      reference,
      translation,
      text,
      createdAt: now,
    });
  },
});


