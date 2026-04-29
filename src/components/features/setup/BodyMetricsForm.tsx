"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input, SafetyBanner } from "@/components/ui";
import {
  FieldError,
  saveSetupSection,
  SetupFormShell,
  useSetupNavigation,
  type SetupFormProps,
} from "./setup-shared";

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().positive("Must be positive.").optional(),
);

const schema = z.object({
  waist_cm: z.coerce.number().positive("Waist must be positive."),
  hip_cm: z.coerce.number().positive("Hip must be positive."),
  target_weight_kg: optionalPositiveNumber,
  body_fat_percent: optionalPositiveNumber,
});

type BodyMetricsInput = z.input<typeof schema>;
type BodyMetricsValues = z.output<typeof schema>;

export function BodyMetricsForm({ sectionIndex, onSaved }: SetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useSetupNavigation(sectionIndex);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BodyMetricsInput, unknown, BodyMetricsValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: BodyMetricsValues) {
    setLoading(true);
    setError(null);
    try {
      const result = await saveSetupSection("body_metrics", values);
      onSaved("body_metrics", result.setupProgress, values);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this section.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupFormShell
      title="Body metrics"
      description="Add optional measurements so Karigai can understand body shape context."
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onSkip={navigation.skip}
      onNext={navigation.goNext}
    >
      <SafetyBanner
        tone="info"
        title="Wellness estimates only"
        body="Waist and hip measurements help estimate body shape context. These are wellness estimates, not diagnosis."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Waist (cm)" type="number" error={errors.waist_cm?.message} {...register("waist_cm")} />
        <Input label="Hip (cm)" type="number" error={errors.hip_cm?.message} {...register("hip_cm")} />
        <Input
          label="Target weight (kg)"
          type="number"
          error={errors.target_weight_kg?.message}
          {...register("target_weight_kg")}
        />
        <Input
          label="Body fat percent"
          type="number"
          error={errors.body_fat_percent?.message}
          {...register("body_fat_percent")}
        />
      </div>
      <FieldError message={error ?? undefined} />
    </SetupFormShell>
  );
}
