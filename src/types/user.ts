export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal" | "unknown";

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  unit_system: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface BodyMetrics {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  body_fat_percent: number | null;
  created_at: string;
}

export interface HealthContext {
  id: string;
  user_id: string;
  has_pcos: boolean;
  has_pcod: boolean;
  has_prediabetes: boolean;
  has_diabetes: boolean;
  has_thyroid_condition: boolean;
  has_irregular_periods: boolean;
  has_hormonal_concerns: boolean;
  has_iron_deficiency: boolean;
  has_vitamin_d_deficiency: boolean;
  has_b12_deficiency: boolean;
  has_high_cholesterol: boolean;
  has_high_blood_pressure: boolean;
  has_digestive_issues: boolean;
  has_eating_disorder_history: boolean;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  injuries: string | null;
  allergies: string | null;
  other_deficiencies: string | null;
  other_conditions: string | null;
  notes: string | null;
  updated_at: string;
}

export interface CycleProfile {
  id: string;
  user_id: string;
  last_period_start: string | null;
  average_cycle_length: number | null;
  average_period_length: number | null;
  cycle_regular: string | null;
  flow_level: string | null;
  common_symptoms: string[] | null;
  birth_control_use: string | null;
  updated_at: string;
}

export interface CycleLog {
  id: string;
  user_id: string;
  date: string;
  is_period_day: boolean;
  period_not_started_yet?: boolean | null;
  flow_level: string | null;
  pain_score: number | null;
  symptoms: string[] | null;
  mood: string | null;
  energy_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface DietPreferences {
  id: string;
  user_id: string;
  diet_type: string | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_pescatarian: boolean;
  is_eggetarian: boolean;
  is_non_veg: boolean;
  is_kosher: boolean;
  is_halal: boolean;
  is_jain: boolean;
  is_gluten_free: boolean;
  is_lactose_free: boolean;
  is_dairy_free: boolean;
  is_nut_free: boolean;
  is_soy_free: boolean;
  cuisine_preference: string | null;
  meal_frequency: number | null;
  foods_to_avoid: string | null;
  updated_at: string;
}

export interface FastingPreferences {
  id: string;
  user_id: string;
  interested_in_fasting: boolean;
  fasting_type: string | null;
  eating_window_start: string | null;
  eating_window_end: string | null;
  feels_dizzy_when_fasting: boolean;
  fasting_caution_flags: string[] | null;
  updated_at: string;
}

export interface FitnessPreferences {
  id: string;
  user_id: string;
  fitness_level: string | null;
  gym_available: boolean;
  weights_available: boolean;
  swimming_available: boolean;
  running_available: boolean;
  home_workouts_available: boolean;
  walking_preferred: boolean;
  cycling_available: boolean;
  yoga_pilates_preferred: boolean;
  workout_days_per_week: number | null;
  workout_duration_minutes: number | null;
  preferred_activities: string[] | null;
  injuries: string | null;
  exercise_dislikes: string | null;
  updated_at: string;
}

export interface Goals {
  id: string;
  user_id: string;
  primary_goal: string | null;
  target_weight_kg: number | null;
  timeline_weeks: number | null;
  wants_weight_loss: boolean;
  wants_maintenance: boolean;
  wants_muscle_gain: boolean;
  wants_toning: boolean;
  wants_energy_improvement: boolean;
  wants_stamina: boolean;
  wants_cycle_awareness: boolean;
  wants_nutrition_improvement: boolean;
  goal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  water_ml: number | null;
  energy_score: number | null;
  mood: string | null;
  sleep_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: string | null;
  meal_name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  date: string;
  workout_name: string | null;
  duration_minutes: number | null;
  intensity: string | null;
  completed: boolean;
  skipped_reason: string | null;
  exercises: JsonValue | null;
  feedback: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  message: string;
  context_snapshot: JsonValue | null;
  created_at: string;
}

export interface UserContext {
  profile: Profile | null;
  bodyMetrics: BodyMetrics[];
  healthContext: HealthContext | null;
  cycleProfile: CycleProfile | null;
  cycleLogs: CycleLog[];
  dietPreferences: DietPreferences | null;
  fastingPreferences: FastingPreferences | null;
  fitnessPreferences: FitnessPreferences | null;
  goals: Goals | null;
  dailyLogs: DailyLog[];
  mealLogs: MealLog[];
  workoutLogs: WorkoutLog[];
  chatMessages: ChatMessage[];
  currentCyclePhase?: CyclePhase;
  cycleConfidence?: "low" | "medium" | "high";
  todayEnergyScore?: number;
  todaySymptoms?: string[];
  todayCalories?: number;
  todayProtein?: number;
  todayWater?: number;
  workoutCompleted?: boolean;
  setupProgress?: number;
  remainingCalories?: number;
}
