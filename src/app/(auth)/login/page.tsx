import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Willkommen zurück</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Melde dich an, um deine Chats fortzusetzen.
        </p>
      </div>
      <LoginForm />
      <p className="text-sm text-[color:var(--muted)]">
        Noch kein Konto?{" "}
        <Link className="font-semibold text-[color:var(--accent)]" href="/register">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
