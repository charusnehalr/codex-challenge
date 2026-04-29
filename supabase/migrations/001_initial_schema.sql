create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  age int,
  height_cm numeric,
  weight_kg numeric,
  unit_system text default 'metric',
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table profiles enable row level security;
create policy "users own their profiles" on profiles
  for all using (auth.uid() = user_id);

create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric,
  waist_cm numeric,
  hip_cm numeric,
  body_fat_percent numeric,
  created_at timestamptz not null default now()
);

alter table body_metrics enable row level security;
create policy "users own their body_metrics" on body_metrics
  for all using (auth.uid() = user_id);

create table health_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  has_pcos boolean not null default false,
  has_pcod boolean not null default false,
  has_prediabetes boolean not null default false,
  has_diabetes boolean not null default false,
  has_thyroid_condition boolean not null default false,
  has_irregular_periods boolean not null default false,
  has_hormonal_concerns boolean not null default false,
  has_iron_deficiency boolean not null default false,
  has_vitamin_d_deficiency boolean not null default false,
  has_b12_deficiency boolean not null default false,
  has_high_cholesterol boolean not null default false,
  has_high_blood_pressure boolean not null default false,
  has_digestive_issues boolean not null default false,
  has_eating_disorder_history boolean not null default false,
  is_pregnant boolean not null default false,
  is_breastfeeding boolean not null default false,
  injuries text,
  allergies text,
  other_deficiencies text,
  other_conditions text,
  notes text,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table health_context enable row level security;
create policy "users own their health_context" on health_context
  for all using (auth.uid() = user_id);

create table cycle_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  last_period_start date,
  average_cycle_length int default 28,
  average_period_length int default 5,
  cycle_regular text default 'unsure',
  flow_level text,
  common_symptoms text[],
  birth_control_use text,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table cycle_profile enable row level security;
create policy "users own their cycle_profile" on cycle_profile
  for all using (auth.uid() = user_id);

create table cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  is_period_day boolean not null default false,
  period_not_started_yet boolean not null default false,
  flow_level text,
  pain_score int check (pain_score between 0 and 10),
  symptoms text[],
  mood text,
  energy_score int check (energy_score between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table cycle_logs enable row level security;
create policy "users own their cycle_logs" on cycle_logs
  for all using (auth.uid() = user_id);

create table diet_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  diet_type text,
  is_vegetarian boolean not null default false,
  is_vegan boolean not null default false,
  is_pescatarian boolean not null default false,
  is_eggetarian boolean not null default false,
  is_non_veg boolean not null default false,
  is_kosher boolean not null default false,
  is_halal boolean not null default false,
  is_jain boolean not null default false,
  is_gluten_free boolean not null default false,
  is_lactose_free boolean not null default false,
  is_dairy_free boolean not null default false,
  is_nut_free boolean not null default false,
  is_soy_free boolean not null default false,
  cuisine_preference text,
  meal_frequency int default 3,
  foods_to_avoid text,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table diet_preferences enable row level security;
create policy "users own their diet_preferences" on diet_preferences
  for all using (auth.uid() = user_id);

create table fasting_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interested_in_fasting boolean not null default false,
  fasting_type text default 'none',
  eating_window_start time,
  eating_window_end time,
  feels_dizzy_when_fasting boolean not null default false,
  fasting_caution_flags text[],
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table fasting_preferences enable row level security;
create policy "users own their fasting_preferences" on fasting_preferences
  for all using (auth.uid() = user_id);

create table fitness_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fitness_level text,
  gym_available boolean not null default false,
  weights_available boolean not null default false,
  swimming_available boolean not null default false,
  running_available boolean not null default false,
  home_workouts_available boolean not null default true,
  walking_preferred boolean not null default true,
  cycling_available boolean not null default false,
  yoga_pilates_preferred boolean not null default false,
  workout_days_per_week int,
  workout_duration_minutes int default 45,
  preferred_activities text[],
  injuries text,
  exercise_dislikes text,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table fitness_preferences enable row level security;
create policy "users own their fitness_preferences" on fitness_preferences
  for all using (auth.uid() = user_id);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  primary_goal text,
  target_weight_kg numeric,
  timeline_weeks int,
  wants_weight_loss boolean not null default false,
  wants_maintenance boolean not null default false,
  wants_muscle_gain boolean not null default false,
  wants_toning boolean not null default false,
  wants_energy_improvement boolean not null default false,
  wants_stamina boolean not null default false,
  wants_cycle_awareness boolean not null default false,
  wants_nutrition_improvement boolean not null default false,
  goal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table goals enable row level security;
create policy "users own their goals" on goals
  for all using (auth.uid() = user_id);

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  water_ml int default 0,
  energy_score int check (energy_score between 1 and 10),
  mood text,
  sleep_hours numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table daily_logs enable row level security;
create policy "users own their daily_logs" on daily_logs
  for all using (auth.uid() = user_id);

create table meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meal_type text,
  meal_name text not null,
  calories int,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table meal_logs enable row level security;
create policy "users own their meal_logs" on meal_logs
  for all using (auth.uid() = user_id);

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  workout_name text,
  duration_minutes int,
  intensity text,
  completed boolean not null default false,
  skipped_reason text,
  exercises jsonb,
  feedback text,
  created_at timestamptz not null default now()
);

alter table workout_logs enable row level security;
create policy "users own their workout_logs" on workout_logs
  for all using (auth.uid() = user_id);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  context_snapshot jsonb,
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;
create policy "users own their chat_messages" on chat_messages
  for all using (auth.uid() = user_id);
