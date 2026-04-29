"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Badge, Card, Chip, EmptyState, PageHeader, SafetyBanner, SkeletonCard, StatDisplay } from "@/components/ui";

type AnalysisResponse = {
  bmi?: number;
  bmiCategory?: string;
  whr?: number;
  bri?: number;
  bmr?: number;
  tdee?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  waterTargetMl?: number;
  cyclePhase?: string;
  cycleDay?: number;
  cycleConfidence?: "low" | "medium" | "high";
  nextPeriodEstimate?: string;
  goalSummary?: string;
  setupProgress: number;
  missingDataFor: string[];
};

const metricHelp: Record<string, string> = {
  BMI: "BMI compares weight and height. It is a broad wellness estimate, not a diagnosis.",
  WHR: "Waist-to-hip ratio estimates body shape context from waist and hip measurements.",
  BRI: "Body roundness index estimates shape context using waist and height.",
  BMR: "Basal metabolic rate estimates energy your body may use at rest.",
  TDEE: "Total daily energy expenditure estimates daily energy needs after activity.",
  "Calorie target": "This target is adjusted from TDEE based on your goal and safety context.",
  "Protein target": "Protein target estimates daily grams based on body weight and goal.",
  "Water target": "Water target uses a simple body-weight hydration estimate.",
  "Cycle phase": "Cycle phase is estimated from your last period start and cycle length.",
  "Next period": "Next period estimate adds your average cycle length to your last period start.",
};

function confidenceTone(confidence?: string) {
  if (confidence === "high") {
    return "sage";
  }
  if (confidence === "low") {
    return "alert";
  }
  return "neutral";
}

function MetricCard({
  label,
  value,
  unit,
  sub,
  missing,
  children,
}: {
  label: string;
  value?: string | number;
  unit?: string;
  sub?: string;
  missing: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="min-h-48">
      {value === undefined ? (
        <EmptyState
          icon={<Activity className="size-7" />}
          title={`${label} unavailable`}
          body={missing}
          action={{ label: "Add data", onClick: () => window.location.assign("/app/setup") }}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <StatDisplay value={value} unit={unit} label={label} sub={sub} />
            {children}
          </div>
          <details className="mt-5 rounded-xl bg-shell p-3">
            <summary className="cursor-pointer font-body text-xs font-semibold text-ink2">What is this?</summary>
            <p className="mt-2 font-body text-xs leading-5 text-muted">{metricHelp[label]}</p>
          </details>
        </>
      )}
    </Card>
  );
}

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analysis")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load analysis.");
        }
        return response.json() as Promise<AnalysisResponse>;
      })
      .then(setData)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load analysis."),
      );
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="your wellness analysis"
        title="Analysis"
        subtitle="Calculated estimates from the context you have shared."
        action={<Link href="/app/setup" className="font-body text-sm text-clay">Update setup</Link>}
      />
      <SafetyBanner
        tone="info"
        title="Wellness estimates only"
        body="These metrics are calculated from self-reported data. They are not medical measurements or clinical values."
      />
      {error ? <SafetyBanner tone="alert" title="Analysis unavailable" body={error} /> : null}
      {!data && !error ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 10 }, (_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : null}
      {data ? (
        <>
          {data.missingDataFor.length ? (
            <Card className="flex flex-wrap items-center gap-2">
              <span className="font-body text-sm text-muted">Missing data for:</span>
              {data.missingDataFor.map((item) => <Badge key={item}>{item}</Badge>)}
            </Card>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="BMI" value={data.bmi} missing="Add height and weight in setup.">
              {data.bmiCategory ? <Chip tone="neutral">{data.bmiCategory}</Chip> : null}
            </MetricCard>
            <MetricCard label="WHR" value={data.whr} missing="Add waist and hip measurements." />
            <MetricCard label="BRI" value={data.bri} missing="Add waist measurement and height." />
            <MetricCard label="BMR" value={data.bmr} unit="kcal/day" missing="Add age, height, and weight." />
            <MetricCard label="TDEE" value={data.tdee} unit="kcal/day" missing="Add profile and fitness context." />
            <MetricCard label="Calorie target" value={data.calorieTarget} unit="kcal/day" sub={data.goalSummary} missing="Add profile and goal." />
            <MetricCard label="Protein target" value={data.proteinTarget} unit="g/day" missing="Add weight and goal." />
            <MetricCard label="Water target" value={data.waterTargetMl} unit="ml/day" missing="Add weight." />
            <MetricCard label="Cycle phase" value={data.cyclePhase} sub={data.cycleDay ? `day ${data.cycleDay}` : undefined} missing="Add cycle information.">
              <Chip tone={confidenceTone(data.cycleConfidence)}>{data.cycleConfidence ?? "unknown"}</Chip>
            </MetricCard>
            <MetricCard label="Next period" value={data.nextPeriodEstimate} missing="Add last period start." />
          </div>
        </>
      ) : null}
    </div>
  );
}
