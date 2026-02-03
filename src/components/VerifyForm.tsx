"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyForm({ email }: { email: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const canResend = Boolean(email);
  const [code, setCode] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const cleanCode = code.trim();

    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: cleanCode }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Code ungültig.");
      setLoading(false);
      return;
    }

    router.push("/chat");
  }

  async function resend() {
    setError(null);
    setInfo(null);
    setResending(true);
    await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setInfo("Neuer Code wurde gesendet.");
    setResending(false);
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium">Verifizierungscode</label>
        <input
          name="code"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          value={code}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(next);
          }}
          className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="000000"
        />
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
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Prüfe..." : "Verifizieren"}
        </button>
      </form>
      <button
        type="button"
        disabled={resending || !canResend}
        onClick={resend}
        className="w-full rounded-2xl border border-[color:var(--border)] px-6 py-3 text-sm font-semibold transition hover:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {resending ? "Sende..." : "Code erneut senden"}
      </button>
    </div>
  );
}
