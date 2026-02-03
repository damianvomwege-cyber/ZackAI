import SettingsForm from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await requireUser();
  const hasApiKey = Boolean(
    await prisma.apiKey.findFirst({
      where: { userId: user.id, provider: "groq" },
      select: { id: true },
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">API‑Key verwalten</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Hinterlege deinen persönlichen Groq‑Key, um volle Modelle und höhere
          Limits zu nutzen.
        </p>
      </div>
      <div className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
        <SettingsForm hasApiKey={hasApiKey} />
      </div>
    </div>
  );
}
