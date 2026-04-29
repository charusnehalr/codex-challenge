/**
 * Calculates body mass index from weight and height, rounded to one decimal place.
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / heightM ** 2) * 10) / 10;
}

/**
 * Converts a BMI value into Karigai's non-judgmental category labels.
 */
export function categorizeBMI(bmi: number): string {
  if (bmi < 18.5) {
    return "Underweight range";
  }

  if (bmi < 25) {
    return "Healthy range";
  }

  if (bmi < 30) {
    return "Above healthy range";
  }

  return "High range";
}

/**
 * Calculates waist-to-hip ratio, rounded to two decimal places.
 */
export function calculateWHR(waistCm: number, hipCm: number): number {
  return Math.round((waistCm / hipCm) * 100) / 100;
}

/**
 * Calculates body roundness index from waist and height, rounded to two decimal places.
 */
export function calculateBRI(waistCm: number, heightCm: number): number {
  const waistM = waistCm / 100;
  const heightM = heightCm / 100;
  const ratio = waistM / (0.5 * heightM * Math.PI);
  const value = 364.2 - 365.5 * Math.sqrt(Math.max(0, 1 - ratio ** 2));
  return Math.round(value * 100) / 100;
}

/**
 * Calculates BMR using the female Mifflin-St Jeor equation.
 */
export function calculateBMR(params: { weightKg: number; heightCm: number; age: number }): number {
  return Math.round(10 * params.weightKg + 6.25 * params.heightCm - 5 * params.age - 161);
}

/**
 * Calculates total daily energy expenditure from BMR and activity level.
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * (multipliers[activityLevel] ?? 1.375));
}

/**
 * Calculates a calorie target with safety floors and thyroid-aware deficit limits.
 */
export function calculateCalorieTarget(params: {
  tdee: number;
  goal: string;
  hasThyroidCondition: boolean;
}): number {
  const normalizedGoal = params.goal === "maintain_weight" ? "maintain" : params.goal;
  let target = params.tdee;

  if (normalizedGoal === "lose_weight") {
    target = params.tdee - 400;
  } else if (normalizedGoal === "gain_muscle") {
    target = params.tdee + 300;
  }

  if (params.hasThyroidCondition && normalizedGoal === "lose_weight") {
    target = Math.max(target, params.tdee - 300);
  }

  return Math.max(1200, Math.round(target));
}

/**
 * Calculates daily protein target in grams based on weight and goal.
 */
export function calculateProteinTarget(weightKg: number, goal: string): number {
  const normalizedGoal = goal === "maintain_weight" ? "maintain" : goal;
  const multiplier =
    normalizedGoal === "lose_weight"
      ? 1.6
      : normalizedGoal === "gain_muscle" || normalizedGoal === "toning"
        ? 1.8
        : 1.4;

  return Math.round(weightKg * multiplier);
}

/**
 * Calculates daily water target in millilitres, rounded to the nearest 100 ml.
 */
export function calculateWaterTarget(weightKg: number): number {
  return Math.round((weightKg * 33) / 100) * 100;
}

/**
 * Builds shared user targets from the same health engine calculations used across Karigai.
 */
export function buildUserTargets(
  profile: Profile,
  goals: Goals | null,
  healthContext: HealthContext | null,
): {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  waterTargetMl: number;
  activityLevel: string;
  bmr: number;
  tdee: number;
} {
  const weightKg = profile.weight_kg ?? 68;
  const heightCm = profile.height_cm ?? 163;
  const age = profile.age ?? 28;
  const primaryGoal = goals?.primary_goal ?? "maintain";
  const activityLevel = "light";
  const bmr = calculateBMR({ weightKg, heightCm, age });
  const tdee = calculateTDEE(bmr, activityLevel);

  const calorieTarget = calculateCalorieTarget({
      tdee,
      goal: primaryGoal,
      hasThyroidCondition: Boolean(healthContext?.has_thyroid_condition),
    });

  return {
    calorieTarget,
    proteinTarget: calculateProteinTarget(weightKg, primaryGoal),
    carbsTarget: Math.round((calorieTarget * 0.45) / 4),
    fatTarget: Math.round((calorieTarget * 0.28) / 9),
    waterTargetMl: calculateWaterTarget(weightKg),
    activityLevel,
    bmr,
    tdee,
  };
}
import type { Goals, HealthContext, Profile } from "@/types/user";
