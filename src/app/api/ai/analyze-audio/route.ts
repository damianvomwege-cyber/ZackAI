import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { decryptSecret } from "@/lib/crypto";
import { groqChat, GroqMessage } from "@/lib/groq";

export const runtime = "nodejs";

const schema = z.object({
  chatId: z.string().min(1),
  uploadId: z.string().min(1),
});

const SYSTEM_PROMPT = `
You analyze audio content for the user.
If the user speaks a specific language, respond in that language.
Provide a structured summary, key points, and actionable insights.
If the audio is unclear, mention uncertainty.
`.trim();

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "UngÃ¼ltige Anfrage." }, { status: 400 });
    }

    const { chatId, uploadId } = parsed.data;
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: user.id },
    });
    if (!chat) {
      return NextResponse.json(
        { error: "Chat nicht gefunden." },
        { status: 404 }
      );
    }

    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: user.id, chatId: chat.id },
    });
    if (!upload || !upload.mimeType.startsWith("audio/")) {
      return NextResponse.json({ error: "Audio nicht gefunden." }, { status: 404 });
    }

    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { userId: user.id, provider: "groq" },
    });

    let apiKey: string | undefined;
    if (apiKeyRecord) {
      try {
        apiKey = decryptSecret(apiKeyRecord.encryptedKey);
      } catch {
        return NextResponse.json(
          { error: "Server-VerschlÃ¼sselung fehlt. APP_ENCRYPTION_KEY setzen." },
          { status: 500 }
        );
      }
    } else {
      apiKey = process.env.GROQ_API_KEY;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Kein Groq API-Key konfiguriert." },
        { status: 400 }
      );
    }

    const groqForm = new FormData();
    groqForm.append(
      "file",
      new Blob([upload.data], { type: upload.mimeType }),
      `audio-${uploadId}`
    );
    groqForm.append("model", config.sttModel);

    const transcriptResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqForm,
      }
    );

    const transcriptData = await transcriptResponse.json().catch(() => ({}));
    if (!transcriptResponse.ok) {
      return NextResponse.json(
        { error: transcriptData?.error?.message || "Transkription fehlgeschlagen." },
        { status: 502 }
      );
    }

    const transcript = transcriptData?.text?.toString().trim();
    if (!transcript) {
      const assistant = await prisma.message.create({
        data: {
          chatId: chat.id,
          role: "assistant",
          type: "text",
          content:
            "Ich habe in der Aufnahme keine Sprache erkannt. Wenn es Musik oder Geräusche sind, sag mir kurz, was ich analysieren soll (z.B. Stimmung, Instrumente, Geräuschquellen).",
        },
      });
      return NextResponse.json({
        assistant: { id: assistant.id, content: assistant.content },
      });
    }

    const messages: GroqMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ];

    const responseText = await groqChat({
      apiKey,
      messages,
      model: config.freeModel,
      maxTokens: config.freeMaxTokens,
      temperature: config.temperature,
    });

    const assistant = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "assistant",
        type: "text",
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
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
