"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckboxGrid, ChipMultiSelect, FieldError, RadioGroup, saveSetupSection, SetupFormShell, useSetupNavigation, type Option, type SetupFormProps } from "./setup-shared";
import { Select } from "@/components/ui";

const restrictionOptions = [
  { value: "is_kosher", label: "Kosher" },
  { value: "is_halal", label: "Halal" },
  { value: "is_jain", label: "Jain" },
  { value: "is_gluten_free", label: "Gluten-free" },
  { value: "is_lactose_free", label: "Lactose-free" },
  { value: "is_dairy_free", label: "Dairy-free" },
  { value: "is_nut_free", label: "Nut-free" },
  { value: "is_soy_free", label: "Soy-free" },
  { value: "low_spice", label: "Low spice" },
  { value: "no_onion_garlic", label: "No onion/garlic" },
] satisfies Option[];

const schema = z.object({
  diet_type: z.string().min(1),
  restrictions: z.record(z.string(), z.boolean()),
  cuisine_preference: z.array(z.string()),
  meal_frequency: z.coerce.number().min(2).max(6),
  foods_to_avoid: z.string().optional(),
});

type DietPreferenceInput = z.input<typeof schema>;
type DietPreferenceValues = z.output<typeof schema>;

const restrictionDefaults = Object.fromEntries(restrictionOptions.map((option) => [option.value, false])) as Record<string, boolean>;

function restrictionValuesFromRow(row: Record<string, unknown> | null | undefined) {
  return Object.fromEntries(restrictionOptions.map((option) => [option.value, row?.[option.value] === true])) as Record<string, boolean>;
}

export function DietPreferenceForm({ sectionIndex, onSaved, initialData, profileMode, onNextSection }: SetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useSetupNavigation(sectionIndex);
  const { register, handleSubmit, watch, setValue, reset } = useForm<DietPreferenceInput, unknown, DietPreferenceValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      diet_type: typeof initialData?.diet_type === "string" ? initialData.diet_type : "vegetarian",
      restrictions: { ...restrictionDefaults, ...restrictionValuesFromRow(initialData) },
      cuisine_preference: typeof initialData?.cuisine_preference === "string" ? initialData.cuisine_preference.split(",").map((item) => item.trim()).filter(Boolean) : [],
      meal_frequency: typeof initialData?.meal_frequency === "number" ? initialData.meal_frequency : 3,
      foods_to_avoid: typeof initialData?.foods_to_avoid === "string" ? initialData.foods_to_avoid : undefined,
    },
  });

  useEffect(() => {
    if (!initialData) {
      return;
    }

    reset({
      diet_type: typeof initialData.diet_type === "string" ? initialData.diet_type : "vegetarian",
      restrictions: { ...restrictionDefaults, ...restrictionValuesFromRow(initialData) },
      cuisine_preference: typeof initialData.cuisine_preference === "string" ? initialData.cuisine_preference.split(",").map((item) => item.trim()).filter(Boolean) : [],
      meal_frequency: typeof initialData.meal_frequency === "number" ? initialData.meal_frequency : 3,
      foods_to_avoid: typeof initialData.foods_to_avoid === "string" ? initialData.foods_to_avoid : undefined,
    });
  }, [initialData, reset]);
  const dietType = watch("diet_type");
  const restrictions = watch("restrictions");
  const cuisines = watch("cuisine_preference");

  async function onSubmit(values: DietPreferenceValues) {
    setLoading(true);
    setError(null);
    const data = {
      diet_type: values.diet_type,
      is_vegetarian: values.diet_type === "vegetarian",
      is_vegan: values.diet_type === "vegan",
      is_pescatarian: values.diet_type === "pescatarian",
      is_eggetarian: values.diet_type === "eggetarian",
      is_non_veg: values.diet_type === "non_vegetarian",
      is_kosher: values.restrictions.is_kosher,
      is_halal: values.restrictions.is_halal,
      is_jain: values.restrictions.is_jain,
      is_gluten_free: values.restrictions.is_gluten_free,
      is_lactose_free: values.restrictions.is_lactose_free,
      is_dairy_free: values.restrictions.is_dairy_free,
      is_nut_free: values.restrictions.is_nut_free,
      is_soy_free: values.restrictions.is_soy_free,
      cuisine_preference: values.cuisine_preference.join(", "),
      meal_frequency: values.meal_frequency,
      foods_to_avoid: [values.foods_to_avoid, values.restrictions.low_spice ? "Low spice" : "", values.restrictions.no_onion_garlic ? "No onion/garlic" : ""]
        .filter(Boolean)
        .join("; "),
    };
    try {
      const result = await saveSetupSection("diet_preferences", data);
      onSaved("diet_preferences", result.setupProgress, data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this section.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupFormShell
      title="Diet preferences"
      description="Tell Karigai how you eat so meal ideas can fit your preferences."
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onSkip={navigation.skip}
      onNext={onNextSection ?? navigation.goNext}
      profileMode={profileMode}
    >
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Primary diet type</p>
        <RadioGroup
          value={dietType}
          options={[
            { value: "vegetarian", label: "Vegetarian" },
            { value: "vegan", label: "Vegan" },
            { value: "pescatarian", label: "Pescatarian" },
            { value: "eggetarian", label: "Eggetarian" },
            { value: "non_vegetarian", label: "Non-vegetarian" },
            { value: "other", label: "Other" },
          ]}
          onChange={(value) => setValue("diet_type", value)}
        />
      </div>
      <CheckboxGrid values={restrictions} options={restrictionOptions} onChange={(key, checked) => setValue(`restrictions.${key}`, checked)} />
      <div className="space-y-3">
        <p className="font-body text-xs font-medium text-ink2">Cuisine preference</p>
        <ChipMultiSelect
          values={cuisines}
          options={["Indian", "Mediterranean", "Asian", "Western", "Middle Eastern", "Mexican", "Mixed"]}
          onChange={(values) => setValue("cuisine_preference", values)}
        />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Select
          label="Meal frequency"
          options={["2", "3", "4", "5", "6"].map((value) => ({ value, label: `${value} times per day` }))}
          {...register("meal_frequency")}
        />
        <label className="block font-body text-sm text-ink">
          <span className="mb-1.5 block text-xs font-medium text-ink2">Foods to avoid</span>
          <textarea className="min-h-24 w-full rounded-xl border border-hairline bg-card px-4 py-3 font-body text-sm outline-none focus:border-clay focus:ring-2 focus:ring-clay/30" {...register("foods_to_avoid")} />
        </label>
      </div>
      <FieldError message={error ?? undefined} />
    </SetupFormShell>
  );
}
