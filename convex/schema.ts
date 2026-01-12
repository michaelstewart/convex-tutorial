import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    // Client-generated UUID used as the primary key for TanStack DB collection.
    // This allows optimistic inserts to work correctly - the client can insert
    // a message with a known ID before the server confirms, and the sync will
    // reconcile using this ID. Convex's _id is server-generated and not known
    // until after the mutation completes. (Updates can use _id since it's known.)
    id: v.string(),
    user: v.string(),
    body: v.string(),
    // Server-set timestamp for LWW conflict resolution.
    updatedAt: v.number(),
  }).index("by_updatedAt", ["updatedAt"]),
});
