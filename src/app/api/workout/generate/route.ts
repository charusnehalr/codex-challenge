import { NextResponse, type NextRequest } from "next/server";
import { buildWorkoutGenerationPrompt } from "@/lib/ai-prompt-engine";
import { runPersonalizationRules } from "@/lib/safety-rules";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";
import { generateWorkoutFromRules, type WorkoutPlan } from "@/lib/workout-engine";
import type { JsonValue } from "@/types/user";

type GenerateOptions = {
  focusArea?: string;
  durationMinutes?: number;
  energyLevel?: string;
  extraNotes?: string;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeType(value: unknown): WorkoutPlan["type"] {
  if (value === "strength" || value === "cardio" || value === "mobility" || value === "mixed" || value === "yoga" || value === "hiit") {
    return value;
  }
  return "mixed";
}

function normalizeIntensity(value: unknown): WorkoutPlan["intensity"] {
  if (value === "low" || value === "moderate" || value === "high") return value;
  return "moderate";
}

function parsePlan(content: string, fallback: WorkoutPlan): WorkoutPlan {
  const clean = content.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean) as {
      workoutName?: string;
      type?: string;
      durationMinutes?: number;
      intensity?: string;
      exercises?: Array<{
        name?: string;
        type?: string;
        duration?: string;
        sets?: number;
        reps?: string;
        notes?: string;
      }>;
      warmup?: string;
      cooldown?: string;
      whyThisWorkout?: string;
      modifications?: string[];
    };

    if (!parsed.workoutName || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
      return fallback;
    }

    return {
      name: parsed.workoutName,
      type: normalizeType(parsed.type),
      duration: parsed.durationMinutes ?? fallback.duration,
      intensity: normalizeIntensity(parsed.intensity),
      exercises: parsed.exercises
        .filter((exercise) => exercise.name)
        .map((exercise) => ({
          name: exercise.name ?? "Exercise",
          duration: exercise.duration,
          sets: exercise.sets,
          reps: exercise.reps,
          notes: exercise.notes,
        })),
      warmup: parsed.warmup ?? fallback.warmup,
      cooldown: parsed.cooldown ?? fallback.cooldown,
      whyThisWorkout: parsed.whyThisWorkout ?? fallback.whyThisWorkout,
      modifications: parsed.modifications ?? [],
    };
  } catch (error) {
    console.error("[Workout Generate] Could not parse Groq JSON:", error);
    return fallback;
  }
}

async function callGroqForWorkout(prompt: string, fallback: WorkoutPlan): Promise<WorkoutPlan> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Groq API error: ${response.status} ${message}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content ?? "";
  return parsePlan(text, fallback);
}

export async function POST(request: NextRequest) {
  const options = (await request.json().catch(() => ({}))) as GenerateOptions;
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
  const fallback = generateWorkoutFromRules(ctx, rules);

  let plan: WorkoutPlan;
  try {
    plan = await callGroqForWorkout(buildWorkoutGenerationPrompt(ctx, options), fallback);
  } catch (error) {
    console.error("[Workout Generate] Falling back to rules plan:", error);
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
    exercises: { ...plan, aiGenerated: true } as unknown as JsonValue,
  };

  const result = existing.data
    ? await supabase.from("workout_logs").update(payload).eq("id", existing.data.id)
    : await supabase.from("workout_logs").insert(payload);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ plan, aiGenerated: true });
}
