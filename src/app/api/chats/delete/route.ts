import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const formData = await request.formData();
  const chatId = formData.get("chatId")?.toString();
  if (!chatId) {
    return NextResponse.json({ error: "Chat fehlt." }, { status: 400 });
  }

  await prisma.chat.deleteMany({
    where: { id: chatId, userId: user.id },
  });

  return NextResponse.redirect(new URL("/chat", request.url));
}
