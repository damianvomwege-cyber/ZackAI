"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatView({
  chatId,
  initialMessages,
  hasApiKey,
  sharedKeyAvailable,
  freeModel,
  proModelDefault,
}: {
  chatId: string;
  initialMessages: ChatMessage[];
  hasApiKey: boolean;
  sharedKeyAvailable: boolean;
  freeModel: string;
  proModelDefault: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(proModelDefault);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    setError(null);
    const content = input.trim();
    setInput("");
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, role: "user", content }]);
    setLoading(true);

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        message: content,
        model: hasApiKey ? model : undefined,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Antwort fehlgeschlagen.");
      setLoading(false);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: data?.assistant?.id || `assistant-${Date.now()}`,
        role: "assistant",
        content: data?.assistant?.content || "",
      },
    ]);
    setLoading(false);
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--border)] bg-white/70 p-6 shadow-[var(--shadow)]">
        <h1 className="text-2xl font-semibold">ZackAI Chat</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {hasApiKey
            ? "Pro‑Modus aktiv: dein eigener Groq‑Key wird genutzt."
            : sharedKeyAvailable
            ? `Free‑Modus aktiv: begrenzter Kontext, Modell ${freeModel}.`
            : "Kein API‑Key konfiguriert. Ohne Key sind keine Antworten möglich."}
        </p>
        {!hasApiKey && (
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Für volle Power deinen Groq‑Key in{" "}
            <Link
              className="font-semibold text-[color:var(--accent)]"
              href="/settings"
            >
              Einstellungen
            </Link>{" "}
            hinterlegen.
          </p>
        )}
      </div>

      <div className="flex-1 space-y-4 rounded-3xl border border-[color:var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
        {messages.length === 0 && (
          <p className="text-sm text-[color:var(--muted)]">
            Starte mit einer Frage oder Idee. ZackAI antwortet ausführlich und
            strukturiert.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-3xl whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === "user"
                ? "ml-auto bg-[color:var(--accent)] text-white"
                : "bg-[rgba(31,122,118,0.08)] text-[color:var(--fg)]"
            }`}
          >
            {message.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
        {hasApiKey && (
          <div className="mb-4">
            <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Modell
            </label>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              placeholder="z.B. llama-3.1-70b-versatile"
            />
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Schreibe deine Frage…"
            className="flex-1 resize-none rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-2xl bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Denke..." : "Senden"}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
