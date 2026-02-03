"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name")?.toString() || undefined,
      email: formData.get("email")?.toString() || "",
      password: formData.get("password")?.toString() || "",
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Registrierung fehlgeschlagen.");
      setLoading(false);
      return;
    }

    router.push(`/verify?email=${encodeURIComponent(payload.email)}`);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Name (optional)</label>
        <input
          name="name"
          className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="Damian"
        />
      </div>
      <div>
        <label className="text-sm font-medium">E-Mail</label>
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="du@beispiel.de"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Passwort</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="Mindestens 8 Zeichen"
        />
      </div>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Bitte warten..." : "Registrieren"}
      </button>
    </form>
  );
}
