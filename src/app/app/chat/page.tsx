import { ChatWindow } from "@/components/features/chat/ChatWindow";

export default function ChatPage() {
  return (
    <div className="-mx-4 -my-8 flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden md:-mx-8 md:-my-10 md:h-screen">
      <div className="min-h-0 flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}
