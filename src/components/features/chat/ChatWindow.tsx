"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Send, Shield, Sparkles } from "lucide-react";
import { Button, Chip, Eyebrow, KarigaiLogo, Skeleton } from "@/components/ui";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useDashboard } from "@/hooks/useDashboard";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { formatHealthLabel } from "@/lib/format-labels";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast.store";

const quickPrompts = [
  "Why do I feel tired today?",
  "What should I eat for dinner?",
  "Should I work out today?",
  "Why am I craving sweets?",
  "How do I adjust my plan for my period?",
];

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function dateHeader(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dateKey(date) === dateKey(today)) return "Today";
  if (dateKey(date) === dateKey(yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function ChatDateDivider({ date }: { date: Date }) {
  return (
    <div className="flex justify-center">
      <span className="rounded-full bg-shell px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
        {dateHeader(date)}
      </span>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex w-fit gap-1 rounded-2xl rounded-tl-sm border border-hairline bg-card px-4 py-3 shadow-[0_1px_4px_rgba(31,27,22,0.06)]">
        {[0, 0.15, 0.3].map((delay) => (
          <span
            key={delay}
            className="bounce-dot size-1.5 rounded-full bg-muted/50"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const showTyping = message.isStreaming && message.content.length === 0;

  if (showTyping) return <TypingDots />;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <motion.div
        initial={{ opacity: 0, x: isUser ? 20 : -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={cn("max-w-[70%]", !isUser && "max-w-[75%]")}
      >
        <div
          className={cn(
            "whitespace-pre-wrap px-4 py-3 font-body text-sm leading-relaxed shadow-[0_1px_4px_rgba(31,27,22,0.06)]",
            isUser
              ? "rounded-2xl rounded-tr-sm bg-clay text-cream"
              : "rounded-2xl rounded-tl-sm border border-hairline bg-card text-ink2",
          )}
        >
          {message.content}
          {message.isStreaming ? <span className="stream-cursor ml-0.5 text-clay">▍</span> : null}
        </div>

        {!isUser && message.safetyNote ? (
          <div className="mt-1.5 flex max-w-full items-start gap-2 rounded-xl border border-bone bg-bone/60 px-3 py-2">
            <Shield className="mt-0.5 size-3 shrink-0 text-muted" />
            <p className="font-body text-[11px] italic leading-relaxed text-muted">{message.safetyNote}</p>
          </div>
        ) : null}

        <p className={cn("mt-1 font-mono text-[9px] text-muted", isUser ? "text-right" : "ml-1")}>
          {formatTime(message.timestamp)}
        </p>
      </motion.div>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="flex h-full min-h-[340px] flex-col items-center justify-center text-center">
      <KarigaiLogo size={34} mark color="#1F1B16" />
      <p className="mt-2 font-display text-2xl italic text-ink/40">karigai</p>
      <Eyebrow className="mt-5">wellness assistant</Eyebrow>
      <motion.div
        className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {quickPrompts.map((prompt) => (
          <motion.button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            variants={fadeUp}
            whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(31,27,22,0.08)" }}
            whileTap={{ scale: 0.97 }}
            className="rounded-chip border border-hairline bg-card px-4 py-2 font-body text-sm text-ink2 transition-colors duration-150 hover:text-ink"
          >
            {prompt}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

function ContextStrip() {
  const { data } = useDashboard();

  const chips = useMemo(() => {
    const factors = data?.personalizationFactors;
    if (!factors) return [];

    return [
      factors.cyclePhase,
      factors.dietType,
      ...factors.healthContext.slice(0, 3),
      ...factors.symptomsToday.slice(0, 2),
    ]
      .map((item) => (item ? formatHealthLabel(item) : ""))
      .filter(Boolean)
      .slice(0, 5);
  }, [data]);

  if (chips.length === 0) return null;

  return (
    <div
      className="border-t border-hairline bg-shell/40 px-6 py-1.5"
      title="This is the context Karigai uses to personalise responses."
    >
      <div className="flex items-center gap-2 overflow-hidden font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
        <span className="shrink-0">Using</span>
        <div className="flex min-w-0 gap-1.5 overflow-hidden">
          {chips.map((chip) => (
            <Chip key={chip} tone="neutral" className="h-5 shrink-0 px-2 font-mono text-[9px] uppercase tracking-[0.12em]">
              {chip}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

function shouldShowDateHeader(messages: ChatMessage[], index: number) {
  if (index === 0) return true;
  return dateKey(messages[index].timestamp) !== dateKey(messages[index - 1].timestamp);
}

export function ChatWindow() {
  const { messages, isLoading, isHistoryLoading, error, sendMessage, clearConversation } = useChat();
  const addToast = useToastStore((state) => state.addToast);
  const [input, setInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = input.trim().length > 0 && !isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  async function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage(trimmed);
  }

  async function handleClear() {
    try {
      await clearConversation();
      addToast("Conversation cleared", "success");
    } catch {
      addToast("Couldn't clear conversation. Try again.", "error");
    } finally {
      setConfirmOpen(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden bg-paper">
      <div className="flex min-h-[54px] items-start justify-between gap-4 border-b border-hairline bg-paper px-1 pb-3">
        <div>
          <Eyebrow>ai assistant</Eyebrow>
          <div className="mt-1 flex items-end gap-3">
            <h1 className="font-display text-2xl italic leading-none text-ink">Chat</h1>
            <p className="font-body text-xs text-muted">Ask about your wellness</p>
          </div>
        </div>
        <div className="relative flex items-center gap-3">
          <span className="font-mono text-xs text-muted">{messages.length} messages</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen((open) => !open)}
            className="border-hairline bg-card"
          >
            <RefreshCw className="size-3.5" />
            New conversation
          </Button>
          <AnimatePresence>
            {confirmOpen ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-xl border border-hairline bg-card p-4 shadow-[0_12px_36px_rgba(31,27,22,0.14)]"
              >
                <p className="font-body text-sm font-medium text-ink">Start fresh?</p>
                <p className="mt-1 font-body text-xs leading-relaxed text-muted">
                  This will clear your current conversation. Your health data and context stay saved.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="accent" size="sm" onClick={() => void handleClear()}>
                    Clear & start fresh
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
        {isHistoryLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-16 w-3/5 rounded-2xl" />
            <Skeleton className="ml-auto h-14 w-2/5 rounded-2xl" />
            <Skeleton className="h-20 w-2/3 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onPrompt={(prompt) => void submitText(prompt)} />
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="space-y-4">
                {shouldShowDateHeader(messages, index) ? <ChatDateDivider date={message.timestamp} /> : null}
                <MessageBubble message={message} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ContextStrip />

      {error ? (
        <div className="border-t border-hairline bg-alert/10 px-6 py-2 font-body text-xs text-alert">{error}</div>
      ) : null}

      <div className="relative border-t border-hairline bg-card px-6 py-4">
        <div className="flex items-end gap-3">
          <div className="mb-3 flex size-8 shrink-0 items-center justify-center rounded-full bg-shell text-clay">
            <Sparkles className="size-4" />
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            maxLength={500}
            rows={1}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitText(input);
              }
            }}
            placeholder="Ask about your wellness..."
            className="max-h-[120px] min-h-11 flex-1 resize-none rounded-2xl border border-hairline bg-paper px-4 py-3 font-body text-sm text-ink outline-none transition-all duration-200 placeholder:text-muted focus:border-clay focus:shadow-[0_0_0_3px_rgba(184,112,79,0.12)]"
          />
          <motion.button
            type="button"
            whileHover={canSend ? { scale: 1.05, boxShadow: "0 4px 18px rgba(184,112,79,0.38)" } : undefined}
            whileTap={canSend ? { scale: 0.92 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            disabled={!canSend}
            onClick={() => void submitText(input)}
            className={cn(
              "mb-0.5 flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-200",
              canSend
                ? "bg-clay text-cream shadow-[0_2px_12px_rgba(184,112,79,0.3)]"
                : "cursor-not-allowed bg-shell text-muted",
            )}
            aria-label="Send message"
          >
            <Send className="size-[18px]" />
          </motion.button>
        </div>
        {input.length > 400 ? (
          <p className="absolute bottom-2 right-20 font-mono text-[9px] text-muted">{input.length}/500</p>
        ) : null}
      </div>
    </div>
  );
}
