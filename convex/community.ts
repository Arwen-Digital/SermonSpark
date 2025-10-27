import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("community_posts")
      .withIndex("by_created")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc")
      .take(50);

    // Enrich with author profiles
    const enriched = await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", post.userId))
          .first();

        const comments = await ctx.db
          .query("community_comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();

        return {
          ...post,
          author: profile ?? {
            fullName: null,
            title: null,
            church: null,
            avatarUrl: null,
          },
          comments: comments.length,
          likesCount: post.likes?.length ?? 0,
        };
      })
    );

    return enriched;
  },
});

export const getPost = query({
  args: { id: v.id("community_posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post || post.deletedAt) {
      throw new Error("Post not found");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", post.userId))
      .first();

    const comments = await ctx.db
      .query("community_comments")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("asc")
      .collect();

    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const commentProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", comment.userId))
          .first();

        return {
          ...comment,
          author: commentProfile ?? {
            fullName: null,
            title: null,
          },
        };
      })
    );

    return {
      ...post,
      author: profile ?? {
        fullName: null,
        title: null,
        church: null,
        avatarUrl: null,
      },
      comments: enrichedComments,
      likesCount: post.likes?.length ?? 0,
    };
  },
});

export const createPost = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = new Date().toISOString();

    return await ctx.db.insert("community_posts", {
      userId: identity.subject,
      content: args.content,
      likes: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePost = mutation({
  args: {
    id: v.id("community_posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.id);
    if (!post || post.userId !== identity.subject) {
      throw new Error("Post not found or unauthorized");
    }

    return await ctx.db.patch(args.id, {
      content: args.content,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deletePost = mutation({
  args: { id: v.id("community_posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.id);
    if (!post || post.userId !== identity.subject) {
      throw new Error("Post not found or unauthorized");
    }

    return await ctx.db.patch(args.id, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("community_posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = new Date().toISOString();

    return await ctx.db.insert("community_comments", {
      postId: args.postId,
      userId: identity.subject,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const likePost = mutation({
  args: { id: v.id("community_posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    const likes = post.likes ?? [];
    const isLiked = likes.includes(identity.subject);

    if (isLiked) {
      // Unlike
      return await ctx.db.patch(args.id, {
        likes: likes.filter((id) => id !== identity.subject),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Like
      return await ctx.db.patch(args.id, {
        likes: [...likes, identity.subject],
        updatedAt: new Date().toISOString(),
      });
    }
  },
});


