import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const chat = await prisma.chat.create({
    data: {
      userId: user.id,
      title: "Neuer Chat",
    },
  });

  return NextResponse.json({ id: chat.id });
}
