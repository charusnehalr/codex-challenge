import { NextResponse } from "next/server";
import {
  calculateCycleStatus,
} from "@/lib/cycle-engine";
import {
  calculateBMI,
  calculateBRI,
  calculateWHR,
  categorizeBMI,
  buildUserTargets,
} from "@/lib/health-engine";
import { calculateSetupProgress } from "@/lib/setup-progress";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";
import type { UserContext } from "@/types/user";

type AnalysisResponse = {
  bmi?: number;
  bmiCategory?: string;
  whr?: number;
  bri?: number;
  bmr?: number;
  tdee?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  waterTargetMl?: number;
  cyclePhase?: string;
  cycleDay?: number;
  cycleConfidence?: "low" | "medium" | "high";
  nextPeriodEstimate?: string;
  cycleStatus?: ReturnType<typeof calculateCycleStatus>;
  cycleUpdatedToday?: boolean;
  goalSummary?: string;
  setupProgress: number;
  missingDataFor: string[];
};

/**
 * Converts nullable database rows into the setup progress input shape.
 */
function setupDataFromContext(context: UserContext) {
  const bodyMetrics = context.bodyMetrics[0] ?? null;

  return {
    profile: context.profile
      ? {
          name: context.profile.name ?? undefined,
          age: context.profile.age ?? undefined,
          height_cm: context.profile.height_cm ?? undefined,
          weight_kg: context.profile.weight_kg ?? undefined,
        }
      : null,
    bodyMetrics: bodyMetrics
      ? {
          waist_cm: bodyMetrics.waist_cm ?? undefined,
          hip_cm: bodyMetrics.hip_cm ?? undefined,
        }
      : null,
    healthContext: context.healthContext ? { ...context.healthContext } : null,
    cycleProfile: context.cycleProfile
      ? { last_period_start: context.cycleProfile.last_period_start ?? undefined }
      : null,
    dietPreferences: context.dietPreferences
      ? { diet_type: context.dietPreferences.diet_type ?? undefined }
      : null,
    fastingPreferences: context.fastingPreferences ? { ...context.fastingPreferences } : null,
    fitnessPreferences: context.fitnessPreferences
      ? { workout_days_per_week: context.fitnessPreferences.workout_days_per_week ?? undefined }
      : null,
    goals: context.goals ? { primary_goal: context.goals.primary_goal ?? undefined } : null,
  };
}

/**
 * Builds a readable goal summary from the saved primary goal.
 */
function goalSummary(goal?: string | null) {
  return goal ? goal.replaceAll("_", " ") : undefined;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const context = await getUserContext(user.id);
  const profile = context.profile;
  const bodyMetrics = context.bodyMetrics[0] ?? null;
  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);
  const todayCycleLog = context.cycleLogs.find((log) => log.date === todayString) ?? null;
  const goal = context.goals?.primary_goal ?? "maintain";
  const missingDataFor: string[] = [];
  const response: AnalysisResponse = {
    setupProgress: calculateSetupProgress(setupDataFromContext(context)),
    missingDataFor,
    goalSummary: goalSummary(context.goals?.primary_goal),
  };

  if (profile?.weight_kg && profile.height_cm) {
    response.bmi = calculateBMI(profile.weight_kg, profile.height_cm);
    response.bmiCategory = categorizeBMI(response.bmi);
    const targets = buildUserTargets(profile, context.goals, context.healthContext);
    response.bmr = targets.bmr;
    response.tdee = targets.tdee;
    response.waterTargetMl = targets.waterTargetMl;
    response.proteinTarget = targets.proteinTarget;
    response.calorieTarget = targets.calorieTarget;
  } else {
    missingDataFor.push("height and weight (BMI, BMR, protein, water)");
  }

  if (bodyMetrics?.waist_cm && bodyMetrics.hip_cm) {
    response.whr = calculateWHR(bodyMetrics.waist_cm, bodyMetrics.hip_cm);
  } else {
    missingDataFor.push("waist and hip measurement (WHR)");
  }

  if (bodyMetrics?.waist_cm && profile?.height_cm) {
    response.bri = calculateBRI(bodyMetrics.waist_cm, profile.height_cm);
  } else {
    missingDataFor.push("waist measurement and height (BRI)");
  }

  if (context.cycleProfile?.last_period_start) {
    const cycleStatus = calculateCycleStatus(context.cycleProfile, todayCycleLog, today);
    response.cycleStatus = cycleStatus;
    response.cycleDay = cycleStatus.cycleDay;
    response.cyclePhase = cycleStatus.cyclePhase;
    response.cycleConfidence = cycleStatus.confidence;
    response.nextPeriodEstimate = cycleStatus.nextPeriodDate?.toISOString().slice(0, 10);
    response.cycleUpdatedToday = Boolean(todayCycleLog);
  } else {
    missingDataFor.push("last period start (cycle estimates)");
  }

  return NextResponse.json(response);
}
