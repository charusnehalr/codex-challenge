import { NextResponse, type NextRequest } from "next/server";
import { buildChatSystemPrompt } from "@/lib/ai-prompt-engine";
import { runPersonalizationRules } from "@/lib/safety-rules";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type ChatPayload = {
  message?: string;
  history?: ChatHistoryItem[];
};

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

async function callGroqAPI(messages: GroqMessage[]) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 600,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as GroqResponse;
  return data.choices?.[0]?.message?.content ?? "No response received.";
}

function safetyNoteFor(answer: string) {
  const lower = answer.toLowerCase();
  const triggers = ["pain", "bleeding", "severe", "mental health", "eating disorder", "medication", "medicine"];
  return triggers.some((trigger) => lower.includes(trigger))
    ? "If this is severe or persistent, please speak with a healthcare professional."
    : undefined;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const result = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: result.data ?? [] });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const result = await supabase.from("chat_messages").delete().eq("user_id", user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ChatPayload;
    const message = payload.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Chat is not configured." }, { status: 500 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const ctx = await getUserContext(user.id);
    const rules = runPersonalizationRules({
      healthContext: ctx.healthContext,
      dietPreferences: ctx.dietPreferences,
      fastingPreferences: ctx.fastingPreferences,
      fitnessPreferences: ctx.fitnessPreferences,
      todayEnergyScore: ctx.todayEnergyScore,
    });
    const systemPrompt = buildChatSystemPrompt(ctx, rules);
    const history = (payload.history ?? []).slice(-10);

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      message,
      context_snapshot: null,
    });

    const answer = await callGroqAPI([
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ]);

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      message: answer,
      context_snapshot: { safetyNote: safetyNoteFor(answer), provider: "groq", model: "llama-3.3-70b-versatile" },
    });

    return NextResponse.json({ answer, safetyNote: safetyNoteFor(answer) });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json({ error: "Chat failed. Please try again." }, { status: 500 });
  }
}
