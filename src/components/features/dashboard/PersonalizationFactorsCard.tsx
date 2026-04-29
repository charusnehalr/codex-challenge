import Link from "next/link";
import { Card, Chip, Eyebrow } from "@/components/ui";
import type { DashboardResponse } from "@/types/dashboard";

function FactorRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-hairline py-2 last:border-0">
      <span className="font-body text-xs text-muted">{label}</span>
      <div className="flex max-w-[65%] flex-wrap justify-end gap-1.5">{children}</div>
    </div>
  );
}

export function PersonalizationFactorsCard({
  progress,
  factors,
}: {
  progress: number;
  factors: DashboardResponse["personalizationFactors"];
}) {
  const locked = progress < 30;

  return (
    <Card className="min-h-48">
      <Eyebrow>what karigai considered today</Eyebrow>
      <div className="mt-4 space-y-1">
        {locked ? (
          <div className="rounded-xl bg-shell p-4 font-body text-sm text-muted">
            <Link href="/app/setup" className="text-clay">
              Set up to unlock →
            </Link>
          </div>
        ) : (
          <>
            <FactorRow label="Cycle phase">
              {factors.cyclePhase ? <Chip tone="sage">{factors.cyclePhase}</Chip> : <span className="text-xs text-muted">none</span>}
            </FactorRow>
            <FactorRow label="Goal">
              {factors.goal ? <Chip tone="clay">{factors.goal}</Chip> : <span className="text-xs text-muted">none</span>}
            </FactorRow>
            <FactorRow label="Diet">
              {factors.dietType ? <Chip tone="bone">{factors.dietType}</Chip> : <span className="text-xs text-muted">none</span>}
            </FactorRow>
            <FactorRow label="Health context">
              {factors.healthContext.length ? (
                factors.healthContext.map((item) => <Chip key={item} tone="blush">{item}</Chip>)
              ) : (
                <span className="text-xs text-muted">none</span>
              )}
            </FactorRow>
            <FactorRow label="Fasting">
              {factors.fasting ? <Chip tone="neutral">{factors.fasting}</Chip> : <span className="text-xs text-muted">none</span>}
            </FactorRow>
            <FactorRow label="Workout access">
              {factors.fitnessOptions.length ? (
                factors.fitnessOptions.map((item) => <Chip key={item} tone="sage">{item}</Chip>)
              ) : (
                <span className="text-xs text-muted">none</span>
              )}
            </FactorRow>
            <FactorRow label="Today's symptoms">
              {factors.symptomsToday.length ? (
                factors.symptomsToday.map((item) => <Chip key={item} tone="alert">{item}</Chip>)
              ) : (
                <span className="font-body text-xs text-muted">none logged</span>
              )}
            </FactorRow>
          </>
        )}
      </div>
      <p className="mt-4 font-display text-lg italic text-clay">This is what makes your plan yours.</p>
    </Card>
  );
}
