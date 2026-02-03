import Sidebar from "@/components/Sidebar";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const chats = await prisma.chat.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });
  const hasApiKey = Boolean(
    await prisma.apiKey.findFirst({
      where: { userId: user.id, provider: "groq" },
      select: { id: true },
    })
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="lg:h-screen lg:w-[280px] lg:flex-shrink-0">
        <Sidebar
          userName={user.name}
          userEmail={user.email}
          chats={chats}
          hasApiKey={hasApiKey}
        />
      </div>
      <div className="flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
