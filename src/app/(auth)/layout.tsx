import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-10 left-10 h-72 w-72 rounded-full bg-[rgba(31,122,118,0.12)] blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[rgba(15,95,90,0.12)] blur-[100px]" />
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
        <Link
          href="/"
          className="mb-8 text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]"
        >
          ZackAI
        </Link>
        <div className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-8 shadow-[var(--shadow)]">
          {children}
        </div>
      </div>
    </div>
  );
}
