"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button, Chip, Eyebrow, KarigaiLogo, SafetyBanner, Skeleton } from "@/components/ui";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { staggerContainer } from "@/lib/animations";
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
      <motion.div
        initial={{ opacity: 0, x: user ? 20 : -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={cn("max-w-[76%]", user ? "text-right" : "text-left")}
      >
        <div
          className={cn(
            "px-4 py-3 font-body text-sm leading-relaxed shadow-[0_1px_4px_rgba(31,27,22,0.06)]",
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
      </motion.div>
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
    if (!text || isLoading) return;
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
            <motion.div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2" variants={staggerContainer} initial="hidden" animate="visible">
              {quickPrompts.map((prompt) => (
                <motion.button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                  whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(31,27,22,0.08)" }}
                >
                  <Chip tone="neutral">{prompt}</Chip>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-hairline bg-card px-4 py-3">
                  {[0, 0.15, 0.3].map((delay) => (
                    <span key={delay} className="bounce-dot size-1.5 rounded-full bg-muted" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="sticky bottom-0 mt-4 rounded-card border border-hairline bg-card p-3 shadow-[0_10px_40px_rgba(31,27,22,0.08)]">
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
              className="max-h-24 min-h-11 w-full resize-none rounded-xl border border-hairline bg-paper px-4 py-3 font-body text-sm outline-none transition-all duration-200 focus:border-clay focus:shadow-[0_0_0_3px_rgba(184,112,79,0.12)]"
            />
            {input.length > 400 ? (
              <p className="mt-1 text-right font-mono text-[10px] text-muted">{input.length}/500</p>
            ) : null}
          </div>
          <Button variant="accent" disabled={!input.trim() || isLoading} onClick={() => void submit()} className="disabled:opacity-40">
            Send <motion.span whileHover={{ x: 2 }}><Send className="size-4" /></motion.span>
          </Button>
        </div>
      </div>
    </div>
  );
}
