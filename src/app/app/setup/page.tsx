"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { BasicProfileForm } from "@/components/features/setup/BasicProfileForm";
import { BodyMetricsForm } from "@/components/features/setup/BodyMetricsForm";
import { CycleInfoForm } from "@/components/features/setup/CycleInfoForm";
import { DietPreferenceForm } from "@/components/features/setup/DietPreferenceForm";
import { FastingPreferenceForm } from "@/components/features/setup/FastingPreferenceForm";
import { FitnessPreferenceForm } from "@/components/features/setup/FitnessPreferenceForm";
import { GoalsForm } from "@/components/features/setup/GoalsForm";
import { HealthContextForm } from "@/components/features/setup/HealthContextForm";
import type { SetupSectionKey } from "@/components/features/setup/setup-shared";
import { Button, Card, ProgressRing } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { formatHealthLabel } from "@/lib/format-labels";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal.store";

type SetupSection = {
  index: number;
  key: SetupSectionKey;
  label: string;
};

type SetupProgressResponse = {
  setupProgress: number;
  completedSections: SetupSectionKey[];
};

type ProfilePayload = {
  profile: Record<string, unknown> | null;
  bodyMetrics: Record<string, unknown> | null;
  healthContext: Record<string, unknown> | null;
  cycleProfile: Record<string, unknown> | null;
  dietPreferences: Record<string, unknown> | null;
  fastingPreferences: Record<string, unknown> | null;
  fitnessPreferences: Record<string, unknown> | null;
  goals: Record<string, unknown> | null;
};

const sections: SetupSection[] = [
  { index: 1, key: "basic_profile", label: "Basic profile" },
  { index: 2, key: "body_metrics", label: "Body metrics" },
  { index: 3, key: "health_context", label: "Health context" },
  { index: 4, key: "cycle_profile", label: "Cycle info" },
  { index: 5, key: "diet_preferences", label: "Diet preferences" },
  { index: 6, key: "fasting_preferences", label: "Fasting preferences" },
  { index: 7, key: "fitness_preferences", label: "Fitness preferences" },
  { index: 8, key: "goals", label: "Goals" },
];

async function fetchSetupProgress() {
  const response = await fetch("/api/setup/progress", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Unable to load onboarding progress.");
  }
  return (await response.json()) as SetupProgressResponse;
}

async function fetchProfileData() {
  const response = await fetch("/api/profile", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Unable to load saved setup data.");
  }
  return (await response.json()) as ProfilePayload;
}

