import type { CyclePhase } from "@/lib/cycle-engine";
import type { HealthCheckIn, SafetyBanner } from "@/types/health";

export type HealthContext = {
  has_pcos?: boolean;
  has_pcod?: boolean;
  has_prediabetes?: boolean;
  has_diabetes?: boolean;
  has_thyroid_condition?: boolean;
  has_irregular_periods?: boolean;
  has_hormonal_concerns?: boolean;
  has_iron_deficiency?: boolean;
  has_vitamin_d_deficiency?: boolean;
  has_b12_deficiency?: boolean;
  has_high_cholesterol?: boolean;
  has_high_blood_pressure?: boolean;
  has_digestive_issues?: boolean;
  has_eating_disorder_history?: boolean;
  is_pregnant?: boolean;
  is_breastfeeding?: boolean;
};

export type DietPreferences = {
  diet_type?: string | null;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_pescatarian?: boolean;
  is_gluten_free?: boolean;
  is_lactose_free?: boolean;
  is_dairy_free?: boolean;
};

export type FastingPreferences = {
  interested_in_fasting?: boolean;
  fasting_type?: string | null;
  feels_dizzy_when_fasting?: boolean;
};

export type FitnessPreferences = {
  fitness_level?: string | null;
};

export type PersonalizationRules = {
  prioritizeProtein: boolean;
  prioritizeFiber: boolean;
  avoidRefinedCarbOnlyMeals: boolean;
  suggestStrengthTraining: boolean;
  avoidSugaryDrinks: boolean;
  suggestWalkingAfterMeals: boolean;
  avoidExtremeDeficit: boolean;
  suggestModerateIntensity: boolean;
  showIronFoodReminder: boolean;
  showB12FoodReminder: boolean;
  showVitaminDReminder: boolean;
  cyclePredictionConfidence?: "low" | "medium" | "high";
  prioritizeSymptomTracking: boolean;
  avoidHighImpactJumping: boolean;
  fastingDisabled: boolean;
  fastingCautionNote?: string;
  excludedFoodGroups: string[];
  preferredProteins: string[];
  calorieTarget: number;
  proteinTarget: number;
  waterTargetMl: number;
  workoutName: string;
  backupWorkout: string;
  mealFocus: string;
};

export type SafetyWarning = {
  type: "info" | "warn" | "alert";
  message: string;
};

/**
 * Converts basic check-in data into user-facing safety banners for urgent wellness signals.
 */
export function getSafetyBanners(checkIn: HealthCheckIn): SafetyBanner[] {
  const warnings = runSafetyWarnings({
    painScore: checkIn.painLevel,
    flowLevel: checkIn.hasHeavyBleeding ? "heavy" : undefined,
    symptoms: checkIn.hasDizziness ? ["dizziness"] : [],
    hasEatingDisorderHistory: checkIn.hasEatingDisorderHistory,
    fastingType: checkIn.isFasting ? "active" : "none",
  });

  return warnings.map((warning) => ({
    code: warning.type,
    message: warning.message,
  }));
}

/**
 * Applies Karigai's personalization rules to health, diet, fasting, fitness, and cycle context.
 */
