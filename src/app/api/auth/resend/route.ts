import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateNumericCode, hashCode } from "@/lib/crypto";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

const CODE_MINUTES = 15;
const smtpReady =
  Boolean(process.env.BREVO_SMTP_USER) &&
  Boolean(process.env.BREVO_SMTP_PASS) &&
  Boolean(process.env.BREVO_FROM);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) {
    return NextResponse.json({ ok: true });
  }

  if (!smtpReady) {
    return NextResponse.json(
      { error: "SMTP nicht konfiguriert. Bitte Brevo Daten setzen." },
      { status: 500 }
    );
  }

  await prisma.verificationToken.deleteMany({
    where: { userId: user.id, type: "email_verification" },
  });
  const code = generateNumericCode();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      type: "email_verification",
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000),
    },
  });
  try {
    await sendVerificationEmail({ to: email, code, minutes: CODE_MINUTES });
  } catch {
    return NextResponse.json(
      { error: "E-Mail-Versand fehlgeschlagen. Prüfe Brevo SMTP." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
