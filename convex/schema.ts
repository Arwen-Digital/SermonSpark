import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  series: defineTable({
    userId: v.string(),
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
    createdAt: v.string(),
    updatedAt: v.string(),
    deletedAt: v.optional(v.string()),
    localId: v.optional(v.string()), // Store local SQLite ID for sync mapping
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_local_id", ["localId"]),

  sermons: defineTable({
    userId: v.string(),
    seriesId: v.optional(v.id("series")),
    title: v.string(),
    content: v.optional(v.string()),
    outline: v.optional(v.any()),
    scripture: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("draft"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("archived")
    ),
    visibility: v.union(
      v.literal("private"),
      v.literal("congregation"),
      v.literal("public")
    ),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    deletedAt: v.optional(v.string()),
    localId: v.optional(v.string()), // Store local SQLite ID for sync mapping
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_series", ["seriesId"])
    .index("by_local_id", ["localId"]),

  profiles: defineTable({
    userId: v.string(),
    fullName: v.optional(v.string()),
    title: v.optional(v.string()),
    church: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"]),

  community_posts: defineTable({
    userId: v.string(),
    content: v.string(),
    likes: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
    deletedAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),

  community_comments: defineTable({
    postId: v.id("community_posts"),
    userId: v.string(),
    content: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    deletedAt: v.optional(v.string()),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),
});


