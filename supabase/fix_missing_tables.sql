-- ============================================================
-- KARIGAI - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your Karigai project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New query"
-- 5. Paste this ENTIRE file into the editor
-- 6. Click "Run" (or press Cmd+Enter)
-- 7. You should see "Success. No rows returned" for each statement
-- 8. Go back to the app and try saving again
-- 9. If the app still says "schema cache", wait 30 seconds and rerun
--    the final NOTIFY statement at the bottom of this file
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  age integer,
  height_cm numeric,
  weight_kg numeric,
  unit_system text DEFAULT 'metric',
  country text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their profiles" ON public.profiles;
CREATE POLICY "users own their profiles" ON public.profiles FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.body_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT current_date,
  weight_kg numeric,
  waist_cm numeric,
  hip_cm numeric,
  body_fat_percent numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their body_metrics" ON public.body_metrics;
CREATE POLICY "users own their body_metrics" ON public.body_metrics FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.health_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  has_pcos boolean DEFAULT false,
  has_pcod boolean DEFAULT false,
  has_prediabetes boolean DEFAULT false,
  has_diabetes boolean DEFAULT false,
  has_thyroid_condition boolean DEFAULT false,
  has_irregular_periods boolean DEFAULT false,
  has_hormonal_concerns boolean DEFAULT false,
  has_iron_deficiency boolean DEFAULT false,
  has_vitamin_d_deficiency boolean DEFAULT false,
  has_b12_deficiency boolean DEFAULT false,
  has_high_cholesterol boolean DEFAULT false,
  has_high_blood_pressure boolean DEFAULT false,
  has_digestive_issues boolean DEFAULT false,
  has_eating_disorder_history boolean DEFAULT false,
  is_pregnant boolean DEFAULT false,
  is_breastfeeding boolean DEFAULT false,
  injuries text,
  allergies text,
  other_deficiencies text,
  other_conditions text,
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.health_context ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their health_context" ON public.health_context;
CREATE POLICY "users own their health_context" ON public.health_context FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cycle_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_period_start date,
  average_cycle_length integer DEFAULT 28,
  average_period_length integer DEFAULT 5,
  cycle_regular text DEFAULT 'unsure',
  flow_level text,
  common_symptoms text[],
  birth_control_use text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.cycle_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their cycle_profile" ON public.cycle_profile;
CREATE POLICY "users own their cycle_profile" ON public.cycle_profile FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cycle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT current_date,
  is_period_day boolean DEFAULT false,
  flow_level text,
  pain_score integer CHECK (pain_score BETWEEN 0 AND 10),
  symptoms text[],
  mood text,
  energy_score integer CHECK (energy_score BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.cycle_logs ADD COLUMN IF NOT EXISTS period_not_started_yet boolean DEFAULT false;
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their cycle_logs" ON public.cycle_logs;
CREATE POLICY "users own their cycle_logs" ON public.cycle_logs FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.diet_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  diet_type text,
  is_vegetarian boolean DEFAULT false,
  is_vegan boolean DEFAULT false,
  is_pescatarian boolean DEFAULT false,
  is_eggetarian boolean DEFAULT false,
  is_non_veg boolean DEFAULT false,
  is_kosher boolean DEFAULT false,
  is_halal boolean DEFAULT false,
  is_jain boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  is_lactose_free boolean DEFAULT false,
  is_dairy_free boolean DEFAULT false,
  is_nut_free boolean DEFAULT false,
  is_soy_free boolean DEFAULT false,
  cuisine_preference text,
  meal_frequency integer DEFAULT 3,
  foods_to_avoid text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.diet_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their diet_preferences" ON public.diet_preferences;
CREATE POLICY "users own their diet_preferences" ON public.diet_preferences FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.fasting_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  interested_in_fasting boolean DEFAULT false,
  fasting_type text DEFAULT 'none',
  eating_window_start time,
  eating_window_end time,
  feels_dizzy_when_fasting boolean DEFAULT false,
  fasting_caution_flags text[],
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.fasting_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their fasting_preferences" ON public.fasting_preferences;
CREATE POLICY "users own their fasting_preferences" ON public.fasting_preferences FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.fitness_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  fitness_level text,
  gym_available boolean DEFAULT false,
  weights_available boolean DEFAULT false,
  swimming_available boolean DEFAULT false,
  running_available boolean DEFAULT false,
  home_workouts_available boolean DEFAULT true,
  walking_preferred boolean DEFAULT true,
  cycling_available boolean DEFAULT false,
  yoga_pilates_preferred boolean DEFAULT false,
  workout_days_per_week integer,
  workout_duration_minutes integer DEFAULT 45,
  preferred_activities text[],
  injuries text,
  exercise_dislikes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.fitness_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their fitness_preferences" ON public.fitness_preferences;
CREATE POLICY "users own their fitness_preferences" ON public.fitness_preferences FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_goal text,
  target_weight_kg numeric,
  timeline_weeks integer,
  wants_weight_loss boolean DEFAULT false,
  wants_maintenance boolean DEFAULT false,
  wants_muscle_gain boolean DEFAULT false,
  wants_toning boolean DEFAULT false,
  wants_energy_improvement boolean DEFAULT false,
  wants_stamina boolean DEFAULT false,
  wants_cycle_awareness boolean DEFAULT false,
  wants_nutrition_improvement boolean DEFAULT false,
  goal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their goals" ON public.goals;
CREATE POLICY "users own their goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT current_date,
  water_ml integer DEFAULT 0,
  energy_score integer CHECK (energy_score BETWEEN 1 AND 10),
  mood text,
  sleep_hours numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their daily_logs" ON public.daily_logs;
CREATE POLICY "users own their daily_logs" ON public.daily_logs FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT current_date,
  meal_type text,
  meal_name text NOT NULL,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their meal_logs" ON public.meal_logs;
CREATE POLICY "users own their meal_logs" ON public.meal_logs FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT current_date,
  workout_name text,
  duration_minutes integer,
  intensity text,
  completed boolean DEFAULT false,
  skipped_reason text,
  exercises jsonb,
  feedback text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their workout_logs" ON public.workout_logs;
CREATE POLICY "users own their workout_logs" ON public.workout_logs FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user', 'assistant')),
  message text NOT NULL,
  context_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own their chat_messages" ON public.chat_messages;
CREATE POLICY "users own their chat_messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

-- Force Supabase/PostgREST to reload the schema cache immediately.
-- This fixes "Could not find the table 'public.profiles' in the schema cache"
-- when the tables were just created.
NOTIFY pgrst, 'reload schema';
