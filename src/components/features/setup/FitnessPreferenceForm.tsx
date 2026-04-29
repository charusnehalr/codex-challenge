"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckboxGrid, FieldError, RadioGroup, saveSetupSection, SetupFormShell, useSetupNavigation, type Option, type SetupFormProps } from "./setup-shared";
import { Select } from "@/components/ui";

const accessOptions = [
  { value: "gym_available", label: "Gym" },
  { value: "weights_available", label: "Weight lifting equipment" },
  { value: "swimming_available", label: "Swimming pool" },
  { value: "running_available", label: "Running (outdoor)" },
  { value: "home_workouts_available", label: "Home workouts" },
  { value: "walking_preferred", label: "Walking" },
  { value: "cycling_available", label: "Cycling" },
  { value: "yoga_pilates_preferred", label: "Yoga or Pilates" },
  { value: "dance_sports_available", label: "Dance or sports" },
] satisfies Option[];

const accessDefaults = Object.fromEntries(accessOptions.map((option) => [option.value, false])) as Record<string, boolean>;

function accessValuesFromRow(row: Record<string, unknown> | null | undefined) {
  return Object.fromEntries(accessOptions.map((option) => [option.value, row?.[option.value] === true])) as Record<string, boolean>;
}

const schema = z.object({
  access: z.record(z.string(), z.boolean()),
  workout_days_per_week: z.coerce.number().min(1).max(7),
  workout_duration_minutes: z.string(),
  fitness_level: z.enum(["beginner", "intermediate", "advanced"]),
  injuries: z.string().optional(),
  exercise_dislikes: z.string().optional(),
});

type FitnessPreferenceInput = z.input<typeof schema>;
type FitnessPreferenceValues = z.output<typeof schema>;

export function FitnessPreferenceForm({ sectionIndex, onSaved, initialData, profileMode, onNextSection }: SetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useSetupNavigation(sectionIndex);
  const { register, handleSubmit, watch, setValue, reset } = useForm<FitnessPreferenceInput, unknown, FitnessPreferenceValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      access: { ...accessDefaults, home_workouts_available: true, walking_preferred: true, ...accessValuesFromRow(initialData) },
      workout_days_per_week: typeof initialData?.workout_days_per_week === "number" ? initialData.workout_days_per_week : 4,
      workout_duration_minutes: typeof initialData?.workout_duration_minutes === "number" ? String(initialData.workout_duration_minutes) : "45",
      fitness_level: typeof initialData?.fitness_level === "string" ? initialData.fitness_level as FitnessPreferenceInput["fitness_level"] : "beginner",
      injuries: typeof initialData?.injuries === "string" ? initialData.injuries : undefined,
      exercise_dislikes: typeof initialData?.exercise_dislikes === "string" ? initialData.exercise_dislikes : undefined,
    },
  });

  useEffect(() => {
    if (!initialData) {
      return;
    }

    reset({
      access: { ...accessDefaults, home_workouts_available: true, walking_preferred: true, ...accessValuesFromRow(initialData) },
      workout_days_per_week: typeof initialData.workout_days_per_week === "number" ? initialData.workout_days_per_week : 4,
      workout_duration_minutes: typeof initialData.workout_duration_minutes === "number" ? String(initialData.workout_duration_minutes) : "45",
      fitness_level: typeof initialData.fitness_level === "string" ? initialData.fitness_level as FitnessPreferenceInput["fitness_level"] : "beginner",
      injuries: typeof initialData.injuries === "string" ? initialData.injuries : undefined,
      exercise_dislikes: typeof initialData.exercise_dislikes === "string" ? initialData.exercise_dislikes : undefined,
    });
  }, [initialData, reset]);
  const access = watch("access");
  const level = watch("fitness_level");

  async function onSubmit(values: FitnessPreferenceValues) {
    setLoading(true);
    setError(null);
    const durationMinutes = values.workout_duration_minutes === "90+"
      ? 90
      : Number(String(values.workout_duration_minutes ?? "45").replace(/\D/g, ""));
    const data = {
      gym_available: Boolean(values.access.gym_available),
      weights_available: Boolean(values.access.weights_available),
      swimming_available: Boolean(values.access.swimming_available),
      running_available: Boolean(values.access.running_available),
      home_workouts_available: Boolean(values.access.home_workouts_available),
      walking_preferred: Boolean(values.access.walking_preferred),
      cycling_available: Boolean(values.access.cycling_available),
      yoga_pilates_preferred: Boolean(values.access.yoga_pilates_preferred),
      preferred_activities: values.access.dance_sports_available ? ["Dance or sports"] : [],
      workout_days_per_week: Number.isFinite(values.workout_days_per_week) ? values.workout_days_per_week : null,
      workout_duration_minutes: Number.isFinite(durationMinutes) ? durationMinutes : 45,
      fitness_level: values.fitness_level,
      injuries: values.injuries?.trim() ? values.injuries : null,
      exercise_dislikes: values.exercise_dislikes?.trim() ? values.exercise_dislikes : null,
    };
    try {
      const result = await saveSetupSection("fitness_preferences", data);
      onSaved("fitness_preferences", result.setupProgress, data);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to save this section.";
      console.error("[FitnessPreferenceForm] save error:", message);

      if (message.includes("schema cache") || message.includes("42P01")) {
        setError("Database configuration issue. Please contact support.");
      } else if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Failed to save. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupFormShell
      title="Fitness preferences"
      description="Choose access, level, and workout rhythm so movement plans can fit your life."
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onSkip={navigation.skip}
      onNext={onNextSection ?? navigation.goNext}
      profileMode={profileMode}
    >
      <CheckboxGrid values={access} options={accessOptions} onChange={(key, checked) => setValue(`access.${key}`, checked)} />
      <div className="grid gap-5 md:grid-cols-2">
        <Select
          label="Workout days per week"
          options={["1", "2", "3", "4", "5", "6", "7"].map((value) => ({ value, label: value }))}
          {...register("workout_days_per_week")}
        />
        <Select
          label="Workout duration"
          options={["15", "30", "45", "60", "90+"].map((value) => ({ value, label: `${value} minutes` }))}
          {...register("workout_duration_minutes")}
        />
      </div>
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Fitness level</p>
        <RadioGroup
          value={level}
          options={[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
          ]}
          onChange={(value) => setValue("fitness_level", value as FitnessPreferenceInput["fitness_level"])}
        />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block font-body text-sm text-ink">
          <span className="mb-1.5 block text-xs font-medium text-ink2">Injuries</span>
          <textarea className="min-h-24 w-full rounded-xl border border-hairline bg-card px-4 py-3 font-body text-sm outline-none focus:border-clay focus:ring-2 focus:ring-clay/30" {...register("injuries")} />
        </label>
        <label className="block font-body text-sm text-ink">
          <span className="mb-1.5 block text-xs font-medium text-ink2">Exercise dislikes</span>
          <textarea className="min-h-24 w-full rounded-xl border border-hairline bg-card px-4 py-3 font-body text-sm outline-none focus:border-clay focus:ring-2 focus:ring-clay/30" {...register("exercise_dislikes")} />
        </label>
      </div>
      <FieldError message={error ?? undefined} />
    </SetupFormShell>
  );
}
