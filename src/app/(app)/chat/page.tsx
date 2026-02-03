import NewChatButton from "@/components/NewChatButton";

export default function ChatIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deine Chats</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Erstelle einen neuen Chat, um loszulegen.
        </p>
      </div>
      <div className="max-w-xs">
        <NewChatButton />
      </div>
    </div>
  );
}
