"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  Dumbbell,
  Heart,
  Moon,
  Ruler,
  Target,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BasicProfileForm } from "@/components/features/setup/BasicProfileForm";
import { BodyMetricsForm } from "@/components/features/setup/BodyMetricsForm";
import { CycleInfoForm } from "@/components/features/setup/CycleInfoForm";
import { DietPreferenceForm } from "@/components/features/setup/DietPreferenceForm";
import { FastingPreferenceForm } from "@/components/features/setup/FastingPreferenceForm";
import { FitnessPreferenceForm } from "@/components/features/setup/FitnessPreferenceForm";
import { GoalsForm } from "@/components/features/setup/GoalsForm";
import { HealthContextForm } from "@/components/features/setup/HealthContextForm";
import type { SetupSectionKey } from "@/components/features/setup/setup-shared";
import { Card, Chip, Eyebrow, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { formatHealthLabel } from "@/lib/format-labels";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProfileRow = Record<string, unknown> | null;

type ProfilePayload = {
  user?: { email?: string };
  setupProgress: number;
  profile: ProfileRow;
  bodyMetrics: ProfileRow;
  healthContext: ProfileRow;
  cycleProfile: ProfileRow;
  dietPreferences: ProfileRow;
  fastingPreferences: ProfileRow;
  fitnessPreferences: ProfileRow;
  goals: ProfileRow;
};

type SectionConfig = {
  key: SetupSectionKey;
  label: string;
  subtitle: string;
  icon: typeof User;
};

const sections: SectionConfig[] = [
  { key: "basic_profile", label: "Basic profile", subtitle: "Name, age, height, and weight.", icon: User },
  { key: "body_metrics", label: "Body metrics", subtitle: "Measurements used for wellness estimates.", icon: Ruler },
  { key: "health_context", label: "Health context", subtitle: "Conditions and safety-aware personalisation.", icon: Heart },
  { key: "cycle_profile", label: "Cycle information", subtitle: "Cycle dates, regularity, and symptoms.", icon: Moon },
  { key: "diet_preferences", label: "Diet preferences", subtitle: "Diet type, cuisine, and restrictions.", icon: UtensilsCrossed },
  { key: "fasting_preferences", label: "Fasting preferences", subtitle: "Eating window and fasting safety context.", icon: Clock },
  { key: "fitness_preferences", label: "Fitness preferences", subtitle: "Access, level, and workout rhythm.", icon: Dumbbell },
  { key: "goals", label: "Goals", subtitle: "Primary goal and supporting targets.", icon: Target },
];

function rowForSection(data: ProfilePayload | undefined, section: SetupSectionKey): ProfileRow {
  if (!data) {
    return null;
  }

  const map: Record<SetupSectionKey, ProfileRow> = {
    basic_profile: data.profile,
    body_metrics: { ...(data.bodyMetrics ?? {}), target_weight_kg: data.goals?.target_weight_kg },
    health_context: data.healthContext,
    cycle_profile: data.cycleProfile,
    diet_preferences: data.dietPreferences,
    fasting_preferences: data.fastingPreferences,
    fitness_preferences: data.fitnessPreferences,
    goals: data.goals,
  };

  return map[section];
}

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isComplete(section: SetupSectionKey, row: ProfileRow) {
  if (!row) {
    return false;
  }

  switch (section) {
    case "basic_profile":
      return hasText(row.name) && hasNumber(row.height_cm);
    case "body_metrics":
      return hasNumber(row.waist_cm);
    case "cycle_profile":
      return hasText(row.last_period_start);
    case "diet_preferences":
      return hasText(row.diet_type);
    case "fitness_preferences":
      return hasNumber(row.workout_days_per_week);
    case "goals":
      return hasText(row.primary_goal);
    case "health_context":
    case "fasting_preferences":
      return Object.keys(row).length > 0;
  }
}

function updatedAt(row: ProfileRow) {
  const value = row?.updated_at ?? row?.created_at ?? row?.date;
  if (typeof value !== "string") {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function savedHealthChips(row: ProfileRow) {
  if (!row) {
    return [];
  }

  return Object.entries(row)
    .filter(([key, value]) => key.startsWith("has_") && value === true)
    .map(([key]) => formatHealthLabel(key))
    .filter(Boolean)
    .slice(0, 5);
}

async function fetchProfile() {
  const response = await fetch("/api/profile", { credentials: "include" });
  const payload = (await response.json()) as ProfilePayload | { error: string };

  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error : "Unable to load profile.");
  }

  return payload;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SetupSectionKey>("basic_profile");
  const { data, isLoading, error } = useQuery({ queryKey: ["profile", user?.id ?? "guest"], queryFn: fetchProfile });
  const activeConfig = sections.find((section) => section.key === activeSection) ?? sections[0];
  const activeRow = rowForSection(data, activeSection);
  const activeUpdatedAt = updatedAt(activeRow);
  const name = typeof data?.profile?.name === "string" ? data.profile.name : "";
  const initial = name.trim().charAt(0).toUpperCase();
  const email = data?.user?.email ?? "Not available";
  const progress = data?.setupProgress ?? 0;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function onSaved(_section: SetupSectionKey) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profile"] }),
      queryClient.invalidateQueries({ queryKey: ["setupProgress"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  }

  function nextSection() {
    const index = sections.findIndex((section) => section.key === activeSection);
    setActiveSection(sections[Math.min(index + 1, sections.length - 1)].key);
  }

  function renderForm() {
    const common = {
      profileMode: true,
      onSaved,
      onNextSection: nextSection,
      initialData: activeRow,
    };

    switch (activeSection) {
      case "basic_profile":
        return <BasicProfileForm sectionIndex={1} {...common} />;
      case "body_metrics":
        return <BodyMetricsForm sectionIndex={2} {...common} />;
      case "health_context":
        return <HealthContextForm sectionIndex={3} {...common} />;
      case "cycle_profile":
        return <CycleInfoForm sectionIndex={4} {...common} />;
      case "diet_preferences":
        return <DietPreferenceForm sectionIndex={5} {...common} />;
      case "fasting_preferences":
        return <FastingPreferenceForm sectionIndex={6} healthContext={data?.healthContext ?? undefined} {...common} />;
      case "fitness_preferences":
        return <FitnessPreferenceForm sectionIndex={7} {...common} />;
      case "goals":
        return <GoalsForm sectionIndex={8} {...common} />;
    }
  }

  return (
    <div className="min-h-full bg-paper px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
        <div>
          <Eyebrow>account</Eyebrow>
          <h1 className="mt-1 font-display text-3xl italic text-ink">Profile</h1>
          <p className="mt-1 font-body text-sm text-muted">Edit the context Karigai uses to personalise your plan.</p>
        </div>

        {isLoading ? <SkeletonCard /> : null}
        {error ? <Card className="font-body text-sm text-alert">Unable to load profile data. Please refresh and try again.</Card> : null}

        {data ? (
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <Card className="p-5">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-clay/15 font-display text-2xl italic text-clay">
                    {initial || <User className="size-6" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-xl italic text-ink">{name || "Your profile"}</p>
                    <p className="mt-1 truncate font-mono text-[10px] text-muted">{email}</p>
                    <Chip tone="sage" className="mt-2 h-6 px-2 font-mono text-[10px]">{progress}% complete</Chip>
                  </div>
                </motion.div>
                <button type="button" data-cursor-hover onClick={() => void signOut()} className="mt-5 font-mono text-[10px] text-muted underline hover:text-alert">
                  Sign out
                </button>
              </Card>

              <Card className="p-3">
                <div className="space-y-1">
                  {sections.map((section) => {
                    const complete = isComplete(section.key, rowForSection(data, section.key));
                    const active = section.key === activeSection;
                    const Icon = section.icon;

                    return (
                      <button
                        key={section.key}
                        type="button"
                        data-cursor-hover
                        onClick={() => setActiveSection(section.key)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          active ? "bg-clay/10 text-ink" : "text-muted hover:bg-shell/60 hover:text-ink2",
                        )}
                      >
                        <span className="relative flex size-5 items-center justify-center">
                          {active ? <span className="absolute size-5 animate-ping rounded-full border border-clay/40" /> : null}
                          <span className={cn("flex size-4 items-center justify-center rounded-full border text-[9px]", complete ? "border-clay bg-clay text-cream" : active ? "border-clay bg-card" : "border-hairline bg-card")}>
                            {complete ? "✓" : ""}
                          </span>
                        </span>
                        <Icon className={cn("size-4", active || complete ? "text-clay" : "text-muted")} />
                        <span className="font-body text-sm">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </aside>

            <main className="min-w-0">
              <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-shell/40 p-4">
                <div className="flex items-center gap-3">
                  <activeConfig.icon className="size-6 text-clay" />
                  <div>
                    <h2 className="font-display text-2xl italic text-ink">{activeConfig.label}</h2>
                    <p className="font-body text-sm text-muted">{activeConfig.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  {isComplete(activeSection, activeRow) ? <Chip tone="sage" className="h-6 px-2 font-mono text-[10px]">✓ Saved</Chip> : null}
                  {activeUpdatedAt ? <p className="mt-1 font-mono text-[9px] text-muted">Last saved: {activeUpdatedAt}</p> : null}
                </div>
              </Card>

              {activeSection === "health_context" && savedHealthChips(activeRow).length > 0 ? (
                <Card className="mb-4 bg-clay/5 p-4">
                  <p className="font-body text-xs text-muted">Saved context</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {savedHealthChips(activeRow).map((chip) => <Chip key={chip} tone="clay">{chip}</Chip>)}
                  </div>
                </Card>
              ) : null}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                >
                  {renderForm()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        ) : null}
      </div>
    </div>
  );
}
