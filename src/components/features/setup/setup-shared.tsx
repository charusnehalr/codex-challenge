"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button, Card, Checkbox, Chip } from "@/components/ui";
import { ensureAuthenticated } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast.store";

export type SetupSectionKey =
  | "basic_profile"
  | "body_metrics"
  | "health_context"
  | "cycle_profile"
  | "diet_preferences"
  | "fasting_preferences"
  | "fitness_preferences"
  | "goals";

export type SaveResult = {
  success: boolean;
  setupProgress: number;
};

export type SetupFormProps = {
  sectionIndex: number;
  onSaved: (section: SetupSectionKey, setupProgress: number, data: Record<string, unknown>) => void;
  healthContext?: Record<string, unknown>;
};

export type Option = {
  value: string;
  label: string;
};

export async function saveSetupSection(section: SetupSectionKey, data: Record<string, unknown>) {
  const authenticated = await ensureAuthenticated("signup");
  if (!authenticated) {
    throw new Error("");
  }

  const response = await fetch("/api/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ section, data }),
  });

  const payload = (await response.json()) as SaveResult | { error: string };

  if (!response.ok || "error" in payload) {
    useToastStore.getState().addToast("Something went wrong. Try again.", "error");
    throw new Error("error" in payload ? payload.error : "Unable to save this section.");
  }

  useToastStore.getState().addToast("Saved ✓", "success");
  return payload;
}

export function useSetupNavigation(sectionIndex: number) {
  const router = useRouter();
  const next = Math.min(sectionIndex + 1, 8);

  return {
    goNext: () => router.push(`/app/setup?section=${next}`),
    skip: () => router.push(`/app/setup?section=${next}`),
  };
}

export function SetupFormShell({
  title,
  description,
  children,
  loading,
  onSubmit,
  onSkip,
  onNext,
}: {
  title: string;
  description: string;
  children: ReactNode;
  loading?: boolean;
  onSubmit: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-ink">{title}</h2>
        <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
      <div className="flex flex-wrap gap-3 border-t border-hairline pt-5">
        <Button type="button" onClick={onSubmit} loading={loading}>
          Save section
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button type="button" variant="ghost" onClick={onNext}>
          Next <span aria-hidden="true">→</span>
        </Button>
      </div>
    </Card>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 font-body text-xs text-alert">{message}</p> : null;
}

export function RadioGroup({
  value,
  options,
  onChange,
}: {
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-chip border px-3 py-2 font-body text-xs font-medium transition",
            value === option.value
              ? "border-clay bg-claySoft text-ink"
              : "border-hairline bg-card text-muted hover:bg-shell hover:text-ink2",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function CheckboxGrid({
  values,
  options,
  onChange,
}: {
  values: Record<string, boolean>;
  options: Option[];
  onChange: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          checked={Boolean(values[option.value])}
          onChange={(checked) => onChange(option.value, checked)}
          tone="clay"
        />
      ))}
    </div>
  );
}

export function ChipMultiSelect({
  values,
  options,
  onChange,
}: {
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);

        return (
          <button
            key={option}
            type="button"
            onClick={() =>
              onChange(selected ? values.filter((value) => value !== option) : [...values, option])
            }
          >
            <Chip tone={selected ? "clay" : "neutral"}>{option}</Chip>
          </button>
        );
      })}
    </div>
  );
}
