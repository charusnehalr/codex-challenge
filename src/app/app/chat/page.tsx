import { ChatWindow } from "@/components/features/chat/ChatWindow";
import { PageHeader } from "@/components/ui";

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-6">
      <PageHeader eyebrow="ai assistant" title="Chat" subtitle="Ask about your wellness" />
      <ChatWindow />
    </div>
  );
}
