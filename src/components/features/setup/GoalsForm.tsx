"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ChipMultiSelect,
  FieldError,
  RadioGroup,
  saveSetupSection,
  SetupFormShell,
  useSetupNavigation,
  type SetupFormProps,
} from "./setup-shared";
import { Input, Select } from "@/components/ui";

const goalOptions = [
  "lose_weight",
  "maintain_weight",
  "gain_muscle",
  "toning",
  "improve_energy",
  "improve_stamina",
  "improve_cycle_awareness",
  "improve_nutrition",
  "support_pcos_lifestyle",
  "support_prediabetes_lifestyle",
  "support_thyroid_routine",
];

const goalLabels: Record<string, string> = {
  lose_weight: "Lose weight",
  maintain_weight: "Maintain weight",
  gain_muscle: "Gain muscle",
  toning: "Toning",
  improve_energy: "Improve energy",
  improve_stamina: "Improve stamina",
  improve_cycle_awareness: "Improve cycle awareness",
  improve_nutrition: "Improve nutrition",
  support_pcos_lifestyle: "Support PCOS lifestyle",
  support_prediabetes_lifestyle: "Support prediabetes lifestyle",
  support_thyroid_routine: "Support thyroid routine",
};

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().positive("Must be positive.").optional(),
);

const schema = z.object({
  primary_goal: z.string().min(1, "Choose a primary goal."),
  additional_goals: z.array(z.string()),
  target_weight_kg: optionalPositiveNumber,
  timeline_weeks: z.string().optional(),
});

type GoalsInput = z.input<typeof schema>;
type GoalsValues = z.output<typeof schema>;

export function GoalsForm({ sectionIndex, onSaved }: SetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useSetupNavigation(sectionIndex);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalsInput, unknown, GoalsValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      primary_goal: "lose_weight",
      additional_goals: [],
      timeline_weeks: "no_rush",
    },
  });
  const primaryGoal = watch("primary_goal");
  const additionalGoals = watch("additional_goals");

  async function onSubmit(values: GoalsValues) {
    setLoading(true);
    setError(null);
    const chosen = new Set([values.primary_goal, ...values.additional_goals]);
    const data = {
      primary_goal: values.primary_goal,
      target_weight_kg: values.target_weight_kg,
      timeline_weeks: values.timeline_weeks === "no_rush" ? undefined : Number(values.timeline_weeks),
      wants_weight_loss: chosen.has("lose_weight"),
      wants_maintenance: chosen.has("maintain_weight"),
      wants_muscle_gain: chosen.has("gain_muscle"),
      wants_toning: chosen.has("toning"),
      wants_energy_improvement: chosen.has("improve_energy"),
      wants_stamina: chosen.has("improve_stamina"),
      wants_cycle_awareness: chosen.has("improve_cycle_awareness"),
      wants_nutrition_improvement: chosen.has("improve_nutrition"),
      goal_notes: values.additional_goals.map((goal) => goalLabels[goal]).join(", "),
    };

    try {
      const result = await saveSetupSection("goals", data);
      onSaved("goals", result.setupProgress, data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this section.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupFormShell
      title="Goals"
      description="Choose your priorities so Karigai can shape plans around what matters most."
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onSkip={navigation.skip}
      onNext={navigation.goNext}
    >
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Primary goal</p>
        <RadioGroup
          value={primaryGoal}
          options={goalOptions.map((goal) => ({ value: goal, label: goalLabels[goal] }))}
          onChange={(value) => setValue("primary_goal", value)}
        />
        <FieldError message={errors.primary_goal?.message} />
      </div>
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Additional goals</p>
        <ChipMultiSelect
          values={additionalGoals.map((goal) => goalLabels[goal])}
          options={goalOptions.map((goal) => goalLabels[goal])}
          onChange={(labels) =>
            setValue(
              "additional_goals",
              labels
                .map((label) => goalOptions.find((goal) => goalLabels[goal] === label))
                .filter((goal): goal is string => Boolean(goal)),
            )
          }
        />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="Target weight (kg)"
          type="number"
          error={errors.target_weight_kg?.message}
          {...register("target_weight_kg")}
        />
        <Select
          label="Timeline"
          options={[
            { value: "4", label: "4 weeks" },
            { value: "8", label: "8 weeks" },
            { value: "12", label: "12 weeks" },
            { value: "26", label: "26 weeks" },
            { value: "52", label: "52 weeks" },
            { value: "no_rush", label: "No rush" },
          ]}
          {...register("timeline_weeks")}
        />
      </div>
      <FieldError message={error ?? undefined} />
    </SetupFormShell>
  );
}
