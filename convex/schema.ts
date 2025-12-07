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

  // Custom auth - users table
  users: defineTable({
    email: v.string(),
    username: v.optional(v.string()),
    passwordHash: v.string(),
    authProvider: v.union(
      v.literal("email"),
      v.literal("google"),
      v.literal("apple")
    ),
    authProviderId: v.optional(v.string()), // For OAuth providers
    isEmailVerified: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_provider", ["authProvider", "authProviderId"]),

  // Custom auth - sessions table for refresh tokens
  sessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(), // Hash of refresh token for validation
    expiresAt: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_token_hash", ["tokenHash"])
    .index("by_expires", ["expiresAt"]),

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

  // Cache for Eden AI Bible responses per reference+translation
  bible_cache: defineTable({
    key: v.string(), // `${reference.toLowerCase()}|${translation}`
    reference: v.string(),
    translation: v.union(
      v.literal("ESV"),
      v.literal("KJV"),
      v.literal("CSB"),
      v.literal("NLT"),
      v.literal("NIV"),
    ),
    text: v.string(),
    createdAt: v.string(),
  })
    .index("by_key", ["key"])
    .index("by_created", ["createdAt"]),
});


