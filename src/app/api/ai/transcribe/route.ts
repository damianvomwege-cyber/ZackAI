import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { config } from "@/lib/config";

export const runtime = "nodejs";

const MAX_BYTES = config.sttMaxBytes;

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const language = formData.get("language")?.toString();

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Datei fehlt." }, { status: 400 });
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Nur Audio erlaubt." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Audio zu groß (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
        { status: 400 }
      );
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
          { error: "Server-Verschlüsselung fehlt. APP_ENCRYPTION_KEY setzen." },
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
    groqForm.append("file", file, `speech-${Date.now()}.webm`);
    groqForm.append("model", config.sttModel);
    if (language) {
      groqForm.append("language", language);
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqForm,
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Transkription fehlgeschlagen." },
        { status: 502 }
      );
    }

    const text = data?.text?.toString().trim();
    if (!text) {
      return NextResponse.json({ text: "", noSpeech: true });
    }

    if (apiKeyRecord) {
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return NextResponse.json({ text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
