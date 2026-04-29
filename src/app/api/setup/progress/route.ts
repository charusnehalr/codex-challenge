import { NextResponse } from "next/server";
import { calculateSetupProgress, type UserSetupData } from "@/lib/setup-progress";
import { createClient } from "@/lib/supabase/server";
import type { SetupSectionKey } from "@/components/features/setup/setup-shared";

const emptyProgress = {
  setupProgress: 0,
  completedSections: [] as SetupSectionKey[],
};

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasRecord(value: Record<string, unknown> | null | undefined) {
  return Boolean(value && Object.keys(value).length > 0);
}

function completedSectionsFromData(data: UserSetupData): SetupSectionKey[] {
  const completed: SetupSectionKey[] = [];

  if (
    hasText(data.profile?.name) &&
    hasNumber(data.profile?.height_cm)
  ) {
    completed.push("basic_profile");
  }

  if (hasNumber(data.bodyMetrics?.waist_cm)) {
    completed.push("body_metrics");
  }

  if (hasRecord(data.healthContext)) {
    completed.push("health_context");
  }

  if (hasText(data.cycleProfile?.last_period_start)) {
    completed.push("cycle_profile");
  }

  if (hasText(data.dietPreferences?.diet_type)) {
    completed.push("diet_preferences");
  }

  if (hasRecord(data.fastingPreferences)) {
    completed.push("fasting_preferences");
  }

  if (hasNumber(data.fitnessPreferences?.workout_days_per_week)) {
    completed.push("fitness_preferences");
  }

  if (hasText(data.goals?.primary_goal)) {
    completed.push("goals");
  }

  return completed;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(emptyProgress);
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
    supabase.from("profiles").select("name,age,height_cm,weight_kg").eq("user_id", userId).maybeSingle(),
    supabase.from("body_metrics").select("waist_cm,hip_cm").eq("user_id", userId).order("date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("health_context").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("cycle_profile").select("last_period_start").eq("user_id", userId).maybeSingle(),
    supabase.from("diet_preferences").select("diet_type").eq("user_id", userId).maybeSingle(),
    supabase.from("fasting_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("fitness_preferences").select("workout_days_per_week").eq("user_id", userId).maybeSingle(),
    supabase.from("goals").select("primary_goal").eq("user_id", userId).maybeSingle(),
  ]);

  const setupData = {
    profile: profileResult.data,
    bodyMetrics: bodyMetricsResult.data,
    healthContext: healthContextResult.data as Record<string, unknown> | null,
    cycleProfile: cycleProfileResult.data,
    dietPreferences: dietPreferencesResult.data,
    fastingPreferences: fastingPreferencesResult.data as Record<string, unknown> | null,
    fitnessPreferences: fitnessPreferencesResult.data,
    goals: goalsResult.data,
  } satisfies UserSetupData;

  return NextResponse.json({
    setupProgress: calculateSetupProgress(setupData),
    completedSections: completedSectionsFromData(setupData),
  });
}
