"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChipMultiSelect, FieldError, RadioGroup, saveSetupSection, SetupFormShell, useSetupNavigation, type SetupFormProps } from "./setup-shared";
import { Input, Select } from "@/components/ui";

const symptomOptions = [
  "Cramps",
  "Bloating",
  "Fatigue",
  "Acne",
  "Mood changes",
  "Cravings",
  "Spotting",
  "Headaches",
  "Back pain",
  "Nausea",
];

const schema = z.object({
  last_period_start: z.string().optional(),
  average_cycle_length: z.coerce.number().min(15).max(90),
  average_period_length: z.coerce.number().min(2).max(14),
  cycle_regular: z.enum(["regular", "irregular", "unsure"]),
  flow_level: z.string().optional(),
  common_symptoms: z.array(z.string()),
  birth_control_use: z.enum(["no", "yes", "prefer_not_to_say"]),
});

type CycleInfoInput = z.input<typeof schema>;
type CycleInfoValues = z.output<typeof schema>;

export function CycleInfoForm({ sectionIndex, onSaved }: SetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useSetupNavigation(sectionIndex);
  const { register, handleSubmit, watch, setValue } = useForm<CycleInfoInput, unknown, CycleInfoValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      average_cycle_length: 28,
      average_period_length: 5,
      cycle_regular: "unsure",
      common_symptoms: [],
      birth_control_use: "prefer_not_to_say",
    },
  });

  const cycleRegular = watch("cycle_regular");
  const symptoms = watch("common_symptoms");
  const birthControlUse = watch("birth_control_use");

  async function onSubmit(values: CycleInfoValues) {
    setLoading(true);
    setError(null);
    try {
      const result = await saveSetupSection("cycle_profile", values);
      onSaved("cycle_profile", result.setupProgress, values);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this section.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupFormShell
      title="Cycle information"
      description="Add cycle patterns so Karigai may adapt guidance by phase and symptoms."
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onSkip={navigation.skip}
      onNext={navigation.goNext}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Last period start" type="date" {...register("last_period_start")} />
        <Select
          label="Flow level"
          options={[
            { value: "", label: "Select flow" },
            { value: "light", label: "Light" },
            { value: "moderate", label: "Moderate" },
            { value: "heavy", label: "Heavy" },
          ]}
          {...register("flow_level")}
        />
        <Input label="Average cycle length" type="number" {...register("average_cycle_length")} />
        <Input label="Average period length" type="number" {...register("average_period_length")} />
      </div>
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Cycle regularity</p>
        <RadioGroup
          value={cycleRegular}
          options={[
            { value: "regular", label: "Regular" },
            { value: "irregular", label: "Irregular" },
            { value: "unsure", label: "Unsure" },
          ]}
          onChange={(value) => setValue("cycle_regular", value as CycleInfoInput["cycle_regular"])}
        />
        {cycleRegular === "irregular" ? (
          <p className="font-body text-xs text-muted">
            Karigai will rely on symptom tracking more than date prediction for you.
          </p>
        ) : null}
      </div>
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Common symptoms</p>
        <ChipMultiSelect
          values={symptoms}
          options={symptomOptions}
          onChange={(values) => setValue("common_symptoms", values)}
        />
      </div>
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Birth control use</p>
        <RadioGroup
          value={birthControlUse}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
            { value: "prefer_not_to_say", label: "Prefer not to say" },
          ]}
          onChange={(value) => setValue("birth_control_use", value as CycleInfoInput["birth_control_use"])}
        />
      </div>
      <FieldError message={error ?? undefined} />
    </SetupFormShell>
  );
}
