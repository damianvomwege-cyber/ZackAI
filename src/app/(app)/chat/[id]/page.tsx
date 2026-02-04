import { notFound } from "next/navigation";
import ChatView from "@/components/ChatView";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

export default async function ChatPage({
  params,
}: {
  params: { id: string };
}) {
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

  const messages = chat.messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      ...message,
      role: message.role as "user" | "assistant",
      type: message.type || "text",
    }));

  return (
    <ChatView
      chatId={chat.id}
      initialMessages={messages}
      hasApiKey={hasApiKey}
      sharedKeyAvailable={sharedKeyAvailable}
      freeModel={config.freeModel}
      proModelDefault={proModelDefault}
    />
  );
}
