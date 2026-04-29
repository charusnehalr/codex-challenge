"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { BodyMetricsForm } from "@/components/features/setup/BodyMetricsForm";
import { BasicProfileForm } from "@/components/features/setup/BasicProfileForm";
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

function sectionFromParam(value: string | null) {
  const parsed = Number(value ?? "1");
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8) {
    return 1;
  }

  return parsed;
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
  return (
    <Card className="sticky top-8 space-y-7" padding="lg">
      <div className="flex justify-center">
        <ProgressRing value={progress / 100} size={100} stroke={8} label={`${progress}%`} sublabel="setup" />
      </div>
      <nav className="space-y-1">
        {sections.map((section) => {
          const complete = completedSections.has(section.key);
          const active = section.index === activeSection;
          const indicator = complete ? "✓" : active ? "●" : "○";

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => onSelect(section.index)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-body text-sm transition",
                active ? "bg-claySoft/30 text-clay" : "text-muted hover:bg-shell hover:text-ink2",
              )}
            >
              <span className={complete || active ? "text-clay" : "text-muted"}>{indicator}</span>
              <span>{section.label}</span>
            </button>
          );
        })}
      </nav>
    </Card>
  );
}

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = sectionFromParam(searchParams.get("section"));
  const [completedSections, setCompletedSections] = useState<Set<SetupSectionKey>>(new Set());
  const [progress, setProgress] = useState(0);
  const [healthContext, setHealthContext] = useState<Record<string, unknown>>({});

  const activeKey = sections[activeSection - 1].key;
  const sharedProps = useMemo(
    () => ({
      sectionIndex: activeSection,
      onSaved: (section: SetupSectionKey, setupProgress: number, data: Record<string, unknown>) => {
        setCompletedSections((current) => new Set([...current, section]));
        setProgress(setupProgress);
        if (section === "health_context") {
          setHealthContext(data);
        }
      },
      healthContext,
    }),
    [activeSection, healthContext],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="setup"
        title="Personalise Karigai"
        subtitle="Save what you know now, skip anything you want to answer later, and keep access to the rest of the app."
      />
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
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
    <Suspense fallback={<PageHeader eyebrow="setup" title="Personalise Karigai" subtitle="Loading setup..." />}>
      <SetupPageContent />
    </Suspense>
  );
}
