"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input, SafetyBanner } from "@/components/ui";
import {
  CheckboxGrid,
  FieldError,
  saveSetupSection,
  SetupFormShell,
  useSetupNavigation,
  type Option,
  type SetupFormProps,
} from "./setup-shared";

const booleanFields = [
  { value: "has_pcos", label: "PCOS (Polycystic ovary syndrome)" },
  { value: "has_pcod", label: "PCOD (Polycystic ovarian disease)" },
  { value: "has_prediabetes", label: "Prediabetes" },
  { value: "has_diabetes", label: "Type 1 or Type 2 diabetes" },
  { value: "has_thyroid_condition", label: "Thyroid condition (hypo or hyperthyroid)" },
  { value: "has_irregular_periods", label: "Irregular periods" },
  { value: "has_hormonal_concerns", label: "Hormonal imbalance or concern" },
  { value: "has_iron_deficiency", label: "Iron deficiency / anaemia" },
  { value: "has_vitamin_d_deficiency", label: "Vitamin D deficiency" },
  { value: "has_b12_deficiency", label: "Vitamin B12 deficiency" },
  { value: "has_high_cholesterol", label: "High cholesterol" },
  { value: "has_high_blood_pressure", label: "High blood pressure" },
  { value: "has_digestive_issues", label: "Digestive issues" },
  { value: "has_eating_disorder_history", label: "Eating disorder history" },
  { value: "is_pregnant", label: "Currently pregnant" },
  { value: "is_breastfeeding", label: "Currently breastfeeding" },
] satisfies Option[];

const booleanDefaults = Object.fromEntries(booleanFields.map((field) => [field.value, false])) as Record<
  string,
  boolean
>;

function booleanValuesFromRow(row: Record<string, unknown> | null | undefined) {
  return Object.fromEntries(booleanFields.map((field) => [field.value, row?.[field.value] === true])) as Record<string, boolean>;
}

const schema = z.object({
  conditions: z.record(z.string(), z.boolean()),
  injuries: z.string().optional(),
  allergies: z.string().optional(),
});

type HealthContextValues = z.infer<typeof schema>;

export function HealthContextForm({ sectionIndex, onSaved, initialData, profileMode, onNextSection }: SetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useSetupNavigation(sectionIndex);
  const { register, handleSubmit, watch, setValue, reset } = useForm<HealthContextValues, unknown, HealthContextValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      conditions: { ...booleanDefaults, ...booleanValuesFromRow(initialData) },
      injuries: typeof initialData?.injuries === "string" ? initialData.injuries : undefined,
      allergies: typeof initialData?.allergies === "string" ? initialData.allergies : undefined,
    },
  });

  useEffect(() => {
    if (!initialData) {
      return;
    }

    reset({
      conditions: { ...booleanDefaults, ...booleanValuesFromRow(initialData) },
      injuries: typeof initialData.injuries === "string" ? initialData.injuries : undefined,
      allergies: typeof initialData.allergies === "string" ? initialData.allergies : undefined,
    });
  }, [initialData, reset]);
  const conditions = watch("conditions");

  async function onSubmit(values: HealthContextValues) {
    setLoading(true);
    setError(null);
    const data = {
      ...values.conditions,
      injuries: values.injuries,
      allergies: values.allergies,
    };
    try {
      const result = await saveSetupSection("health_context", data);
      onSaved("health_context", result.setupProgress, data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this section.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupFormShell
      title="Health context"
      description="Share optional context Karigai can use for safer personalisation."
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onSkip={navigation.skip}
      onNext={onNextSection ?? navigation.goNext}
      profileMode={profileMode}
    >
      <SafetyBanner
        tone="info"
        title="Personalisation context only"
        body="These fields help Karigai adjust your plan. We do not diagnose or treat medical conditions. Selecting a condition here does not mean you have been clinically diagnosed."
      />
      <CheckboxGrid
        values={conditions}
        options={booleanFields}
        onChange={(key, checked) => setValue(`conditions.${key}`, checked)}
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Injuries" {...register("injuries")} />
        <Input label="Food allergies" {...register("allergies")} />
      </div>
      <FieldError message={error ?? undefined} />
    </SetupFormShell>
  );
}
