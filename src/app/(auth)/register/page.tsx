import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Konto erstellen</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Wir schicken dir einen Verifizierungscode per E‑Mail.
        </p>
      </div>
      <RegisterForm />
      <p className="text-sm text-[color:var(--muted)]">
        Schon registriert?{" "}
        <Link className="font-semibold text-[color:var(--accent)]" href="/login">
          Jetzt anmelden
        </Link>
      </p>
    </div>
  );
}
