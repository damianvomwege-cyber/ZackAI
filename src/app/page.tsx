import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-[rgba(31,122,118,0.12)] blur-[80px]" />
        <div className="pointer-events-none absolute left-0 top-40 h-72 w-72 rounded-full bg-[rgba(15,95,90,0.12)] blur-[90px]" />
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-10">
          <div className="text-lg font-semibold tracking-tight">ZackAI</div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full border border-[color:var(--border)] px-4 py-2 transition hover:border-[color:var(--accent)]"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-white shadow-md shadow-[color:var(--ring)] transition hover:bg-[color:var(--accent-strong)]"
            >
              Registrieren
            </Link>
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-16">
          <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Private AI Chats
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                ZackAI beantwortet Fragen super detailliert – mit deinem Groq
                API‑Key noch stärker.
              </h1>
              <p className="text-lg text-[color:var(--muted)]">
                Registriere dich, verifiziere deine E‑Mail und starte mehrere
                Chats parallel. Ohne API‑Key bekommst du einen begrenzten
                Modus. Mit deinem eigenen Groq‑Key schaltest du volle Modelle,
                höhere Limits und mehr Kontext frei.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-white shadow-lg shadow-[color:var(--ring)] transition hover:bg-[color:var(--accent-strong)]"
                >
                  Jetzt starten
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-[color:var(--border)] px-6 py-3 transition hover:border-[color:var(--accent)]"
                >
                  Ich habe schon ein Konto
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-[color:var(--border)] bg-white/70 p-6 shadow-[var(--shadow)] backdrop-blur">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
                    Modusvergleich
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Free vs Pro</h2>
                </div>
                <div className="space-y-3 text-sm text-[color:var(--muted)]">
                  <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
                    <div className="text-base font-semibold text-[color:var(--fg)]">
                      Free (ohne Key)
                    </div>
                    <p>Begrenzte Tagesnachrichten, kompakter Kontext.</p>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--accent)] bg-[rgba(31,122,118,0.08)] px-4 py-3">
                    <div className="text-base font-semibold text-[color:var(--fg)]">
                      Pro (mit eigenem Key)
                    </div>
                    <p>Volle Modelle, mehr Tokens, keine Free‑Limits.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--muted)]">
                  <span className="font-semibold text-[color:var(--fg)]">
                    Mehrere Chats
                  </span>{" "}
                  bleiben organisiert, jeder Chat hat seinen eigenen Verlauf.
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "E‑Mail‑Verifikation",
                desc: "Brevo SMTP sendet einen sicheren Code – erst danach kannst du starten.",
              },
              {
                title: "Detailreiche Antworten",
                desc: "ZackAI liefert strukturierte, ausführliche Antworten mit klaren nächsten Schritten.",
              },
              {
                title: "Chat‑Organisation",
                desc: "Neue Chats erscheinen sofort in der Sidebar – du wechselst ohne Kontextverlust.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
