import { NextResponse } from "next/server";
import { runPersonalizationRules } from "@/lib/safety-rules";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";
import { generateBackupWorkout, generateWorkoutFromRules, type WorkoutPlan } from "@/lib/workout-engine";
import type { JsonValue, WorkoutLog } from "@/types/user";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function workoutFromLog(log: WorkoutLog): WorkoutPlan {
  const plan = log.exercises as JsonValue;
  if (plan && typeof plan === "object" && !Array.isArray(plan) && "name" in plan) {
    return plan as unknown as WorkoutPlan;
  }
  return {
    name: log.workout_name ?? "Today’s workout",
    type: "mixed",
    duration: log.duration_minutes ?? 45,
    intensity: log.intensity === "low" || log.intensity === "high" ? log.intensity : "moderate",
    exercises: [],
    warmup: "5 minutes easy movement.",
    cooldown: "5 minutes stretching.",
    whyThisWorkout: "This workout was saved for today.",
  };
}

function workoutContext(ctx: Awaited<ReturnType<typeof getUserContext>>) {
  const healthFlags = [
    ctx.healthContext?.has_iron_deficiency ? "Iron deficiency" : "",
    ctx.healthContext?.has_irregular_periods ? "Irregular periods" : "",
    ctx.healthContext?.has_pcos ? "PCOS" : "",
    ctx.healthContext?.has_thyroid_condition ? "Thyroid condition" : "",
    ctx.healthContext?.has_prediabetes ? "Prediabetes" : "",
  ].filter(Boolean);

  return {
    phase: ctx.currentCyclePhase ?? undefined,
    energyScore: ctx.todayEnergyScore ?? undefined,
    healthFlags,
  };
}

async function savePlan(userId: string, plan: WorkoutPlan) {
  const supabase = await createClient();
  const today = todayIsoDate();
  const result = await supabase.from("workout_logs").insert({
    user_id: userId,
    date: today,
    workout_name: plan.name,
    duration_minutes: plan.duration,
    intensity: plan.intensity,
    completed: false,
    exercises: plan as unknown as JsonValue,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const today = todayIsoDate();
  const existing = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ctx = await getUserContext(user.id);
  const backupWorkout = generateBackupWorkout(ctx);

  if (existing.data) {
    return NextResponse.json({
      plan: workoutFromLog(existing.data),
      backupWorkout,
      completed: existing.data.completed,
      skippedReason: existing.data.skipped_reason,
      feedback: existing.data.feedback,
      history: ctx.workoutLogs.slice(0, 7),
      context: workoutContext(ctx),
    });
  }

  const rules = runPersonalizationRules({
    healthContext: ctx.healthContext,
    dietPreferences: ctx.dietPreferences,
    fastingPreferences: ctx.fastingPreferences,
    fitnessPreferences: ctx.fitnessPreferences,
    todayEnergyScore: ctx.todayEnergyScore,
  });
  const plan = generateWorkoutFromRules(ctx, rules);
  await savePlan(user.id, plan);

  return NextResponse.json({
    plan,
    backupWorkout,
    completed: false,
    history: ctx.workoutLogs.slice(0, 7),
    context: workoutContext(ctx),
  });
}