export function runPersonalizationRules(ctx: {
  healthContext: HealthContext | null;
  dietPreferences: DietPreferences | null;
  fastingPreferences: FastingPreferences | null;
  fitnessPreferences: FitnessPreferences | null;
  cyclePhase?: CyclePhase;
  todayEnergyScore?: number;
  todayPainScore?: number;
}): PersonalizationRules {
  const health = ctx.healthContext;
  const diet = ctx.dietPreferences;
  const fasting = ctx.fastingPreferences;
  const fitness = ctx.fitnessPreferences;
  const hasPcosLikeContext = Boolean(health?.has_pcos || health?.has_pcod);
  const isVegan = Boolean(diet?.is_vegan || diet?.diet_type === "vegan");
  const isVegetarian = Boolean(diet?.is_vegetarian || diet?.diet_type === "vegetarian");
  const isPescatarian = Boolean(diet?.is_pescatarian || diet?.diet_type === "pescatarian");
  const excludedFoodGroups = new Set<string>();
  let preferredProteins: string[] = [];

  if (isVegan) {
    ["meat", "dairy", "eggs", "fish"].forEach((group) => excludedFoodGroups.add(group));
    preferredProteins = ["tofu", "tempeh", "lentils", "beans", "edamame"];
  } else if (isVegetarian) {
    ["meat", "fish"].forEach((group) => excludedFoodGroups.add(group));
    preferredProteins = ["lentils", "Greek yogurt", "paneer", "eggs", "beans"];
  } else if (isPescatarian) {
    excludedFoodGroups.add("meat");
    preferredProteins = ["fish", "eggs", "Greek yogurt", "lentils", "beans"];
  }

  if (diet?.is_gluten_free) {
    excludedFoodGroups.add("gluten");
  }

  if (diet?.is_lactose_free || diet?.is_dairy_free) {
    excludedFoodGroups.add("dairy");
  }

  const fastingDisabled = Boolean(
    health?.has_eating_disorder_history ||
      health?.is_pregnant ||
      health?.is_breastfeeding ||
      fasting?.feels_dizzy_when_fasting,
  );

  return {
    prioritizeProtein: hasPcosLikeContext,
    prioritizeFiber: hasPcosLikeContext || Boolean(health?.has_prediabetes),
    avoidRefinedCarbOnlyMeals: hasPcosLikeContext,
    suggestStrengthTraining: hasPcosLikeContext,
    avoidSugaryDrinks: Boolean(health?.has_prediabetes),
    suggestWalkingAfterMeals: Boolean(health?.has_prediabetes),
    avoidExtremeDeficit: Boolean(health?.has_thyroid_condition),
    suggestModerateIntensity: Boolean(health?.has_thyroid_condition),
    showIronFoodReminder: Boolean(health?.has_iron_deficiency),
    showB12FoodReminder: Boolean(health?.has_b12_deficiency || isVegan),
    showVitaminDReminder: Boolean(health?.has_vitamin_d_deficiency),
    cyclePredictionConfidence: health?.has_irregular_periods ? "low" : undefined,
    prioritizeSymptomTracking: Boolean(health?.has_irregular_periods),
    avoidHighImpactJumping: fitness?.fitness_level === "beginner",
    fastingDisabled,
    fastingCautionNote: fasting?.feels_dizzy_when_fasting
      ? "Fasting may not fit if it causes dizziness."
      : fastingDisabled
        ? "Fasting is disabled for your shared context."
        : undefined,
    excludedFoodGroups: Array.from(excludedFoodGroups),
    preferredProteins,
    calorieTarget: 1800,
    proteinTarget: 95,
    waterTargetMl: 2500,
    workoutName: ctx.todayEnergyScore && ctx.todayEnergyScore <= 3
      ? "Gentle mobility and walking"
      : "Cycle-aware strength and mobility",
    backupWorkout: "20-minute walk and stretch",
    mealFocus: "Balanced meals with steady protein and fiber",
  };
}

/**
 * Produces safety warnings for acute symptoms, fasting cautions, and very low intake patterns.
 */
export function runSafetyWarnings(ctx: {
  painScore?: number;
  flowLevel?: string;
  symptoms?: string[];
  hasEatingDisorderHistory?: boolean;
  fastingType?: string;
  caloricIntake?: number;
  goal?: string;
}): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  const symptoms = ctx.symptoms?.map((symptom) => symptom.toLowerCase()) ?? [];

  if ((ctx.painScore ?? 0) >= 8) {
    warnings.push({
      type: "alert",
      message: "Severe pain. Consider speaking with a clinician if recurring.",
    });
  }

  if (ctx.flowLevel === "heavy" && symptoms.includes("dizziness")) {
    warnings.push({
      type: "alert",
      message: "Heavy bleeding with dizziness needs attention.",
    });
  }

  if (ctx.hasEatingDisorderHistory && ctx.fastingType && ctx.fastingType !== "none") {
    warnings.push({
      type: "warn",
      message: "Fasting not recommended.",
    });
  }

  if ((ctx.caloricIntake ?? Number.POSITIVE_INFINITY) < 1000 && ctx.goal === "lose_weight") {
    warnings.push({
      type: "warn",
      message: "Very low intake. Please ensure you're eating enough.",
    });
  }

  return warnings;
}
