import type { PersonalizationRules } from "@/lib/safety-rules";
import type { HealthContext, UserContext } from "@/types/user";

export function createWellnessSystemPrompt() {
  return [
    "You are Karigai, a condition-aware wellness companion.",
    "Never diagnose, prescribe, or provide supplement dosages.",
    "Use careful language such as may, might, and based on what you've shared.",
  ].join(" ");
}

function activeHealthContext(ctx: UserContext) {
  const health = ctx.healthContext;
  if (!health) {
    return [];
  }

  return [
    health.has_pcos ? "PCOS" : "",
    health.has_pcod ? "PCOD" : "",
    health.has_prediabetes ? "Prediabetes" : "",
    health.has_diabetes ? "Diabetes" : "",
    health.has_thyroid_condition ? "Thyroid condition" : "",
    health.has_iron_deficiency ? "Iron deficiency" : "",
    health.has_b12_deficiency ? "B12 deficiency" : "",
    health.has_vitamin_d_deficiency ? "Vitamin D deficiency" : "",
    health.has_digestive_issues ? "Digestive issues" : "",
  ].filter(Boolean);
}

/**
 * Converts saved health context boolean flags into a readable comma-separated list.
 */
export function buildHealthContextString(hc: HealthContext | null): string {
  if (!hc) {
    return "none provided";
  }

  return [
    hc.has_pcos ? "PCOS" : "",
    hc.has_pcod ? "PCOD" : "",
    hc.has_prediabetes ? "Prediabetes" : "",
    hc.has_diabetes ? "Diabetes" : "",
    hc.has_thyroid_condition ? "Thyroid condition" : "",
    hc.has_irregular_periods ? "Irregular periods" : "",
    hc.has_hormonal_concerns ? "Hormonal concerns" : "",
    hc.has_iron_deficiency ? "Iron deficiency" : "",
    hc.has_vitamin_d_deficiency ? "Vitamin D deficiency" : "",
    hc.has_b12_deficiency ? "B12 deficiency" : "",
    hc.has_high_cholesterol ? "High cholesterol" : "",
    hc.has_high_blood_pressure ? "High blood pressure" : "",
    hc.has_digestive_issues ? "Digestive issues" : "",
    hc.has_eating_disorder_history ? "Eating disorder history" : "",
    hc.is_pregnant ? "Pregnancy" : "",
    hc.is_breastfeeding ? "Breastfeeding" : "",
  ].filter(Boolean).join(", ") || "none provided";
}

function activeRestrictions(ctx: UserContext) {
  const diet = ctx.dietPreferences;
  if (!diet) {
    return [];
  }

  return [
    diet.is_kosher ? "Kosher" : "",
    diet.is_halal ? "Halal" : "",
    diet.is_jain ? "Jain" : "",
    diet.is_gluten_free ? "Gluten-free" : "",
    diet.is_lactose_free ? "Lactose-free" : "",
    diet.is_dairy_free ? "Dairy-free" : "",
    diet.is_nut_free ? "Nut-free" : "",
    diet.is_soy_free ? "Soy-free" : "",
  ].filter(Boolean);
}

/**
 * Builds the meal suggestion prompt with Karigai safety rules and personalization context.
 */
export function buildMealSuggestionPrompt(
  ctx: UserContext,
  rules: PersonalizationRules,
  mealType: string,
  remainingCalories?: number,
): string {
  const fastingWindow =
    ctx.fastingPreferences?.eating_window_start && ctx.fastingPreferences.eating_window_end
      ? `${ctx.fastingPreferences.eating_window_start}-${ctx.fastingPreferences.eating_window_end}`
      : "none";

  return `You are Karigai, a supportive wellness assistant for women.
CRITICAL: Never diagnose. Never prescribe medication. Never give supplement dosages.
Never claim to treat, cure, or prevent any condition. Use only the context provided.

Personalisation context:
- Meal type: ${mealType}
- Diet type: ${ctx.dietPreferences?.diet_type ?? "not specified"}
- Restrictions: ${activeRestrictions(ctx).join(", ") || "none"}
- Allergies: ${ctx.healthContext?.allergies ?? "none provided"}
- Health context: ${activeHealthContext(ctx).join(", ") || "none provided"}
- Preferred proteins: ${rules.preferredProteins.join(", ") || "not specified"}
- Excluded food groups: ${rules.excludedFoodGroups.join(", ") || "none"}
- Foods to avoid: ${ctx.dietPreferences?.foods_to_avoid ?? "none provided"}
- Cycle phase: ${ctx.currentCyclePhase ?? "unknown"}
- Remaining calories: ${remainingCalories ?? "not provided"}
- Fasting window: ${fastingWindow}

Respond ONLY in valid JSON with this exact structure:
{ mealName, ingredients: string[], estimatedCalories, estimatedMacros:
{ proteinG, carbsG, fatG, fiberG }, reason, safetyNote? }`;
}

/**
 * Builds the workout generation prompt with Karigai safety rules and movement context.
 */
