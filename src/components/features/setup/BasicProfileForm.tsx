"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  FieldError,
  RadioGroup,
  saveSetupSection,
  SetupFormShell,
  useSetupNavigation,
  type SetupFormProps,
} from "./setup-shared";
import { Input } from "@/components/ui";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  age: z.coerce.number().min(13, "Age must be at least 13.").max(100, "Age must be 100 or below."),
  heightUnit: z.enum(["cm", "ft_in"]),
  height_cm: z.coerce.number().positive("Height must be positive.").optional(),
  height_ft: z.coerce.number().positive("Feet must be positive.").optional(),
  height_in: z.coerce.number().min(0, "Inches cannot be negative.").optional(),
  weightUnit: z.enum(["kg", "lbs"]),
  weight_kg: z.coerce.number().positive("Weight must be positive.").optional(),
  weight_lbs: z.coerce.number().positive("Weight must be positive.").optional(),
}).superRefine((values, context) => {
  if (values.heightUnit === "cm" && !values.height_cm) {
    context.addIssue({ code: "custom", path: ["height_cm"], message: "Height must be positive." });
  }
  if (values.heightUnit === "ft_in" && !values.height_ft) {
    context.addIssue({ code: "custom", path: ["height_ft"], message: "Feet must be positive." });
  }
  if (values.weightUnit === "kg" && !values.weight_kg) {
    context.addIssue({ code: "custom", path: ["weight_kg"], message: "Weight must be positive." });
  }
  if (values.weightUnit === "lbs" && !values.weight_lbs) {
    context.addIssue({ code: "custom", path: ["weight_lbs"], message: "Weight must be positive." });
  }
});

type BasicProfileInput = z.input<typeof schema>;
type BasicProfileValues = z.output<typeof schema>;

export function BasicProfileForm({ sectionIndex, onSaved, initialData, profileMode, onNextSection }: SetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useSetupNavigation(sectionIndex);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BasicProfileInput, unknown, BasicProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: typeof initialData?.name === "string" ? initialData.name : undefined,
      age: typeof initialData?.age === "number" ? initialData.age : undefined,
      heightUnit: "cm",
      height_cm: typeof initialData?.height_cm === "number" ? initialData.height_cm : undefined,
      weightUnit: "kg",
      weight_kg: typeof initialData?.weight_kg === "number" ? initialData.weight_kg : undefined,
    },
  });

  useEffect(() => {
    if (!initialData) {
      return;
    }

    reset({
      name: typeof initialData.name === "string" ? initialData.name : undefined,
      age: typeof initialData.age === "number" ? initialData.age : undefined,
      heightUnit: "cm",
      height_cm: typeof initialData.height_cm === "number" ? initialData.height_cm : undefined,
      weightUnit: "kg",
      weight_kg: typeof initialData.weight_kg === "number" ? initialData.weight_kg : undefined,
    });
  }, [initialData, reset]);

  const heightUnit = watch("heightUnit");
  const weightUnit = watch("weightUnit");

  async function onSubmit(values: BasicProfileValues) {
    setLoading(true);
    setError(null);
    const heightCm =
      values.heightUnit === "cm"
        ? values.height_cm
        : ((values.height_ft ?? 0) * 12 + (values.height_in ?? 0)) * 2.54;
    const weightKg =
      values.weightUnit === "kg" ? values.weight_kg : (values.weight_lbs ?? 0) * 0.45359237;

    try {
      const data = {
        name: values.name,
        age: values.age,
        height_cm: heightCm,
        weight_kg: weightKg,
      };
      const result = await saveSetupSection("basic_profile", data);
      onSaved("basic_profile", result.setupProgress, data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this section.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupFormShell
      title="Basic profile"
      description="Tell Karigai the basics used for wellness estimates."
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onSkip={navigation.skip}
      onNext={onNextSection ?? navigation.goNext}
      profileMode={profileMode}
    >
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Age" type="number" error={errors.age?.message} {...register("age")} />
        <div className="space-y-3">
          <RadioGroup
            value={heightUnit}
            options={[
              { value: "cm", label: "Centimetres" },
              { value: "ft_in", label: "Feet + inches" },
            ]}
            onChange={(value) => setValue("heightUnit", value as BasicProfileInput["heightUnit"])}
          />
          {heightUnit === "cm" ? (
            <Input
              label="Height"
              type="number"
              hint="Used to calculate your wellness estimates."
              error={errors.height_cm?.message}
              {...register("height_cm")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Feet" type="number" error={errors.height_ft?.message} {...register("height_ft")} />
              <Input label="Inches" type="number" error={errors.height_in?.message} {...register("height_in")} />
            </div>
          )}
        </div>
        <div className="space-y-3">
          <RadioGroup
            value={weightUnit}
            options={[
              { value: "kg", label: "Kilograms" },
              { value: "lbs", label: "Pounds" },
            ]}
            onChange={(value) => setValue("weightUnit", value as BasicProfileInput["weightUnit"])}
          />
          {weightUnit === "kg" ? (
            <Input
              label="Weight"
              type="number"
              hint="Used to calculate your wellness estimates."
              error={errors.weight_kg?.message}
              {...register("weight_kg")}
            />
          ) : (
            <Input
              label="Weight"
              type="number"
              hint="Used to calculate your wellness estimates."
              error={errors.weight_lbs?.message}
              {...register("weight_lbs")}
            />
          )}
        </div>
      </div>
      <FieldError message={error ?? undefined} />
    </SetupFormShell>
  );
}
