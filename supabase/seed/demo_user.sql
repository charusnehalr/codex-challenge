insert into profiles (
  user_id,
  name,
  age,
  height_cm,
  weight_kg,
  unit_system,
  country
) values (
  '00000000-0000-0000-0000-000000000001',
  'Priya',
  28,
  163,
  68,
  'metric',
  'India'
);

insert into body_metrics (
  user_id,
  date,
  weight_kg,
  waist_cm,
  hip_cm
) values (
  '00000000-0000-0000-0000-000000000001',
  current_date,
  68,
  82,
  101
);

insert into health_context (
  user_id,
  has_pcos,
  has_iron_deficiency,
  has_irregular_periods,
  notes
) values (
  '00000000-0000-0000-0000-000000000001',
  true,
  true,
  true,
  'Demo wellness context for Priya.'
);

insert into cycle_profile (
  user_id,
  last_period_start,
  average_cycle_length,
  average_period_length,
  cycle_regular,
  flow_level,
  common_symptoms
) values (
  '00000000-0000-0000-0000-000000000001',
  (current_date - interval '3 weeks')::date,
  32,
  5,
  'irregular',
  'medium',
  array['cramps', 'fatigue', 'bloating']
);

insert into cycle_logs (
  user_id,
  date,
  is_period_day,
  flow_level,
  pain_score,
  symptoms,
  mood,
  energy_score,
  notes
) values (
  '00000000-0000-0000-0000-000000000001',
  current_date,
  false,
  null,
  3,
  array['bloating'],
  'steady',
  7,
  'Demo cycle check-in.'
);

insert into diet_preferences (
  user_id,
  diet_type,
  is_vegetarian,
  cuisine_preference,
  meal_frequency,
  foods_to_avoid
) values (
  '00000000-0000-0000-0000-000000000001',
  'vegetarian',
  true,
  'South Indian',
  3,
  'Very spicy dinners'
);

insert into fasting_preferences (
  user_id,
  interested_in_fasting,
  fasting_type,
  eating_window_start,
  eating_window_end,
  fasting_caution_flags
) values (
  '00000000-0000-0000-0000-000000000001',
  true,
  '14:10',
  '09:00',
  '19:00',
  array['iron_deficiency']
);

insert into fitness_preferences (
  user_id,
  fitness_level,
  gym_available,
  walking_preferred,
  workout_days_per_week,
  workout_duration_minutes,
  preferred_activities
) values (
  '00000000-0000-0000-0000-000000000001',
  'beginner',
  true,
  true,
  4,
  45,
  array['walking', 'strength training']
);

insert into goals (
  user_id,
  primary_goal,
  target_weight_kg,
  timeline_weeks,
  wants_weight_loss,
  wants_energy_improvement,
  wants_cycle_awareness,
  wants_nutrition_improvement,
  goal_notes
) values (
  '00000000-0000-0000-0000-000000000001',
  'lose_weight',
  62,
  24,
  true,
  true,
  true,
  true,
  'Lose weight while supporting energy and cycle awareness.'
);

insert into daily_logs (
  user_id,
  date,
  water_ml,
  energy_score,
  mood,
  sleep_hours,
  notes
) values (
  '00000000-0000-0000-0000-000000000001',
  current_date,
  1800,
  7,
  'calm',
  7.5,
  'Demo daily log.'
);

insert into meal_logs (
  user_id,
  date,
  meal_type,
  meal_name,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  fiber_g,
  notes
) values
(
  '00000000-0000-0000-0000-000000000001',
  current_date,
  'breakfast',
  'Idli with sambar',
  360,
  14,
  62,
  7,
  8,
  'Demo breakfast.'
),
(
  '00000000-0000-0000-0000-000000000001',
  current_date,
  'lunch',
  'Vegetable dal bowl',
  520,
  24,
  78,
  12,
  12,
  'Demo lunch.'
);

insert into workout_logs (
  user_id,
  date,
  workout_name,
  duration_minutes,
  intensity,
  completed,
  exercises,
  feedback
) values (
  '00000000-0000-0000-0000-000000000001',
  current_date,
  'Full body strength',
  40,
  'moderate',
  true,
  '[{"name":"Goblet squat","sets":3},{"name":"Incline push-up","sets":3}]'::jsonb,
  'Felt steady.'
);

insert into chat_messages (
  user_id,
  role,
  message,
  context_snapshot
) values
(
  '00000000-0000-0000-0000-000000000001',
  'user',
  'Can you help me plan today around my energy?',
  '{"energy_score":7,"cycle_day":21}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'assistant',
  'Based on what you have shared, a moderate workout and iron-supportive vegetarian meals may fit today.',
  '{"energy_score":7,"cycle_day":21}'::jsonb
);
