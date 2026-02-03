"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NewChatButton from "@/components/NewChatButton";

type ChatItem = {
  id: string;
  title: string;
};

export default function Sidebar({
  userName,
  userEmail,
  chats,
  hasApiKey,
}: {
  userName?: string | null;
  userEmail: string;
  chats: ChatItem[];
  hasApiKey: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col gap-6 border-b border-[color:var(--border)] bg-white/70 p-6 backdrop-blur lg:max-w-[280px] lg:border-b-0 lg:border-r lg:h-screen">
      <div className="space-y-1">
        <div className="text-lg font-semibold">ZackAI</div>
        <p className="text-xs text-[color:var(--muted)]">
          {userName || userEmail}
        </p>
      </div>

      <div className="space-y-2">
        <NewChatButton />
        <Link
          href="/settings"
          className={`block rounded-2xl border px-4 py-2 text-sm transition ${
            pathname === "/settings"
              ? "border-[color:var(--accent)] text-[color:var(--accent)]"
              : "border-[color:var(--border)] hover:border-[color:var(--accent)]"
          }`}
        >
          API‑Key {hasApiKey ? "verbunden" : "nicht gesetzt"}
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
          Chats
        </p>
        {chats.length === 0 && (
          <p className="text-sm text-[color:var(--muted)]">
            Erstelle deinen ersten Chat.
          </p>
        )}
        {chats.map((chat) => {
          const active = pathname === `/chat/${chat.id}`;
          return (
            <div
              key={chat.id}
              className={`group flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                active
                  ? "bg-[rgba(31,122,118,0.12)] text-[color:var(--accent-strong)]"
                  : "hover:bg-[rgba(31,122,118,0.08)]"
              }`}
            >
              <Link href={`/chat/${chat.id}`} className="flex-1">
                {chat.title}
              </Link>
              <form action="/api/chats/delete" method="post">
                <input type="hidden" name="chatId" value={chat.id} />
                <button
                  className="opacity-0 transition group-hover:opacity-100 text-[color:var(--muted)] hover:text-red-600"
                  title="Chat löschen"
                >
                  Löschen
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <form action="/api/auth/logout" method="post">
        <button className="w-full rounded-2xl border border-[color:var(--border)] px-4 py-2 text-sm transition hover:border-[color:var(--accent)]">
          Abmelden
        </button>
      </form>
    </aside>
  );
}
