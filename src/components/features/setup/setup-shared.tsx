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
  initialData?: Record<string, unknown> | null;
  profileMode?: boolean;
  onNextSection?: () => void;
};

export type Option = {
  value: string;
  label: string;
};

function sanitizeForJSON(data: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }

    if (typeof value === "number" && (!Number.isFinite(value) || Number.isNaN(value))) {
      continue;
    }

    if (value instanceof Date) {
      clean[key] = value.toISOString();
      continue;
    }

    clean[key] = value;
  }

  return clean;
}

export async function saveSetupSection(section: SetupSectionKey, data: Record<string, unknown>) {
  console.log("[saveSetupSection] called with section:", section);
  console.log("[saveSetupSection] data:", JSON.stringify(data, null, 2));

  try {
    const authenticated = await ensureAuthenticated("signup");
    if (!authenticated) {
      throw new Error("Authentication required.");
    }

    const sanitizedData = sanitizeForJSON(data);
    const response = await fetch("/api/setup", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ section, data: sanitizedData }),
    });

    console.log("[saveSetupSection] response status:", response.status);

    const text = await response.text();
    let payload: SaveResult | { error: string; debug?: string };

    try {
      payload = JSON.parse(text) as SaveResult | { error: string; debug?: string };
    } catch (parseError) {
      console.error("[saveSetupSection] response was not JSON:", text.slice(0, 500));
      console.error("[saveSetupSection] JSON parse error:", parseError);
      throw new Error("Server returned an unexpected response. Check the console.");
    }

    console.log("[saveSetupSection] response body:", payload);

    if (!response.ok || "error" in payload) {
      console.error("[saveSetupSection] API error:", payload);
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      throw new Error("error" in payload ? payload.error : `HTTP ${response.status}`);
    }

    useToastStore.getState().addToast("Saved ✓", "success");
    return payload;
  } catch (error) {
    console.error("[saveSetupSection] caught error:", error);
    console.error("[saveSetupSection] error message:", error instanceof Error ? error.message : String(error));
    console.error("[saveSetupSection] error stack:", error instanceof Error ? error.stack : undefined);
    throw error;
  }
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
  profileMode,
}: {
  title: string;
  description: string;
  children: ReactNode;
  loading?: boolean;
  onSubmit: () => void;
  onSkip: () => void;
  onNext: () => void;
  profileMode?: boolean;
}) {
  return (
    <Card padding="lg" className="space-y-6 shadow-[0_2px_16px_rgba(31,27,22,0.05)]">
      <div>
        <h2 className="font-display text-3xl italic text-ink">{title}</h2>
        <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
      <div className="flex flex-wrap gap-3 border-t border-hairline pt-5">
        <Button type="button" variant="accent" onClick={onSubmit} loading={loading}>
          {profileMode ? "Save changes" : "Save section"}
        </Button>
        {profileMode ? null : (
          <Button type="button" variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        )}
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
