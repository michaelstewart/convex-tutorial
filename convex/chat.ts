import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    id: v.string(),
    user: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if message with this id already exists (idempotency check)
    const existing = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (existing) {
      throw new Error(`Message with id ${args.id} already exists`);
    }

    await ctx.db.insert("messages", {
      id: args.id,
      user: args.user,
      body: args.body,
      updatedAt: Date.now(),
    });
  },
});

export const getMessagesAfter = query({
  args: {
    after: v.optional(v.number()),
  },
  handler: async (ctx, { after = 0 }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_updatedAt", (q) => q.gt("updatedAt", after))
      .collect();
    // Return only the fields needed by the client (excludes _id, _creationTime).
    // Type updatedAt as number | null so client can use null for optimistic inserts.
    // The server always sets a real timestamp, but clients insert with null so that
    // new messages sort to the bottom (via orderBy with nulls: 'last') and display
    // as pending until the server confirms. LWW keeps the server version (number > null).
    return messages.map(({ id, user, body, updatedAt }) => ({
      id,
      user,
      body,
      updatedAt: updatedAt as number | null,
    }));
  },
});

// Keep the original query for reference/comparison
export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").order("desc").take(50);
    return messages.reverse();
  },
});