export function buildWorkoutPrompt(ctx: UserContext, rules: PersonalizationRules): string {
  const fitness = ctx.fitnessPreferences;
  const health = ctx.healthContext;
  const todayLog = ctx.cycleLogs.find((log) => log.date === new Date().toISOString().slice(0, 10));
  const equipment = [
    fitness?.gym_available ? "gym" : "",
    fitness?.weights_available ? "weights" : "",
    fitness?.swimming_available ? "swimming pool" : "",
    fitness?.running_available ? "running outdoors" : "",
    fitness?.home_workouts_available ? "home workouts" : "",
    fitness?.walking_preferred ? "walking" : "",
    fitness?.cycling_available ? "cycling" : "",
    fitness?.yoga_pilates_preferred ? "yoga or pilates" : "",
  ].filter(Boolean);
  const healthFlags = [
    health?.has_pcos ? "PCOS" : "",
    health?.has_pcod ? "PCOD" : "",
    health?.has_prediabetes ? "Prediabetes" : "",
    health?.has_thyroid_condition ? "Thyroid condition" : "",
    health?.has_irregular_periods ? "Irregular periods" : "",
  ].filter(Boolean);

  return `You are Karigai, a supportive wellness assistant for women.
CRITICAL: Never diagnose. Never prescribe medication. Never give supplement dosages.
Never claim to treat, cure, or prevent any condition. Use only the context provided.

Workout context:
- Goal: ${ctx.goals?.primary_goal ?? "not specified"}
- Fitness level: ${fitness?.fitness_level ?? "not specified"}
- Available equipment/access: ${equipment.join(", ") || "not specified"}
- Injuries: ${fitness?.injuries ?? "none provided"}
- Exercise dislikes: ${fitness?.exercise_dislikes ?? "none provided"}
- Cycle phase: ${ctx.currentCyclePhase ?? "unknown"}
- Energy score: ${ctx.todayEnergyScore ?? "not logged"}
- Pain score: ${todayLog?.pain_score ?? "not logged"}
- Health context flags: ${healthFlags.join(", ") || "none provided"}
- PCOS/prediabetes strength priority: ${rules.suggestStrengthTraining || rules.suggestWalkingAfterMeals}
- Avoid high-impact jumping: ${rules.avoidHighImpactJumping}
- Avoid extreme intensity: ${rules.avoidExtremeDeficit || rules.suggestModerateIntensity}

Respond ONLY in valid JSON with this exact structure:
{ workoutName, type, durationMinutes, intensity, exercises: [{name, sets, reps, notes}], warmup, cooldown, whyThisWorkout, modifications: string[] }`;
}

/**
 * Builds the Groq/Llama system prompt for Karigai chat with safety rules and full user context.
 */
export function buildChatSystemPrompt(ctx: UserContext, rules: PersonalizationRules): string {
  const fastingWindow =
    ctx.fastingPreferences?.eating_window_start && ctx.fastingPreferences.eating_window_end
      ? `${ctx.fastingPreferences.eating_window_start}-${ctx.fastingPreferences.eating_window_end}`
      : "none";
  const wellnessNotes = [
    rules.showIronFoodReminder ? "User flagged iron deficiency - can mention food sources." : "",
    rules.showB12FoodReminder ? "User flagged B12 deficiency or is vegan - food sources only." : "",
    rules.showVitaminDReminder ? "User flagged vitamin D deficiency - food and sunlight context only." : "",
    rules.prioritizeProtein ? "Protein is a nutrition priority." : "",
    rules.prioritizeFiber ? "Fiber is a nutrition priority." : "",
    rules.suggestWalkingAfterMeals ? "Walking after meals may be suggested gently." : "",
    rules.suggestStrengthTraining ? "Strength training may be suggested when energy and symptoms fit." : "",
    rules.fastingDisabled ? "Fasting is disabled for this user context." : "",
  ].filter(Boolean);

  return `You are Karigai, a warm and knowledgeable wellness assistant for women.
You give personalised, practical wellness guidance based on the user's
specific context - their cycle phase, health conditions, diet, goals,
and daily logs.

ABSOLUTE RULES - NEVER BREAK THESE:
1. Never diagnose any medical condition.
2. Never prescribe medication or specific doses.
3. Never give supplement dosages.
4. Never claim to treat, cure, or prevent conditions.
5. Always recommend a healthcare professional for medical concerns.
6. Never say 'you have [condition]' - say 'you've shared' or 'based on what you've flagged'.
7. Use 'may', 'might', 'often' - never definitive causal claims.
8. Keep responses under 150 words unless the user asks for more detail.
9. Be warm, conversational, and supportive - not clinical or robotic.
10. Reference the user's actual data when relevant - mention their cycle phase, diet type, or symptoms by name.

RESPONSE STYLE:
- Start with the most helpful information immediately - no preamble
- Use short paragraphs, 2-3 sentences max
- End with 1 practical suggestion
- If relevant, mention what data you used, such as 'Based on your menstrual phase and iron deficiency flag...'
- Add a brief safety note only if clinically relevant

USER CONTEXT:
- Name: ${ctx.profile?.name ?? "not provided"}
- Cycle phase + confidence: ${ctx.currentCyclePhase ?? "unknown"} (${ctx.cycleConfidence ?? "unknown"})
- Today energy score: ${ctx.todayEnergyScore ?? "not logged"}
- Today symptoms: ${ctx.todaySymptoms?.join(", ") || "none logged"}
- Diet type: ${ctx.dietPreferences?.diet_type ?? "not provided"}
- Excluded food groups: ${rules.excludedFoodGroups.join(", ") || "none"}
- Health context flags: ${buildHealthContextString(ctx.healthContext)}
- Today's calories/protein/water: ${ctx.todayCalories ?? 0} calories, ${ctx.todayProtein ?? 0}g protein, ${ctx.todayWater ?? 0}ml water
- Workout status: ${ctx.workoutCompleted ? "completed" : "not completed"}
- Fasting window: ${fastingWindow}
- Goal: ${ctx.goals?.primary_goal ?? "not provided"}

WELLNESS NOTES FROM RULES:
${wellnessNotes.length ? wellnessNotes.map((note) => `- ${note}`).join("\n") : "- No special rule notes."}`;
}
