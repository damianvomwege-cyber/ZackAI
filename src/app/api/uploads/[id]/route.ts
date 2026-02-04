import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const upload = await prisma.upload.findFirst({
    where: { id, userId: user.id },
  });
  if (!upload) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  return new Response(upload.data, {
    headers: {
      "Content-Type": upload.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
