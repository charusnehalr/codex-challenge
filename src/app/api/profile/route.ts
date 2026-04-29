import { NextResponse } from "next/server";
import { calculateSetupProgress } from "@/lib/setup-progress";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const [
    profileResult,
    bodyMetricsResult,
    healthContextResult,
    cycleProfileResult,
    dietPreferencesResult,
    fastingPreferencesResult,
    fitnessPreferencesResult,
    goalsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("body_metrics").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("health_context").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("cycle_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("diet_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("fasting_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("fitness_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("goals").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const profile = profileResult.data;
  const bodyMetrics = bodyMetricsResult.data;
  const healthContext = healthContextResult.data as Record<string, unknown> | null;
  const cycleProfile = cycleProfileResult.data;
  const dietPreferences = dietPreferencesResult.data;
  const fastingPreferences = fastingPreferencesResult.data as Record<string, unknown> | null;
  const fitnessPreferences = fitnessPreferencesResult.data;
  const goals = goalsResult.data;

  return NextResponse.json({
    user: {
      email: user.email,
    },
    setupProgress: calculateSetupProgress({
      profile,
      bodyMetrics,
      healthContext,
      cycleProfile,
      dietPreferences,
      fastingPreferences,
      fitnessPreferences,
      goals,
    }),
    profile,
    bodyMetrics,
    healthContext,
    cycleProfile,
    dietPreferences,
    fastingPreferences,
    fitnessPreferences,
    goals,
  });
}
