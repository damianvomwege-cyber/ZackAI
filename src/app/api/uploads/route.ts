import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_AUDIO_BYTES = config.audioMaxBytes;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const formData = await request.formData();
  const chatId = formData.get("chatId")?.toString();
  const file = formData.get("file");

  if (!chatId || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Datei fehlt." }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");

  if (!isImage && !isAudio) {
    return NextResponse.json(
      { error: "Nur Bilder oder Audio erlaubt." },
      { status: 400 }
    );
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Bild zu gro? (max 4MB)." },
      { status: 400 }
    );
  }

  if (isAudio && file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      {
        error: `Audio zu gro? (max ${Math.round(
          MAX_AUDIO_BYTES / 1024 / 1024
        )}MB).`,
      },
      { status: 400 }
    );
  }

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: user.id },
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const upload = await prisma.upload.create({
    data: {
      userId: user.id,
      chatId: chat.id,
      mimeType: file.type,
      data,
    },
  });

  const message = await prisma.message.create({
    data: {
      chatId: chat.id,
      role: "user",
      type: isAudio ? "audio" : "image",
      content: "",
      uploadId: upload.id,
    },
  });

  return NextResponse.json({
    message: {
      id: message.id,
      role: message.role,
      type: message.type,
      uploadId: message.uploadId,
      content: message.content,
    },
  });
}
