import { NextResponse } from "next/server";
import { calculateSetupProgress } from "@/lib/setup-progress";
import { formatHealthLabel } from "@/lib/format-labels";
import { calculateCycleStatus } from "@/lib/cycle-engine";
import { buildUserTargets } from "@/lib/health-engine";
import { runPersonalizationRules } from "@/lib/safety-rules";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";
import type { DashboardResponse } from "@/types/dashboard";
import type { HealthContext, UserContext } from "@/types/user";

const healthLabels: Partial<Record<keyof HealthContext, string>> = {
  has_pcos: "PCOS",
  has_pcod: "PCOD",
  has_prediabetes: "Prediabetes",
  has_diabetes: "Diabetes",
  has_thyroid_condition: "Thyroid condition",
  has_irregular_periods: "Irregular periods",
  has_hormonal_concerns: "Hormonal concerns",
  has_iron_deficiency: "Iron deficiency",
  has_vitamin_d_deficiency: "Vitamin D deficiency",
  has_b12_deficiency: "Vitamin B12 deficiency",
  has_high_cholesterol: "High cholesterol",
  has_high_blood_pressure: "High blood pressure",
  has_digestive_issues: "Digestive issues",
  has_eating_disorder_history: "Eating disorder history",
  is_pregnant: "Pregnancy",
  is_breastfeeding: "Breastfeeding",
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function readableGoal(goal?: string | null) {
  const formatted = goal ? formatHealthLabel(goal) : "";
  return formatted || undefined;
}

function getHealthContextLabels(context: HealthContext | null) {
  if (!context) {
    return [];
  }

  return Object.entries(healthLabels)
    .filter(([key]) => Boolean(context[key as keyof HealthContext]))
    .map(([, label]) => label)
    .filter((label): label is string => Boolean(label));
}

function getFitnessOptions(context: UserContext) {
  const fitness = context.fitnessPreferences;
  if (!fitness) {
    return [];
  }

  return [
    fitness.gym_available ? "Gym" : "",
    fitness.weights_available ? "Weights" : "",
    fitness.swimming_available ? "Swimming" : "",
    fitness.running_available ? "Running" : "",
    fitness.home_workouts_available ? "Home workouts" : "",
    fitness.walking_preferred ? "Walking" : "",
    fitness.cycling_available ? "Cycling" : "",
    fitness.yoga_pilates_preferred ? "Yoga or Pilates" : "",
  ].filter(Boolean);
}

function getCycleNote(phase?: string) {
  const notes: Record<string, string> = {
    Menstrual: "Rest and gentle movement may fit this phase.",
    Follicular: "Rising energy may support strength training.",
    Ovulation: "Many women notice higher energy around ovulation.",
    Luteal: "Energy, mood, and cravings may shift in this phase.",
    "Late Luteal": "Your cycle may be running longer than average.",
    menstrual: "Rest and gentle movement may fit this phase.",
    follicular: "Rising energy may support strength training.",
    ovulatory: "Many women notice higher energy around ovulation.",
    luteal: "Energy, mood, and cravings may shift in this phase.",
  };

  return phase ? notes[phase] : undefined;
}

function getSetupProgressFromContext(context: UserContext) {
  const latestBodyMetrics = context.bodyMetrics[0] ?? null;

  return calculateSetupProgress({
    profile: context.profile
      ? {
          name: context.profile.name ?? undefined,
          age: context.profile.age ?? undefined,
          height_cm: context.profile.height_cm ?? undefined,
          weight_kg: context.profile.weight_kg ?? undefined,
        }
      : null,
    bodyMetrics: latestBodyMetrics
      ? {
          waist_cm: latestBodyMetrics.waist_cm ?? undefined,
          hip_cm: latestBodyMetrics.hip_cm ?? undefined,
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
  });
}

function guestDashboardResponse(insight = "Sign in to get your personalised wellness plan."): DashboardResponse {
  return {
    setupProgress: 0,
    personalizationFactors: {
      healthContext: [],
      fitnessOptions: [],
      symptomsToday: [],
    },
    todayPlan: {
      conditionNotes: [],
    },
    logs: {
      caloriesConsumed: 0,
      proteinConsumed: 0,
      waterMl: 0,
      workoutCompleted: false,
    },
    checklist: [],
    insight,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(guestDashboardResponse());
  }

  let context: UserContext;
  try {
    context = await getUserContext(user.id);
  } catch (error) {
    console.error("Dashboard context unavailable:", error);
    return NextResponse.json(
      guestDashboardResponse("Karigai is ready, but the Supabase database tables have not been created yet."),
    );
  }

  const setupProgress = getSetupProgressFromContext(context);
  const today = todayIsoDate();
  const todaysMeals = context.mealLogs.filter((meal) => meal.date === today);
  const latestDailyLog = context.dailyLogs[0] ?? null;
  const todayCycleLog = context.cycleLogs.find((log) => log.date === today) ?? null;
  const cycleStatus = calculateCycleStatus(context.cycleProfile, todayCycleLog, new Date(`${today}T00:00:00`));
  const todayWorkout = context.workoutLogs.find((workout) => workout.date === today) ?? null;
  const planRules = runPersonalizationRules({
    healthContext: context.healthContext,
    dietPreferences: context.dietPreferences,
    fastingPreferences: context.fastingPreferences,
    fitnessPreferences: context.fitnessPreferences,
    cyclePhase: undefined,
    todayEnergyScore: context.todayEnergyScore,
    todayPainScore: todayCycleLog?.pain_score ?? undefined,
  });
  const userTargets = context.profile ? buildUserTargets(context.profile, context.goals, context.healthContext) : null;
  if (
    process.env.NODE_ENV === "development" &&
    userTargets &&
    planRules.calorieTarget &&
    planRules.calorieTarget !== userTargets.calorieTarget
  ) {
    console.warn("[Data consistency] Dashboard target differs from Analysis target", {
      dashboardRulesTarget: planRules.calorieTarget,
      sharedTarget: userTargets.calorieTarget,
    });
  }
  const caloriesConsumed = todaysMeals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0);
  const proteinConsumed = todaysMeals.reduce((sum, meal) => sum + (meal.protein_g ?? 0), 0);
  const waterMl = latestDailyLog?.date === today ? latestDailyLog.water_ml ?? 0 : 0;
  const energyScore =
    latestDailyLog?.date === today ? latestDailyLog.energy_score ?? undefined : todayCycleLog?.energy_score ?? undefined;
  const healthContext = getHealthContextLabels(context.healthContext);
  const dietType = context.dietPreferences?.diet_type ?? undefined;
  const goal = readableGoal(context.goals?.primary_goal);
  const fasting = context.fastingPreferences?.fasting_type ?? undefined;
  const fastingWindow =
    context.fastingPreferences?.eating_window_start && context.fastingPreferences.eating_window_end
      ? `${context.fastingPreferences.eating_window_start.slice(0, 5)}-${context.fastingPreferences.eating_window_end.slice(0, 5)}`
      : undefined;
  const symptomsToday = todayCycleLog?.symptoms ?? [];
  const workoutCompleted = Boolean(todayWorkout?.completed);
  const mealsContain = (mealType: string) => todaysMeals.some((meal) => meal.meal_type === mealType);
  const factors = [
    dietType ? `your ${formatHealthLabel(dietType)} diet` : "",
    healthContext.length ? `${healthContext.slice(0, 2).join(" and ")} context` : "",
    cycleStatus.cyclePhase !== "Unknown" ? `estimated ${cycleStatus.cyclePhase} phase` : "",
  ].filter(Boolean);

  const response: DashboardResponse = {
    profileName: context.profile?.name ?? undefined,
    setupProgress,
    personalizationFactors: {
      cyclePhase: cycleStatus.cyclePhase,
      cycleDay: cycleStatus.cycleDay || undefined,
      cycleLength: cycleStatus.cycleLength,
      cycleConfidence: cycleStatus.confidence,
      goal,
      dietType,
      healthContext,
      fasting,
      fitnessOptions: getFitnessOptions(context),
      symptomsToday,
      fastingWindow,
    },
    todayPlan: {
      calorieTarget: userTargets?.calorieTarget ?? planRules.calorieTarget,
      proteinTarget: userTargets?.proteinTarget ?? planRules.proteinTarget,
      waterTargetMl: userTargets?.waterTargetMl ?? planRules.waterTargetMl,
      workoutName: todayWorkout?.workout_name ?? planRules.workoutName,
      backupWorkout: planRules.backupWorkout,
      mealFocus: planRules.mealFocus,
      cycleNote: getCycleNote(cycleStatus.cyclePhase),
      conditionNotes: healthContext.map((label) => `${label} was considered in today's plan.`),
    },
    logs: {
      caloriesConsumed,
      proteinConsumed,
      waterMl,
      workoutCompleted,
      energyScore,
    },
    checklist: [
      { id: "water", label: "Drink 500ml water", done: waterMl >= 500 },
      { id: "breakfast", label: "Log breakfast", done: mealsContain("breakfast") },
      { id: "lunch", label: "Log lunch", done: mealsContain("lunch") },
      { id: "workout", label: "Complete workout", done: workoutCompleted },
      { id: "energy", label: "Log today's energy", done: Boolean(energyScore) },
    ],
    insight: factors.length
      ? `Today's plan was adjusted for ${factors.join(", ")}.`
      : "Today's plan uses your setup details as you add more personal context.",
  };

  return NextResponse.json(response);
}
