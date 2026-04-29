"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input, SafetyBanner } from "@/components/ui";
import {
  FieldError,
  RadioGroup,
  saveSetupSection,
  SetupFormShell,
  useSetupNavigation,
  type SetupFormProps,
} from "./setup-shared";

const schema = z.object({
  interested_in_fasting: z.enum(["no", "maybe", "yes"]),
  fasting_type: z.enum(["none", "12:12", "14:10", "16:8", "custom"]),
  eating_window_start: z.string().optional(),
  eating_window_end: z.string().optional(),
  feels_dizzy_when_fasting: z.enum(["no", "yes"]),
  has_eating_disorder_history_fasting_check: z.enum(["no", "yes", "prefer_not_to_say"]),
});

type FastingPreferenceValues = z.infer<typeof schema>;

function isTruthy(value: unknown) {
  return value === true || value === "yes";
}

export function FastingPreferenceForm({ sectionIndex, onSaved, healthContext }: SetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useSetupNavigation(sectionIndex);
  const { register, handleSubmit, watch, setValue } = useForm<FastingPreferenceValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      interested_in_fasting: "no",
      fasting_type: "none",
      feels_dizzy_when_fasting: "no",
      has_eating_disorder_history_fasting_check: "no",
    },
  });

  const interest = watch("interested_in_fasting");
  const fastingType = watch("fasting_type");
  const feelsDizzy = watch("feels_dizzy_when_fasting") === "yes";
  const fastingCheck = watch("has_eating_disorder_history_fasting_check");
  const safetyBlocked =
    isTruthy(healthContext?.has_eating_disorder_history) ||
    isTruthy(healthContext?.is_pregnant) ||
    isTruthy(healthContext?.is_breastfeeding) ||
    feelsDizzy ||
    fastingCheck === "yes";
  const showWindow = interest !== "no" && ["14:10", "16:8", "custom"].includes(fastingType);

  async function onSubmit(values: FastingPreferenceValues) {
    setLoading(true);
    setError(null);
    const cautionFlags = [
      safetyBlocked ? "fasting_not_recommended" : "",
      values.has_eating_disorder_history_fasting_check === "yes" ? "eating_disorder_history" : "",
      values.feels_dizzy_when_fasting === "yes" ? "dizziness" : "",
    ].filter(Boolean);
    const data = {
      interested_in_fasting: values.interested_in_fasting !== "no" && !safetyBlocked,
      fasting_type: safetyBlocked ? "none" : values.fasting_type,
      eating_window_start: values.eating_window_start,
      eating_window_end: values.eating_window_end,
      feels_dizzy_when_fasting: values.feels_dizzy_when_fasting === "yes",
      fasting_caution_flags: cautionFlags,
    };

    try {
      const result = await saveSetupSection("fasting_preferences", data);
      onSaved("fasting_preferences", result.setupProgress, data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this section.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupFormShell
      title="Fasting preferences"
      description="Karigai only uses fasting preferences when they may fit your shared context."
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onSkip={navigation.skip}
      onNext={navigation.goNext}
    >
      {safetyBlocked ? (
        <SafetyBanner
          tone="warn"
          title="Fasting not recommended for your context"
          body="Based on the health context you've shared, Karigai will not suggest fasting. Regular, balanced meals are recommended instead."
        />
      ) : null}
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Interested in fasting?</p>
        <RadioGroup
          value={interest}
          options={[
            { value: "no", label: "No" },
            { value: "maybe", label: "Maybe" },
            { value: "yes", label: "Yes" },
          ]}
          onChange={(value) => setValue("interested_in_fasting", value as FastingPreferenceValues["interested_in_fasting"])}
        />
      </div>
      {interest !== "no" ? (
        <div className="space-y-5">
          <div className={safetyBlocked ? "pointer-events-none opacity-50" : ""}>
            <p className="mb-3 font-body text-xs font-medium text-ink2">Fasting type</p>
            <RadioGroup
              value={fastingType}
              options={[
                { value: "12:12", label: "12:12" },
                { value: "14:10", label: "14:10" },
                { value: "16:8", label: "16:8" },
                { value: "custom", label: "Custom" },
              ]}
              onChange={(value) => setValue("fasting_type", value as FastingPreferenceValues["fasting_type"])}
            />
          </div>
          {showWindow ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Eating window start" type="time" {...register("eating_window_start")} />
              <Input label="Eating window end" type="time" {...register("eating_window_end")} />
            </div>
          ) : null}
          <div className="space-y-3">
            <p className="font-body text-xs font-medium text-ink2">Do you feel dizzy when fasting?</p>
            <RadioGroup
              value={watch("feels_dizzy_when_fasting")}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
              onChange={(value) => setValue("feels_dizzy_when_fasting", value as FastingPreferenceValues["feels_dizzy_when_fasting"])}
            />
          </div>
          <div className="space-y-3">
            <p className="font-body text-xs font-medium text-ink2">Eating disorder history safety check</p>
            <RadioGroup
              value={fastingCheck}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
                { value: "prefer_not_to_say", label: "Prefer not to say" },
              ]}
              onChange={(value) =>
                setValue(
                  "has_eating_disorder_history_fasting_check",
                  value as FastingPreferenceValues["has_eating_disorder_history_fasting_check"],
                )
              }
            />
          </div>
        </div>
      ) : null}
      <FieldError message={error ?? undefined} />
    </SetupFormShell>
  );
}
