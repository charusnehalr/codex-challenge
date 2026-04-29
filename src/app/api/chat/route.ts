import Anthropic from "@anthropic-ai/sdk";
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

async function saveMessage(userId: string, role: "user" | "assistant", message: string, contextSnapshot?: object) {
  const supabase = await createClient();
  await supabase.from("chat_messages").insert({
    user_id: userId,
    role,
    message,
    context_snapshot: contextSnapshot ?? null,
  });
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
    .order("created_at", { ascending: false })
    .limit(30);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: (result.data ?? []).reverse() });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as ChatPayload;
  const message = payload.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
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
  const system = buildChatSystemPrompt(ctx, rules);
  const history = (payload.history ?? []).slice(-10);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let answer = "";

  await saveMessage(user.id, "user", message, {
    cyclePhase: ctx.currentCyclePhase,
    energyScore: ctx.todayEnergyScore,
    waterMl: ctx.todayWater,
  });

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system,
      messages: [...history, { role: "user", content: message }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        answer += event.delta.text;
      }
    }
  } catch {
    answer =
      "Based on what you've shared, fatigue may relate to several factors such as cycle phase, hydration, sleep, or nutrition. Consider checking water intake, a balanced meal with protein and fiber, and gentle movement if it feels supportive. If fatigue is severe, new, or persistent, please speak with a healthcare professional.";
  }

  const safetyNote = safetyNoteFor(answer);
  await saveMessage(user.id, "assistant", answer, { safetyNote });

  return NextResponse.json({ answer, safetyNote });
}
