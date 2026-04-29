"use client";

import { Suspense, useMemo, useState } from "react";
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
import { Card, PageHeader, ProgressRing } from "@/components/ui";
import { cn } from "@/lib/utils";

type SetupSection = {
  index: number;
  key: SetupSectionKey;
  label: string;
};

type SetupProgressResponse = {
  setupProgress: number;
  completedSections: SetupSectionKey[];
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
  const response = await fetch("/api/setup/progress");
  if (!response.ok) {
    throw new Error("Unable to load onboarding progress.");
  }
  return (await response.json()) as SetupProgressResponse;
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
  onSelect,
}: {
  activeSection: number;
  completedSections: Set<SetupSectionKey>;
  progress: number;
  onSelect: (section: number) => void;
}) {
  const completeCount = completedSections.size;

  return (
    <Card className="sticky top-8 rounded-2xl border border-hairline bg-card p-7 shadow-[0_2px_16px_rgba(31,27,22,0.06)]" padding="sm">
      <div className="flex flex-col items-center">
        <ProgressRing value={progress / 100} size={110} stroke={7} label={`${progress}%`} sublabel="done" />
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {completeCount} of {sections.length} sections complete
        </p>
      </div>

      <nav className="mt-6 flex flex-col">
        {sections.map((section, index) => {
          const complete = completedSections.has(section.key);
          const active = section.index === activeSection;
          const status = complete ? "complete" : active ? "active" : "incomplete";

          return (
            <div key={section.key} className="flex flex-col items-start">
              <button
                type="button"
                data-cursor-hover
                onClick={() => onSelect(section.index)}
                className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left transition-colors duration-150 hover:bg-shell/70"
              >
                <StepIndicator status={status} />
                <span
                  className={cn(
                    "font-body text-sm",
                    status === "complete" && "font-medium text-ink",
                    status === "active" && "font-semibold text-clay",
                    status === "incomplete" && "text-muted",
                  )}
                >
                  {section.label}
                </span>
                {status === "complete" ? (
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-sage">done</span>
                ) : null}
              </button>
              {index < sections.length - 1 ? (
                <div className="ml-[9px] h-7 w-[2px] overflow-hidden bg-hairline">
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
  const searchParams = useSearchParams();
  const activeSection = sectionFromParam(searchParams.get("section"));
  const [healthContext, setHealthContext] = useState<Record<string, unknown>>({});
  const { data: progressData } = useQuery({
    queryKey: ["setupProgress"],
    queryFn: fetchSetupProgress,
  });

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
        void queryClient.invalidateQueries({ queryKey: ["setupProgress"] });
        const nextSection = Math.min(activeSection + 1, sections.length);
        if (nextSection !== activeSection) {
          router.push(`/app/setup?section=${nextSection}`);
        }
      },
      healthContext,
    }),
    [activeSection, healthContext, queryClient, router],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="onboarding"
        title="Onboarding"
        subtitle="Share what you know now, skip anything you want to answer later, and keep exploring Karigai at any time."
      />
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <SetupNav
          activeSection={activeSection}
          completedSections={completedSections}
          progress={progress}
          onSelect={(section) => router.push(`/app/setup?section=${section}`)}
        />
        <div>
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
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<PageHeader eyebrow="onboarding" title="Onboarding" subtitle="Loading onboarding..." />}>
      <SetupPageContent />
    </Suspense>
  );
}
