import { NextResponse } from "next/server";
import { calculateMacroTargets, calculateRemaining, summarizeMealLogs } from "@/lib/nutrition-engine";
import { runPersonalizationRules } from "@/lib/safety-rules";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentWaterMl(ctx: Awaited<ReturnType<typeof getUserContext>>) {
  const today = todayIsoDate();
  return ctx.dailyLogs.find((log) => log.date === today)?.water_ml ?? 0;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const ctx = await getUserContext(user.id);
  const today = todayIsoDate();
  const logs = ctx.mealLogs.filter((log) => log.date === today);
  const targets = calculateMacroTargets(ctx);
  const summary = summarizeMealLogs(logs);
  const remaining = calculateRemaining(targets, summary);
  const rules = runPersonalizationRules({
    healthContext: ctx.healthContext,
    dietPreferences: ctx.dietPreferences,
    fastingPreferences: ctx.fastingPreferences,
    fitnessPreferences: ctx.fitnessPreferences,
    todayEnergyScore: ctx.todayEnergyScore,
  });

  return NextResponse.json({
    logs,
    summary,
    targets,
    remaining,
    waterMl: currentWaterMl(ctx),
    waterTargetMl: rules.waterTargetMl,
    dietPreferences: ctx.dietPreferences,
    healthContext: ctx.healthContext,
    fastingPreferences: ctx.fastingPreferences,
    rules,
  });
}
