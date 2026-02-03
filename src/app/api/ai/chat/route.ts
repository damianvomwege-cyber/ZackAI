import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { decryptSecret } from "@/lib/crypto";
import { groqChat, GroqMessage } from "@/lib/groq";

const schema = z.object({
  chatId: z.string().min(1),
  message: z.string().min(1).max(8000),
  model: z.string().min(1).max(80).optional(),
});

const SYSTEM_PROMPT = `
Du bist ZackAI. Antworte standardmäßig auf Deutsch.
Gib extrem detaillierte, strukturierte Antworten. Nutze klare Abschnitte,
Checklisten, Beispiele und nächste Schritte. Wenn Informationen fehlen,
stelle gezielte Rückfragen. Nenne Annahmen explizit.
`.trim();

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Nachricht." },
      { status: 400 }
    );
  }

  const { chatId, message, model } = parsed.data;
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: user.id },
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  }

  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: { userId: user.id, provider: "groq" },
  });
  const hasUserKey = Boolean(apiKeyRecord);
  let apiKey: string | undefined;
  if (hasUserKey) {
    try {
      apiKey = decryptSecret(apiKeyRecord!.encryptedKey);
    } catch {
      return NextResponse.json(
        { error: "Server-Verschlüsselung fehlt. APP_ENCRYPTION_KEY setzen." },
        { status: 500 }
      );
    }
  } else {
    apiKey = process.env.GROQ_API_KEY;
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Kein Groq API‑Key konfiguriert." },
      { status: 400 }
    );
  }

  if (!hasUserKey) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.message.count({
      where: {
        role: "user",
        createdAt: { gte: since },
        chat: { userId: user.id },
      },
    });
    if (count >= config.freeDailyLimit) {
      return NextResponse.json(
        { error: "Free‑Limit erreicht. Bitte API‑Key hinterlegen." },
        { status: 429 }
      );
    }
  }

  const userMessage = await prisma.message.create({
    data: {
      chatId: chat.id,
      role: "user",
      content: message,
    },
  });

  if (chat.title === "Neuer Chat") {
    const nextTitle = message.slice(0, 48).trim() || "Chat";
    await prisma.chat.update({
      where: { id: chat.id },
      data: { title: nextTitle },
    });
  }

  const historyLimit = hasUserKey ? 20 : 8;
  const history = await prisma.message.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "desc" },
    take: historyLimit,
  });
  history.reverse();

  const messages: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((item) => ({
      role: item.role as GroqMessage["role"],
      content: item.content,
    })),
  ];

  const selectedModel = hasUserKey
    ? model?.trim() || process.env.PRO_MODEL || config.freeModel
    : config.freeModel;
  const maxTokens = hasUserKey ? config.proMaxTokens : config.freeMaxTokens;

  const responseText = await groqChat({
    apiKey,
    messages,
    model: selectedModel,
    maxTokens,
    temperature: config.temperature,
  });

  const assistant = await prisma.message.create({
    data: {
      chatId: chat.id,
      role: "assistant",
      content: responseText,
    },
  });

  if (apiKeyRecord) {
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });
  }

  return NextResponse.json({
    assistant: {
      id: assistant.id,
      content: assistant.content,
    },
    mode: hasUserKey ? "pro" : "free",
    userMessageId: userMessage.id,
  });
}
