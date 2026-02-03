import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashCode } from "@/lib/crypto";
import { createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(24),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingaben." },
      { status: 400 }
    );
  }

  const code = parsed.data.code.replace(/\D/g, "");
  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Account nicht gefunden." }, { status: 404 });
  }

  const token = await prisma.verificationToken.findFirst({
    where: { userId: user.id, type: "email_verification" },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return NextResponse.json({ error: "Kein Code vorhanden." }, { status: 400 });
  }

  if (token.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code ist abgelaufen." }, { status: 400 });
  }

  if (token.codeHash !== hashCode(code)) {
    return NextResponse.json({ error: "Code ist falsch." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });
  await prisma.verificationToken.deleteMany({
    where: { userId: user.id, type: "email_verification" },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