function rowForSection(data: ProfilePayload | undefined, section: SetupSectionKey) {
  if (!data) {
    return null;
  }

  const map: Record<SetupSectionKey, Record<string, unknown> | null> = {
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

function sectionPreview(section: SetupSectionKey, row: Record<string, unknown> | null) {
  if (!row) {
    return "";
  }

  if (section === "basic_profile") {
    return [row.name, row.age, typeof row.height_cm === "number" ? `${row.height_cm}cm` : ""].filter(Boolean).join(" · ");
  }

  if (section === "diet_preferences") {
    return [typeof row.diet_type === "string" ? formatHealthLabel(row.diet_type) : "", row.cuisine_preference].filter(Boolean).join(" · ");
  }

  if (section === "goals" && typeof row.primary_goal === "string") {
    return formatHealthLabel(row.primary_goal);
  }

  if (section === "fitness_preferences") {
    return [row.fitness_level, typeof row.workout_days_per_week === "number" ? `${row.workout_days_per_week} days` : ""].filter(Boolean).join(" · ");
  }

  if (section === "cycle_profile" && typeof row.last_period_start === "string") {
    return `Last period ${formatShortDate(row.last_period_start)}`;
  }

  return "";
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function sectionFromParam(value: string | null) {
  const parsed = Number(value ?? "1");
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8) {
    return 1;
  }

  return parsed;
}

function StepIndicator({
  status,
}: {
  status: "complete" | "active" | "incomplete";
}) {
  if (status === "complete") {
    return (
      <span className="grid size-5 place-items-center rounded-full bg-clay text-cream shadow-[0_0_0_3px_rgba(184,112,79,0.2)]">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  }

  if (status === "active") {
    return (
      <span className="ring-pulse grid size-5 place-items-center rounded-full border-2 border-clay bg-claySoft/30">
        <span className="size-2 rounded-full bg-clay" />
      </span>
    );
  }

  return <span className="size-5 rounded-full border-2 border-hairline bg-card" />;
}

function SetupNav({
  activeSection,
  completedSections,
  progress,
  profileData,
  onSelect,
}: {
  activeSection: number;
  completedSections: Set<SetupSectionKey>;
  progress: number;
  profileData?: ProfilePayload;
  onSelect: (section: number) => void;
}) {
  const completeCount = completedSections.size;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-card p-5 shadow-[0_2px_16px_rgba(31,27,22,0.06)]" padding="sm" interactive={false}>
      <div className="flex shrink-0 flex-col items-center">
        <ProgressRing value={progress / 100} size={100} stroke={7} label={`${progress}%`} sublabel="done" />
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          {completeCount} of {sections.length} sections complete
        </p>
      </div>

      <nav className="mt-4 flex-1 overflow-hidden">
        {sections.map((section, index) => {
          const complete = completedSections.has(section.key);
          const active = section.index === activeSection;
          const status = complete ? "complete" : active ? "active" : "incomplete";

          const preview = sectionPreview(section.key, rowForSection(profileData, section.key));

          return (
            <div key={section.key} className="flex flex-col items-start">
              <button
                type="button"
                data-cursor-hover
                onClick={() => onSelect(section.index)}
                className={cn(
                  "flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors duration-150 hover:bg-shell/70",
                  active && "border-l-2 border-clay bg-clay/5",
                )}
              >
                <StepIndicator status={status} />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate font-body text-sm",
                      status === "complete" && "font-medium text-ink",
                      status === "active" && "font-semibold text-clay",
                      status === "incomplete" && "text-muted",
                    )}
                  >
                    {section.label}
                  </span>
                  {preview && complete ? <span className="mt-0.5 block truncate font-mono text-[10px] text-muted">{preview}</span> : null}
                </span>
                {status === "complete" ? (
                  <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-widest text-sage">✓ done</span>
                ) : null}
              </button>
              {index < sections.length - 1 ? (
                <div className="ml-[17px] h-3 w-[2px] overflow-hidden bg-hairline">
                  {complete ? (
                    <motion.div
                      className="h-full w-full bg-clay"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{ transformOrigin: "top" }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </Card>
  );
}

function SetupPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const openModal = useAuthModalStore((state) => state.openModal);
  const searchParams = useSearchParams();
  const activeSection = sectionFromParam(searchParams.get("section"));
  const [healthContext, setHealthContext] = useState<Record<string, unknown>>({});
  const { data: progressData } = useQuery({
    queryKey: ["setupProgress"],
    queryFn: fetchSetupProgress,
  });
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfileData,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated) {
      void queryClient.invalidateQueries({ queryKey: ["setupProgress"] });
    }
  }, [isAuthenticated, queryClient]);

  const completedSections = useMemo(
    () => new Set(progressData?.completedSections ?? []),
    [progressData?.completedSections],
  );
  const progress = progressData?.setupProgress ?? 0;
  const activeKey = sections[activeSection - 1].key;
  const sharedProps = useMemo(
    () => ({
      sectionIndex: activeSection,
      onSaved: (section: SetupSectionKey, _setupProgress: number, data: Record<string, unknown>) => {
        if (section === "health_context") {
          setHealthContext(data);
        }
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ["setupProgress"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          queryClient.invalidateQueries({ queryKey: ["profile"] }),
        ]);
        const nextSection = Math.min(activeSection + 1, sections.length);
        if (nextSection !== activeSection) {
          window.setTimeout(() => router.push(`/app/setup?section=${nextSection}`), 800);
        }
      },
      healthContext,
      initialData: rowForSection(profileData, activeKey),
    }),
    [activeKey, activeSection, healthContext, profileData, queryClient, router],
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden">
      <div className="mb-4 flex shrink-0 items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted">onboarding</p>
          <h1 className="mt-0.5 font-display text-3xl leading-tight text-ink">Onboarding</h1>
        </div>
        <p className="whitespace-nowrap font-body text-xs text-muted">Save what you know · skip anything · edit anytime</p>
      </div>
      {!authLoading && !isAuthenticated ? (
        <Card className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl text-ink">Sign in to save onboarding</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-muted">
              You can preview Karigai freely, but onboarding progress is saved to your account.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => openModal("login")}>Sign in</Button>
            <Button variant="accent" onClick={() => openModal("signup")}>Create account</Button>
          </div>
        </Card>
      ) : null}
      {isAuthenticated ? (
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="min-h-0 overflow-hidden">
          <SetupNav
            activeSection={activeSection}
            completedSections={completedSections}
            progress={progress}
            profileData={profileData}
            onSelect={(section) => router.push(`/app/setup?section=${section}`)}
          />
        </div>
        <div className="min-h-0 min-w-0 overflow-hidden">
          <div className="h-full">
            {activeKey === "basic_profile" ? <BasicProfileForm {...sharedProps} /> : null}
            {activeKey === "body_metrics" ? <BodyMetricsForm {...sharedProps} /> : null}
            {activeKey === "health_context" ? <HealthContextForm {...sharedProps} /> : null}
            {activeKey === "cycle_profile" ? <CycleInfoForm {...sharedProps} /> : null}
            {activeKey === "diet_preferences" ? <DietPreferenceForm {...sharedProps} /> : null}
            {activeKey === "fasting_preferences" ? <FastingPreferenceForm {...sharedProps} /> : null}
            {activeKey === "fitness_preferences" ? <FitnessPreferenceForm {...sharedProps} /> : null}
            {activeKey === "goals" ? <GoalsForm {...sharedProps} /> : null}
          </div>
        </div>
      </div>
      ) : null}
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="font-body text-sm text-muted">Loading onboarding...</div>}>
      <SetupPageContent />
    </Suspense>
  );
}
