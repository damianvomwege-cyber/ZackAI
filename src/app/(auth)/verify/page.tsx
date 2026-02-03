import VerifyForm from "@/components/VerifyForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email || "";
  const hasEmail = Boolean(email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">E-Mail bestätigen</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {hasEmail
            ? `Wir haben einen Code an ${email} gesendet.`
            : "Bitte gib deinen Verifizierungscode ein."}
        </p>
      </div>
      <VerifyForm email={email} />
    </div>
  );
}
