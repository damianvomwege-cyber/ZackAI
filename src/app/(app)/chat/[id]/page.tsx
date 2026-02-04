import { notFound } from "next/navigation";
import { unstable_noStore } from "next/cache";
import ChatView from "@/components/ChatView";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  unstable_noStore();
  const user = await requireUser();
  const chat = await prisma.chat.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, type: true, uploadId: true },
      },
    },
  });

  if (!chat) {
    notFound();
  }

  const hasApiKey = Boolean(
    await prisma.apiKey.findFirst({
      where: { userId: user.id, provider: "groq" },
      select: { id: true },
    })
  );

  const sharedKeyAvailable = Boolean(process.env.GROQ_API_KEY);
  const proModelDefault = process.env.PRO_MODEL || config.freeModel;

  const messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    type: "text" | "image";
    uploadId: string | null;
  }> = chat.messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      type: message.type === "image" ? "image" : "text",
      uploadId: message.uploadId,
    }));

  return (
    <ChatView
      key={chat.id}
      chatId={chat.id}
      initialMessages={messages}
      hasApiKey={hasApiKey}
      sharedKeyAvailable={sharedKeyAvailable}
      freeModel={config.freeModel}
      proModelDefault={proModelDefault}
    />
  );
}
