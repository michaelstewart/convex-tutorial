import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createCollection } from "@tanstack/react-db";
import { convexCollectionOptions } from "@michaelstewart/convex-tanstack-db-collection";
import { api } from "../convex/_generated/api";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Create messages collection with convex-db-collection adapter
// Type is inferred from the query's return type
export const messagesCollection = createCollection(
  convexCollectionOptions({
    id: "messages",
    client: convex,
    query: api.chat.getMessagesAfter,
    // No filters = global sync (all messages)
    getKey: (msg) => msg.id,
    updatedAtFieldName: "updatedAt",
    // Set low to demonstrate cursor advancement with resubscription after each message
    // Note this is not the most efficient in terms of convex billed function calls
    resubscribeThreshold: 1,
    onInsert: async ({ transaction }) => {
      const msg = transaction.mutations[0]!.modified;
      await convex.mutation(api.chat.sendMessage, {
        id: msg.id,
        user: msg.user,
        body: msg.body,
      });
    },
  })
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>
);
