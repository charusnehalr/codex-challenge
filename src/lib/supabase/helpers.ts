import { calculateSetupProgress } from "@/lib/setup-progress";
import { createClient } from "@/lib/supabase/server";
import type {
  BodyMetrics,
  ChatMessage,
  CycleLog,
  CyclePhase,
  CycleProfile,
  DailyLog,
  DietPreferences,
  FastingPreferences,
  FitnessPreferences,
  Goals,
  HealthContext,
  MealLog,
  Profile,
  UserContext,
  WorkoutLog,
} from "@/types/user";

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function asSingle<T>(result: QueryResult<T>) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

function asList<T>(result: QueryResult<T[]>) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data ?? [];
}

function inferCyclePhase(cycleProfile: CycleProfile | null): CyclePhase | undefined {
  if (!cycleProfile?.last_period_start || !cycleProfile.average_cycle_length) {
    return undefined;
  }

  const start = new Date(`${cycleProfile.last_period_start}T00:00:00`);
  const today = new Date(`${todayIsoDate()}T00:00:00`);
  const elapsedDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const cycleDay = (elapsedDays % cycleProfile.average_cycle_length) + 1;
  const periodLength = cycleProfile.average_period_length ?? 5;

  if (cycleDay <= periodLength) {
    return "menstrual";
  }

  if (cycleDay <= Math.max(periodLength + 1, cycleProfile.average_cycle_length - 17)) {
    return "follicular";
  }

  if (cycleDay <= cycleProfile.average_cycle_length - 12) {
    return "ovulatory";
  }

  return "luteal";
}

function cycleConfidence(cycleProfile: CycleProfile | null): "low" | "medium" | "high" | undefined {
  if (!cycleProfile?.last_period_start) {
    return undefined;
  }

  if (cycleProfile.cycle_regular === "regular") {
    return "high";
  }

  if (cycleProfile.cycle_regular === "unsure") {
    return "low";
  }

  return "medium";
}

function toSetupProgressData({
  profile,
  bodyMetrics,
  healthContext,
  cycleProfile,
  dietPreferences,
  fastingPreferences,
  fitnessPreferences,
  goals,
}: {
  profile: Profile | null;
  bodyMetrics: BodyMetrics[];
  healthContext: HealthContext | null;
  cycleProfile: CycleProfile | null;
  dietPreferences: DietPreferences | null;
  fastingPreferences: FastingPreferences | null;
  fitnessPreferences: FitnessPreferences | null;
  goals: Goals | null;
}) {
  const latestBodyMetrics = bodyMetrics[0] ?? null;

  return {
    profile: profile
      ? {
          name: profile.name ?? undefined,
          age: profile.age ?? undefined,
          height_cm: profile.height_cm ?? undefined,
          weight_kg: profile.weight_kg ?? undefined,
        }
      : null,
    bodyMetrics: latestBodyMetrics
      ? {
          waist_cm: latestBodyMetrics.waist_cm ?? undefined,
          hip_cm: latestBodyMetrics.hip_cm ?? undefined,
        }
      : null,
    healthContext: healthContext ? { ...healthContext } : null,
    cycleProfile: cycleProfile
      ? {
          last_period_start: cycleProfile.last_period_start ?? undefined,
        }
      : null,
    dietPreferences: dietPreferences
      ? {
          diet_type: dietPreferences.diet_type ?? undefined,
        }
      : null,
    fastingPreferences: fastingPreferences ? { ...fastingPreferences } : null,
    fitnessPreferences: fitnessPreferences
      ? {
          workout_days_per_week: fitnessPreferences.workout_days_per_week ?? undefined,
        }
      : null,
    goals: goals
      ? {
          primary_goal: goals.primary_goal ?? undefined,
        }
      : null,
  };
}

export async function getUserContext(userId: string): Promise<UserContext> {
  const supabase = await createClient();
  const today = todayIsoDate();

  const [
    profileResult,
    bodyMetricsResult,
    healthContextResult,
    cycleProfileResult,
    cycleLogsResult,
    dietPreferencesResult,
    fastingPreferencesResult,
    fitnessPreferencesResult,
    goalsResult,
    dailyLogsResult,
    mealLogsResult,
    workoutLogsResult,
    chatMessagesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("body_metrics").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("health_context").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("cycle_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("cycle_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("diet_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("fasting_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("fitness_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("goals").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("daily_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("meal_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("workout_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("chat_messages").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  const profile = asSingle<Profile>(profileResult);
  const bodyMetrics = asList<BodyMetrics>(bodyMetricsResult);
  const healthContext = asSingle<HealthContext>(healthContextResult);
  const cycleProfile = asSingle<CycleProfile>(cycleProfileResult);
  const cycleLogs = asList<CycleLog>(cycleLogsResult);
  const dietPreferences = asSingle<DietPreferences>(dietPreferencesResult);
  const fastingPreferences = asSingle<FastingPreferences>(fastingPreferencesResult);
  const fitnessPreferences = asSingle<FitnessPreferences>(fitnessPreferencesResult);
  const goals = asSingle<Goals>(goalsResult);
  const dailyLogs = asList<DailyLog>(dailyLogsResult);
  const mealLogs = asList<MealLog>(mealLogsResult);
  const workoutLogs = asList<WorkoutLog>(workoutLogsResult);
  const chatMessages = asList<ChatMessage>(chatMessagesResult);

  const todayDailyLog = dailyLogs.find((log) => log.date === today);
  const todayCycleLog = cycleLogs.find((log) => log.date === today);
  const todayMeals = mealLogs.filter((meal) => meal.date === today);
  const todayWorkout = workoutLogs.find((workout) => workout.date === today);
  const setupProgress = calculateSetupProgress(toSetupProgressData({
    profile,
    bodyMetrics,
    healthContext,
    cycleProfile,
    dietPreferences,
    fastingPreferences,
    fitnessPreferences,
    goals,
  }));

  return {
    profile,
    bodyMetrics,
    healthContext,
    cycleProfile,
    cycleLogs,
    dietPreferences,
    fastingPreferences,
    fitnessPreferences,
    goals,
    dailyLogs,
    mealLogs,
    workoutLogs,
    chatMessages,
    currentCyclePhase: inferCyclePhase(cycleProfile),
    cycleConfidence: cycleConfidence(cycleProfile),
    todayEnergyScore: todayDailyLog?.energy_score ?? todayCycleLog?.energy_score ?? undefined,
    todaySymptoms: todayCycleLog?.symptoms ?? undefined,
    todayCalories: todayMeals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0),
    todayProtein: todayMeals.reduce((sum, meal) => sum + (meal.protein_g ?? 0), 0),
    todayWater: todayDailyLog?.water_ml ?? undefined,
    workoutCompleted: todayWorkout?.completed,
    setupProgress,
  };
}

export async function getSetupProgress(userId: string): Promise<number> {
  const context = await getUserContext(userId);

  return calculateSetupProgress(toSetupProgressData(context));
}
