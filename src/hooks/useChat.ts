"use client";

import { useEffect, useState } from "react";
import { ensureAuthenticated } from "@/lib/auth-guard";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  safetyNote?: string;
  isStreaming?: boolean;
};

type ApiChatMessage = {
  id: string;
  role: "user" | "assistant";
  message: string;
  created_at: string;
  context_snapshot?: { safetyNote?: string } | null;
};

type ChatApiResponse = {
  answer?: string;
  safetyNote?: string;
  error?: string;
};

function safetyNoteFor(answer: string) {
  const lower = answer.toLowerCase();
  const triggers = ["pain", "bleeding", "severe", "mental health", "eating disorder", "medication", "medicine"];
  return triggers.some((trigger) => lower.includes(trigger))
    ? "If this is severe or persistent, please speak with a healthcare professional."
    : undefined;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    setIsHistoryLoading(true);
    try {
      const response = await fetch("/api/chat/history", { credentials: "include" });
      const payload = (await response.json()) as { messages?: ApiChatMessage[] };
      setMessages(
        (payload.messages ?? []).map((message) => ({
          id: message.id,
          role: message.role,
          content: message.message,
          safetyNote: message.context_snapshot?.safetyNote,
          timestamp: new Date(message.created_at),
        })),
      );
    } catch {
      setMessages([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }

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
      timestamp: new Date(),
    };
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };
    const history = messages.slice(-10).map((message) => ({ role: message.role, content: message.content }));

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed, history }),
      });

      const payload = (await response.json().catch(() => ({}))) as ChatApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Chat request failed");
      }

      const answer = payload.answer ?? "No response received.";
      setMessages((current) =>
        current.map((messageItem) =>
          messageItem.id === assistantMessageId
            ? {
                ...messageItem,
                content: answer,
                safetyNote: payload.safetyNote ?? safetyNoteFor(answer),
                isStreaming: false,
              }
            : messageItem,
        ),
      );
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Something went wrong. Please try again.");
      setMessages((current) => current.filter((messageItem) => messageItem.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  }

  async function clearConversation() {
    if (!(await ensureAuthenticated("login"))) {
      return;
    }
    await fetch("/api/chat", { method: "DELETE", credentials: "include" });
    setMessages([]);
    setError(null);
  }

  return { messages, isLoading, isHistoryLoading, error, sendMessage, clearConversation };
}
