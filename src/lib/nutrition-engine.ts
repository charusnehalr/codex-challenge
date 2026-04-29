import { calculateBMR, calculateCalorieTarget, calculateProteinTarget } from "@/lib/health-engine";
import type { MealLog, UserContext } from "@/types/user";

export type MacroTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type NutritionSummary = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  mealTypeCounts: Record<string, number>;
};

/**
 * Calculates macro targets from profile, goal, thyroid context, and activity context.
 */
export function calculateMacroTargets(ctx: UserContext): MacroTargets {
  const weightKg = ctx.profile?.weight_kg ?? 68;
  const heightCm = ctx.profile?.height_cm ?? 163;
  const age = ctx.profile?.age ?? 28;
  const bmr = calculateBMR({ weightKg, heightCm, age });
  const activityMultiplier = (ctx.fitnessPreferences?.workout_days_per_week ?? 0) >= 4 ? 1.55 : 1.375;
  const tdee = Math.round(bmr * activityMultiplier);
  const goal = ctx.goals?.primary_goal ?? "maintain";
  const calories = calculateCalorieTarget({
    tdee,
    goal,
    hasThyroidCondition: Boolean(ctx.healthContext?.has_thyroid_condition),
  });
  const proteinG = calculateProteinTarget(weightKg, goal);
  const fatG = Math.round((calories * 0.28) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const fiberG = calories >= 1800 ? 35 : 25;

  return { calories, proteinG, carbsG, fatG, fiberG };
}

/**
 * Summarizes logged meals into total macros and counts by meal type.
 */
export function summarizeMealLogs(logs: MealLog[]): NutritionSummary {
  return logs.reduce<NutritionSummary>(
    (summary, log) => {
      const mealType = log.meal_type ?? "meal";

      return {
        calories: summary.calories + (log.calories ?? 0),
        proteinG: summary.proteinG + (log.protein_g ?? 0),
        carbsG: summary.carbsG + (log.carbs_g ?? 0),
        fatG: summary.fatG + (log.fat_g ?? 0),
        fiberG: summary.fiberG + (log.fiber_g ?? 0),
        mealTypeCounts: {
          ...summary.mealTypeCounts,
          [mealType]: (summary.mealTypeCounts[mealType] ?? 0) + 1,
        },
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, mealTypeCounts: {} },
  );
}

/**
 * Calculates remaining macro targets after subtracting consumed nutrition totals.
 */
export function calculateRemaining(targets: MacroTargets, consumed: NutritionSummary): MacroTargets {
  return {
    calories: Math.max(0, targets.calories - consumed.calories),
    proteinG: Math.max(0, targets.proteinG - consumed.proteinG),
    carbsG: Math.max(0, targets.carbsG - consumed.carbsG),
    fatG: Math.max(0, targets.fatG - consumed.fatG),
    fiberG: Math.max(0, targets.fiberG - consumed.fiberG),
  };
}

/**
 * Preserves the earlier helper shape for grouping meals by meal type.
 */
export function groupMealsForToday(meals: MealLog[]) {
  return meals.reduce<Record<string, MealLog[]>>((groups, meal) => {
    const key = meal.meal_type ?? "meal";
    return { ...groups, [key]: [...(groups[key] ?? []), meal] };
  }, {});
}
