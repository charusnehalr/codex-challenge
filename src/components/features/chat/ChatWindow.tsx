"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Chip, Eyebrow, KarigaiLogo, SafetyBanner, Skeleton } from "@/components/ui";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const quickPrompts = [
  "Why do I feel tired today?",
  "What should I eat for dinner?",
  "Should I work out today?",
  "Why am I craving sweets?",
  "How do I adjust my plan for my period?",
];

function timestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const user = message.role === "user";

  return (
    <div className={cn("flex", user ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[76%]", user ? "text-right" : "text-left")}>
        <div
          className={cn(
            "px-4 py-3 font-body text-sm leading-relaxed",
            user
              ? "rounded-2xl rounded-tr-sm bg-clay text-cream"
              : "rounded-2xl rounded-tl-sm border border-hairline bg-card text-ink2",
          )}
        >
          {message.content}
        </div>
        {message.safetyNote ? (
          <div className="mt-2">
            <SafetyBanner tone="info" title="Safety note" body={message.safetyNote} />
          </div>
        ) : null}
        <p className="mt-1 font-mono text-[10px] text-muted">{timestamp(message.createdAt)}</p>
      </div>
    </div>
  );
}

export function ChatWindow() {
  const { messages, isLoading, isHistoryLoading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function submit() {
    const text = input.trim();
    if (!text || isLoading) {
      return;
    }
    setInput("");
    await sendMessage(text);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-hairline bg-paper p-6">
        {isHistoryLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-16 w-3/5 rounded-2xl" />
            <Skeleton className="ml-auto h-14 w-2/5 rounded-2xl" />
            <Skeleton className="h-20 w-2/3 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <KarigaiLogo size={34} tagline />
            <Eyebrow className="mt-8">wellness assistant</Eyebrow>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {quickPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => setInput(prompt)}>
                  <Chip tone="neutral">{prompt}</Chip>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-hairline bg-card px-4 py-3 font-body text-sm text-muted">
                  ···
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="sticky bottom-0 mt-4 rounded-card border border-hairline bg-card p-3">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={input}
              maxLength={500}
              rows={1}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder="Ask about your wellness..."
              className="max-h-24 min-h-11 w-full resize-none rounded-xl border border-hairline bg-paper px-4 py-3 font-body text-sm outline-none focus:border-clay focus:ring-2 focus:ring-clay/30"
            />
            {input.length > 400 ? (
              <p className="mt-1 text-right font-mono text-[10px] text-muted">{input.length}/500</p>
            ) : null}
          </div>
          <Button variant="accent" disabled={!input.trim() || isLoading} onClick={() => void submit()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
