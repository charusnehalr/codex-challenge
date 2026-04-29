"use client";

import { useEffect, useState } from "react";
import { ensureAuthenticated } from "@/lib/auth-guard";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  safetyNote?: string;
  createdAt: string;
};

type ApiChatMessage = {
  id: string;
  role: "user" | "assistant";
  message: string;
  created_at: string;
  context_snapshot?: { safetyNote?: string } | null;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chat")
      .then((response) => (response.ok ? response.json() : { messages: [] }))
      .then((payload: { messages?: ApiChatMessage[] }) => {
        setMessages(
          (payload.messages ?? []).map((message) => ({
            id: message.id,
            role: message.role,
            content: message.message,
            safetyNote: message.context_snapshot?.safetyNote,
            createdAt: message.created_at,
          })),
        );
      })
      .catch(() => setMessages([]))
      .finally(() => setIsHistoryLoading(false));
  }, []);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) {
      return;
    }

    if (!(await ensureAuthenticated("signup"))) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const history = [...messages, userMessage]
      .slice(-10)
      .map((message) => ({ role: message.role, content: message.content }));

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed, history }),
    });
    const payload = (await response.json()) as { answer?: string; safetyNote?: string; error?: string };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: payload.answer ?? payload.error ?? "I couldn't respond just now. Please try again.",
      safetyNote: payload.safetyNote,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, assistantMessage]);
    setIsLoading(false);
  }

  return { messages, isLoading, isHistoryLoading, sendMessage };
}
