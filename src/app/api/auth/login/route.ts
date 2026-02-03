import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { generateNumericCode, hashCode } from "@/lib/crypto";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    return NextResponse.json(
      { error: "Ungültige Eingaben." },
      { status: 400 }
    );
  }

  const password = parsed.data.password;
  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(
      { error: "E-Mail oder Passwort falsch." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "E-Mail oder Passwort falsch." },
      { status: 401 }
    );
  }

  if (!user.emailVerifiedAt) {
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
    return NextResponse.json(
      { error: "E-Mail nicht verifiziert.", needsVerification: true },
      { status: 403 }
    );
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
