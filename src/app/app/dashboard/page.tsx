"use client";

import { motion } from "framer-motion";
import { AIInsightCard } from "@/components/features/dashboard/AIInsightCard";
import { ChecklistCard } from "@/components/features/dashboard/ChecklistCard";
import { CyclePhaseCard } from "@/components/features/dashboard/CyclePhaseCard";
import { EnergyCheckInCard } from "@/components/features/dashboard/EnergyCheckInCard";
import { NutritionProgressCard } from "@/components/features/dashboard/NutritionProgressCard";
import { PersonalizationFactorsCard } from "@/components/features/dashboard/PersonalizationFactorsCard";
import { SetupProgressCard } from "@/components/features/dashboard/SetupProgressCard";
import { WaterProgressCard } from "@/components/features/dashboard/WaterProgressCard";
import { WorkoutTodayCard } from "@/components/features/dashboard/WorkoutTodayCard";
import { Button, QueryError, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { useAuthModalStore } from "@/store/auth-modal.store";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
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
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><SkeletonCard /></div>
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const openModal = useAuthModalStore((state) => state.openModal);

  return (
    <div className="space-y-8">
      {!authLoading && !isAuthenticated ? (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="-mx-4 flex flex-col justify-between gap-3 bg-ink px-4 py-4 text-cream guest-shimmer md:-mx-8 md:flex-row md:items-center md:px-8"
        >
          <p className="font-body text-sm">Sign in to personalise your dashboard and save your data.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="border-cream text-cream hover:bg-cream hover:text-ink" onClick={() => openModal("login")}>
              Sign in
            </Button>
            <Button size="sm" variant="accent" onClick={() => openModal("signup")}>
              Create account
            </Button>
          </div>
        </motion.div>
      ) : null}

      <motion.header variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="font-display text-4xl font-normal text-ink">
            {greeting()}, there <span className="pulse-star inline-block">✦</span>
          </p>
          <p className="mt-2 font-body text-base text-muted">Your daily overview, shaped by what Karigai knows.</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{todayLabel()}</p>
      </motion.header>

      {isLoading ? <LoadingDashboard /> : null}

      {error ? <QueryError error={error} retry={() => void refetch()} /> : null}

      {data ? (
        <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <SetupProgressCard progress={data.setupProgress} />
            <CyclePhaseCard
              phase={data.personalizationFactors.cyclePhase}
              confidence={data.personalizationFactors.cycleConfidence}
            />
            <PersonalizationFactorsCard progress={data.setupProgress} factors={data.personalizationFactors} />
          </motion.div>

          <motion.div variants={fadeUp} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <NutritionProgressCard
              calories={data.logs.caloriesConsumed}
              calorieTarget={data.todayPlan.calorieTarget}
              protein={data.logs.proteinConsumed}
              proteinTarget={data.todayPlan.proteinTarget}
            />
            <WaterProgressCard waterMl={data.logs.waterMl} targetMl={data.todayPlan.waterTargetMl} onChanged={() => void refetch()} />
            <WorkoutTodayCard
              name={data.todayPlan.workoutName}
              completed={data.logs.workoutCompleted}
              backupWorkout={data.todayPlan.backupWorkout}
              onChanged={() => void refetch()}
            />
          </motion.div>

          <motion.div variants={fadeUp} className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AIInsightCard insight={data.insight} />
            </div>
            <ChecklistCard checklist={data.checklist} />
          </motion.div>

          <motion.div variants={fadeUp}>
            <EnergyCheckInCard onSaved={() => void refetch()} />
          </motion.div>
        </motion.div>
      ) : null}
    </div>
  );
}
