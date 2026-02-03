"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ hasApiKey }: { hasApiKey: boolean }) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveKey() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const response = await fetch("/api/settings/api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Speichern fehlgeschlagen.");
      setLoading(false);
      return;
    }
    setInfo("API‑Key gespeichert.");
    setApiKey("");
    setLoading(false);
    router.refresh();
  }

  async function removeKey() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const response = await fetch("/api/settings/api-key", {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Entfernen fehlgeschlagen.");
      setLoading(false);
      return;
    }
    setInfo("API‑Key entfernt.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Groq API‑Key</label>
        <input
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={hasApiKey ? "Key ersetzen" : "Key einfügen"}
          className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={saveKey}
          disabled={loading || apiKey.trim().length === 0}
          className="rounded-2xl bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Speichere..." : "Key speichern"}
        </button>
        {hasApiKey && (
          <button
            onClick={removeKey}
            disabled={loading}
            className="rounded-2xl border border-[color:var(--border)] px-6 py-3 text-sm font-semibold transition hover:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Key entfernen
          </button>
        )}
      </div>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {info}
        </div>
      )}
    </div>
  );
}
