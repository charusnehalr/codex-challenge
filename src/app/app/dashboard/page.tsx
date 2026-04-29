"use client";

import { AIInsightCard } from "@/components/features/dashboard/AIInsightCard";
import { ChecklistCard } from "@/components/features/dashboard/ChecklistCard";
import { CyclePhaseCard } from "@/components/features/dashboard/CyclePhaseCard";
import { EnergyCheckInCard } from "@/components/features/dashboard/EnergyCheckInCard";
import { NutritionProgressCard } from "@/components/features/dashboard/NutritionProgressCard";
import { PersonalizationFactorsCard } from "@/components/features/dashboard/PersonalizationFactorsCard";
import { SetupProgressCard } from "@/components/features/dashboard/SetupProgressCard";
import { WaterProgressCard } from "@/components/features/dashboard/WaterProgressCard";
import { WorkoutTodayCard } from "@/components/features/dashboard/WorkoutTodayCard";
import { QueryError, SkeletonCard } from "@/components/ui";
import { useDashboard } from "@/hooks/useDashboard";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><SkeletonCard /></div>
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="font-display text-4xl text-ink">{greeting()}, there ✦</p>
          <p className="mt-2 font-body text-sm text-muted">Your daily overview, shaped by what Karigai knows.</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{todayLabel()}</p>
      </header>

      {isLoading ? <LoadingDashboard /> : null}

      {error ? <QueryError error={error} retry={() => void refetch()} /> : null}

      {data ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <SetupProgressCard progress={data.setupProgress} />
            <CyclePhaseCard
              phase={data.personalizationFactors.cyclePhase}
              confidence={data.personalizationFactors.cycleConfidence}
            />
            <PersonalizationFactorsCard
              progress={data.setupProgress}
              factors={data.personalizationFactors}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <NutritionProgressCard
              calories={data.logs.caloriesConsumed}
              calorieTarget={data.todayPlan.calorieTarget}
              protein={data.logs.proteinConsumed}
              proteinTarget={data.todayPlan.proteinTarget}
            />
            <WaterProgressCard
              waterMl={data.logs.waterMl}
              targetMl={data.todayPlan.waterTargetMl}
              onChanged={() => void refetch()}
            />
            <WorkoutTodayCard
              name={data.todayPlan.workoutName}
              completed={data.logs.workoutCompleted}
              backupWorkout={data.todayPlan.backupWorkout}
              onChanged={() => void refetch()}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AIInsightCard insight={data.insight} />
            </div>
            <ChecklistCard checklist={data.checklist} />
          </div>

          <EnergyCheckInCard onSaved={() => void refetch()} />
        </div>
      ) : null}
    </div>
  );
}
