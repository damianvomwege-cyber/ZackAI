"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewChatButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function createChat() {
    setLoading(true);
    const response = await fetch("/api/chats", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (response.ok && data?.id) {
      router.push(`/chat/${data.id}`);
      router.refresh();
      return;
    }
  }

  return (
    <button
      onClick={createChat}
      disabled={loading}
      className="w-full rounded-2xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? "Erstelle..." : "Neuer Chat"}
    </button>
  );
}
