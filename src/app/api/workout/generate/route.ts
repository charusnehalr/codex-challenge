import { NextResponse } from "next/server";
import { buildWorkoutPrompt } from "@/lib/ai-prompt-engine";
import { runPersonalizationRules } from "@/lib/safety-rules";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";
import { generateWorkoutFromRules, type WorkoutPlan } from "@/lib/workout-engine";
import type { JsonValue } from "@/types/user";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function parsePlan(content: string, fallback: WorkoutPlan): WorkoutPlan {
  try {
    const parsed = JSON.parse(content) as {
      workoutName?: string;
      type?: WorkoutPlan["type"];
      durationMinutes?: number;
      intensity?: WorkoutPlan["intensity"];
      exercises?: WorkoutPlan["exercises"];
      warmup?: string;
      cooldown?: string;
      whyThisWorkout?: string;
      modifications?: string[];
    };
    if (parsed.workoutName && parsed.type && parsed.durationMinutes && parsed.intensity && Array.isArray(parsed.exercises)) {
      return {
        name: parsed.workoutName,
        type: parsed.type,
        duration: parsed.durationMinutes,
        intensity: parsed.intensity,
        exercises: parsed.exercises,
        warmup: parsed.warmup ?? fallback.warmup,
        cooldown: parsed.cooldown ?? fallback.cooldown,
        whyThisWorkout: parsed.whyThisWorkout ?? fallback.whyThisWorkout,
        modifications: parsed.modifications ?? [],
      };
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const ctx = await getUserContext(user.id);
  const rules = runPersonalizationRules({
    healthContext: ctx.healthContext,
    dietPreferences: ctx.dietPreferences,
    fastingPreferences: ctx.fastingPreferences,
    fitnessPreferences: ctx.fitnessPreferences,
    todayEnergyScore: ctx.todayEnergyScore,
  });
  const fallback = generateWorkoutFromRules(ctx, rules);
  let plan = fallback;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 900,
      messages: [{ role: "user", content: buildWorkoutPrompt(ctx, rules) }],
    });
    const block = msg.content?.[0];
    const text = typeof block?.text === "string" ? block.text : "";
    plan = parsePlan(text, fallback);
  } catch {
    plan = fallback;
  }

  const today = todayIsoDate();
  const existing = await supabase
    .from("workout_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const payload = {
    user_id: user.id,
    date: today,
    workout_name: plan.name,
    duration_minutes: plan.duration,
    intensity: plan.intensity,
    completed: false,
    skipped_reason: null,
    feedback: null,
    exercises: plan as unknown as JsonValue,
  };
  const result = existing.data
    ? await supabase.from("workout_logs").update(payload).eq("id", existing.data.id)
    : await supabase.from("workout_logs").insert(payload);

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ plan });
}
