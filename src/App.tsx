import { useEffect, useState } from "react";
import { faker } from "@faker-js/faker";
import { useLiveQuery } from "@tanstack/react-db";
import { messagesCollection } from "./main";

// For demo purposes. In a real app, you'd have real user data.
const NAME = getOrSetFakeName();

export default function App() {
  // Use TanStack DB live query instead of Convex useQuery
  // Sort by updatedAt with nulls last (optimistic inserts have null updatedAt)
  const { data: messages } = useLiveQuery((q) =>
    q.from({ msg: messagesCollection }).orderBy(({ msg }) => msg.updatedAt, { nulls: "last" })
  );

  const [newMessageText, setNewMessageText] = useState("");

  useEffect(() => {
    // Make sure scrollTo works on button click in Chrome
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 0);
  }, [messages]);

  return (
    <main className="chat">
      <header>
        <h1>Convex Chat</h1>
        <p>
          Connected as <strong>{NAME}</strong>
        </p>
      </header>
      {(messages ?? []).map((message) => (
        <article
          key={message.id}
          className={`${message.user === NAME ? "message-mine" : ""} ${message.updatedAt === null ? "message-pending" : ""}`}
        >
          <div>{message.user}</div>

          <p>{message.body}</p>
        </article>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          // Optimistic insert: message appears instantly before server confirms.
          // Set updatedAt to null; server will set the real timestamp.
          // When sync returns server version, LWW keeps it (real timestamp > null).
          messagesCollection.insert({
            id: crypto.randomUUID(),
            user: NAME,
            body: newMessageText,
            updatedAt: null,
          });
          setNewMessageText("");
        }}
      >
        <input
          value={newMessageText}
          onChange={async (e) => {
            const text = e.target.value;
            setNewMessageText(text);
          }}
          placeholder="Write a message…"
          autoFocus
        />
        <button type="submit" disabled={!newMessageText}>
          Send
        </button>
      </form>
    </main>
  );
}

function getOrSetFakeName() {
  const NAME_KEY = "tutorial_name";
  const name = sessionStorage.getItem(NAME_KEY);
  if (!name) {
    const newName = faker.person.firstName();
    sessionStorage.setItem(NAME_KEY, newName);
    return newName;
  }
  return name;
}
