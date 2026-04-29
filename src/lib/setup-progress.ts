export interface UserSetupData {
  profile?: { name?: string; age?: number; height_cm?: number; weight_kg?: number } | null;
  bodyMetrics?: { waist_cm?: number; hip_cm?: number } | null;
  healthContext?: Record<string, unknown> | null;
  cycleProfile?: { last_period_start?: string } | null;
  dietPreferences?: { diet_type?: string } | null;
  fastingPreferences?: Record<string, unknown> | null;
  fitnessPreferences?: { workout_days_per_week?: number } | null;
  goals?: { primary_goal?: string } | null;
}

export type SetupStep = "profile" | "health" | "cycle" | "goals";

/**
 * Checks whether a positive finite number is present.
 */
function hasNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Checks whether a non-empty string is present.
 */
function hasText(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Checks whether an object-like setup section contains any submitted fields.
 */
function hasRecord(value: Record<string, unknown> | null | undefined) {
  return Boolean(value && Object.keys(value).length > 0);
}

/**
 * Calculates weighted setup completion across all eight guided setup sections.
 */
export function calculateSetupProgress(data: UserSetupData): number {
  console.log("calculateSetupProgress input:", JSON.stringify(data, null, 2));

  const score =
    (hasText(data.profile?.name) &&
    hasNumber(data.profile?.height_cm)
      ? 10
      : 0) +
    (hasNumber(data.bodyMetrics?.waist_cm) ? 10 : 0) +
    (hasRecord(data.healthContext) ? 20 : 0) +
    (hasText(data.cycleProfile?.last_period_start) ? 15 : 0) +
    (hasText(data.dietPreferences?.diet_type) ? 15 : 0) +
    (hasRecord(data.fastingPreferences) ? 10 : 0) +
    (hasNumber(data.fitnessPreferences?.workout_days_per_week) ? 10 : 0) +
    (hasText(data.goals?.primary_goal) ? 10 : 0);

  return Math.max(0, Math.min(100, score));
}

/**
 * Converts completed legacy setup step ids into a simple progress object.
 */
export function getSetupProgress(completedSteps: SetupStep[]) {
  const totalSteps = 4;

  return {
    completedSteps,
    totalSteps,
    percent: Math.round((completedSteps.length / totalSteps) * 100),
  };
}
