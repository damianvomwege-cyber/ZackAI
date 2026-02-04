import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const formData = await request.formData();
  const chatId = formData.get("chatId")?.toString();
  const file = formData.get("file");

  if (!chatId || !(file instanceof File)) {
    return NextResponse.json({ error: "Datei fehlt." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Nur Bilder erlaubt." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Bild zu groß (max 4MB)." },
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
      type: "image",
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
