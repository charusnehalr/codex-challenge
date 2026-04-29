import type { CyclePhase } from "@/lib/cycle-engine";
import type { PersonalizationRules } from "@/lib/safety-rules";
import type { UserContext } from "@/types/user";

export type WorkoutIntensity = "low" | "moderate" | "high";

export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  notes?: string;
}

export interface WorkoutPlan {
  name: string;
  type: "strength" | "cardio" | "mobility" | "mixed";
  duration: number;
  intensity: WorkoutIntensity;
  exercises: Exercise[];
  warmup: string;
  cooldown: string;
  whyThisWorkout: string;
  modifications?: string[];
}

function normalizePhase(phase?: string): CyclePhase | undefined {
  if (!phase) {
    return undefined;
  }
  const lower = phase.toLowerCase();
  if (lower === "menstrual") return "Menstrual";
  if (lower === "follicular") return "Follicular";
  if (lower === "ovulation" || lower === "ovulatory") return "Ovulation";
  if (lower === "luteal") return "Luteal";
  return "Unknown";
}

/**
 * Determines workout intensity from cycle phase, pain, energy, and thyroid context.
 */
export function getWorkoutIntensity(ctx: {
  cyclePhase?: CyclePhase | string;
  todayEnergyScore?: number;
  todayPainScore?: number;
  hasThyroidCondition?: boolean;
}): WorkoutIntensity {
  const phase = normalizePhase(ctx.cyclePhase);
  if ((ctx.todayPainScore ?? 0) >= 7) return "low";
  if ((ctx.todayEnergyScore ?? 10) <= 3) return "low";
  if (ctx.hasThyroidCondition && (ctx.todayEnergyScore ?? 10) <= 5) return "low";
  if (phase === "Menstrual") return "low";
  if (phase === "Luteal" && (ctx.todayEnergyScore ?? 10) <= 5) return "moderate";
  if (phase === "Ovulation" && (ctx.todayEnergyScore ?? 0) >= 7) return "high";
  return "moderate";
}

function latestPain(ctx: UserContext) {
  return ctx.cycleLogs.find((log) => log.date === new Date().toISOString().slice(0, 10))?.pain_score ?? undefined;
}

function hasHighBmi(ctx: UserContext) {
  if (!ctx.profile?.weight_kg || !ctx.profile.height_cm) {
    return false;
  }
  const heightM = ctx.profile.height_cm / 100;
  return ctx.profile.weight_kg / heightM ** 2 >= 30;
}

/**
 * Generates a deterministic workout plan from Karigai rules without calling AI.
 */
export function generateWorkoutFromRules(ctx: UserContext, rules: PersonalizationRules): WorkoutPlan {
  const intensity = getWorkoutIntensity({
    cyclePhase: ctx.currentCyclePhase,
    todayEnergyScore: ctx.todayEnergyScore,
    todayPainScore: latestPain(ctx),
    hasThyroidCondition: Boolean(ctx.healthContext?.has_thyroid_condition),
  });
  const fitness = ctx.fitnessPreferences;
  const beginner = fitness?.fitness_level === "beginner";
  const homeOnly = Boolean(fitness?.home_workouts_available) && !fitness?.gym_available;
  const menstrualPain = intensity === "low" && normalizePhase(ctx.currentCyclePhase) === "Menstrual";
  const exercises: Exercise[] = [];

  if (menstrualPain) {
    exercises.push(
      { name: "Gentle yoga flow", duration: "10 min", notes: "Keep the pace easy and stop if pain increases." },
      { name: "Easy walk", duration: "15 min", notes: "Stay conversational and comfortable." },
      { name: "Supported stretching", duration: "8 min" },
    );
  } else if (fitness?.swimming_available && intensity === "low") {
    exercises.push(
      { name: "Easy swim", duration: "20 min", notes: "Smooth laps or water walking." },
      { name: "Pool mobility", duration: "8 min" },
    );
  } else if (homeOnly || (hasHighBmi(ctx) && beginner)) {
    exercises.push(
      { name: "Chair squat", sets: 3, reps: "8-10", notes: "No jumping." },
      { name: "Wall push-up", sets: 3, reps: "8-12" },
      { name: "Glute bridge", sets: 3, reps: "10-12" },
      { name: "Walking intervals", duration: "12 min" },
    );
  } else if (rules.suggestStrengthTraining || ctx.healthContext?.has_prediabetes) {
    exercises.push(
      { name: "Goblet squat", sets: 3, reps: "8-10" },
      { name: "Dumbbell row", sets: 3, reps: "10 each side" },
      { name: "Incline push-up", sets: 3, reps: "8-12" },
      { name: "Post-meal walk", duration: "10 min", notes: "Helpful for PCOS or prediabetes context." },
    );
  } else {
    exercises.push(
      { name: "Brisk walk", duration: "20 min" },
      { name: "Bodyweight squat", sets: 3, reps: "10" },
      { name: "Dead bug", sets: 3, reps: "8 each side" },
    );
  }

  const thyroidNote = ctx.healthContext?.has_thyroid_condition ? " Intensity stays moderate with no HIIT." : "";
  const injuryNote = fitness?.injuries ? ` Injury note: ${fitness.injuries}.` : "";

  return {
    name: menstrualPain ? "Gentle cycle support" : "Strength plus steady movement",
    type: menstrualPain ? "mobility" : rules.suggestStrengthTraining ? "mixed" : "strength",
    duration: intensity === "low" ? 30 : 45,
    intensity: ctx.healthContext?.has_thyroid_condition ? "moderate" : intensity,
    exercises,
    warmup: "5 minutes easy walking and joint circles.",
    cooldown: "5 minutes slow breathing, calf stretch, hip flexor stretch, and gentle spinal rotation.",
    whyThisWorkout: `This session reflects your energy, cycle, equipment, and health context.${thyroidNote}${injuryNote}`,
    modifications: [
      rules.avoidHighImpactJumping ? "Avoid jumping and choose step-based options." : "",
      fitness?.injuries ? "Avoid movements that aggravate listed injuries." : "",
    ].filter(Boolean),
  };
}

/**
 * Generates Karigai's always-available low energy backup workout.
 */
export function generateBackupWorkout(ctx: UserContext): WorkoutPlan {
  return {
    name: "Low energy option",
    type: "mobility",
    duration: 25,
    intensity: "low",
    exercises: [
      { name: "Easy walk", duration: "10 min" },
      { name: "Gentle yoga flow", duration: "8 min" },
      { name: "Breathing reset", duration: "3 min" },
      { name: "Light stretching", duration: "4 min", notes: ctx.fitnessPreferences?.injuries ?? undefined },
    ],
    warmup: "2 minutes of slow walking.",
    cooldown: "Gentle neck, shoulder, hip, and calf stretches.",
    whyThisWorkout: "This is a gentler option for low energy days and remains available regardless of the main plan.",
  };
}

/**
 * Preserves the earlier rest-day helper with the new workout plan shape.
 */
export function createRestDayPlan(): WorkoutPlan {
  return generateBackupWorkout({
    profile: null,
    bodyMetrics: [],
    healthContext: null,
    cycleProfile: null,
    cycleLogs: [],
    dietPreferences: null,
    fastingPreferences: null,
    fitnessPreferences: null,
    goals: null,
    dailyLogs: [],
    mealLogs: [],
    workoutLogs: [],
    chatMessages: [],
  });
}
