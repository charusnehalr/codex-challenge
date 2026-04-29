import Groq from "groq-sdk";
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

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      max_tokens: 600,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          await supabase.from("chat_messages").insert({
            user_id: user.id,
            role: "assistant",
            message: fullResponse,
            context_snapshot: { safetyNote: safetyNoteFor(fullResponse), provider: "groq", model: "llama-3.3-70b-versatile" },
          });
          controller.close();
        } catch (error) {
          console.error("[Chat API] Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json({ error: "Chat failed. Please try again." }, { status: 500 });
  }
}
