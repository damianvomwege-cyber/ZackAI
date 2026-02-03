import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";

const schema = z.object({
  apiKey: z.string().min(10),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger API‑Key." }, { status: 400 });
  }

  let encrypted: string;
  try {
    encrypted = encryptSecret(parsed.data.apiKey);
  } catch {
    return NextResponse.json(
      { error: "Server-Verschlüsselung fehlt. APP_ENCRYPTION_KEY setzen." },
      { status: 500 }
    );
  }
  const existing = await prisma.apiKey.findFirst({
    where: { userId: user.id, provider: "groq" },
  });

  if (existing) {
    await prisma.apiKey.update({
      where: { id: existing.id },
      data: { encryptedKey: encrypted, lastUsedAt: null },
    });
  } else {
    await prisma.apiKey.create({
      data: {
        userId: user.id,
        provider: "groq",
        encryptedKey: encrypted,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  await prisma.apiKey.deleteMany({
    where: { userId: user.id, provider: "groq" },
  });

  return NextResponse.json({ ok: true });
}
