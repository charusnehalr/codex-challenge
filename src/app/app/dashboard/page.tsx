"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, Droplets, Dumbbell, UtensilsCrossed } from "lucide-react";
import { Chip, ProgressRing, QueryError, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { ensureAuthenticated } from "@/lib/auth-guard";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { formatHealthLabel } from "@/lib/format-labels";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal.store";
import { useToastStore } from "@/store/toast.store";
import type { DashboardResponse } from "@/types/dashboard";

type PhaseName = "Menstrual" | "Follicular" | "Ovulation" | "Luteal" | "Late Luteal" | "Unknown";

const phaseMeta = [
  { name: "Menstrual", days: 5, strokeClassName: "stroke-blush", tip: "Rest and gentle movement today." },
  { name: "Follicular", days: 8, strokeClassName: "stroke-sage", tip: "Strength and focus may feel easier." },
  { name: "Ovulation", days: 3, strokeClassName: "stroke-clay", tip: "Peak energy may fit stronger work." },
  { name: "Luteal", days: 12, strokeClassName: "stroke-bone", tip: "Keep things steady and responsive." },
] as const;

const symptoms = ["Fatigue", "Cramps", "Bloating", "Headache", "Cravings", "Good energy", "Low mood", "Nausea"];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function dateLabel() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })
    .format(new Date())
    .toUpperCase()
    .replace(",", " ·");
}

function timeLabel() {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date());
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function cleanLabel(value?: string) {
  const formatted = value ? formatHealthLabel(value) : "";
  return formatted || undefined;
}

function cleanInsight(insight: string) {
  return insight.replace(/\b[a-z]+(?:_[a-z]+)+\b/g, (match) => formatHealthLabel(match)).replace(/\s+/g, " ");
}

function normalizePhase(phase?: string): PhaseName {
  const formatted = cleanLabel(phase)?.replace("Ovulatory", "Ovulation");
  if (formatted === "Menstrual" || formatted === "Follicular" || formatted === "Ovulation" || formatted === "Luteal" || formatted === "Late Luteal") {
    return formatted;
  }
  return "Unknown";
}

function percent(value: number, target?: number) {
  return target ? Math.min(1, value / target) : 0;
}

function formatInt(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function waterDisplay(waterMl: number) {
  if (waterMl === 0) return "0";
  return waterMl >= 1000 ? `${(waterMl / 1000).toFixed(1)}L` : `${formatInt(waterMl)}ml`;
}

function DashboardCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.01, boxShadow: "0 8px 28px rgba(31,27,22,0.09)" }}
      className={cn("dashboard-card h-full min-w-0 overflow-hidden rounded-2xl border border-hairline bg-card p-4 shadow-[0_2px_12px_rgba(31,27,22,0.08)]", className)}
    >
      {children}
    </motion.div>
  );
}

function TinyRing({ value, color = "#B8704F" }: { value: number; color?: string }) {
  const size = 30;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span className="grid size-9 place-items-center rounded-full bg-shell/40">
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EFE7DA" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </span>
  );
}

function PlanRow({
  icon,
  label,
  value,
  metric,
  side,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  metric: ReactNode;
  side?: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[18px_minmax(0,1fr)_auto_36px] items-center gap-2 border-b border-hairline py-2.5 last:border-b-0 first:pt-2">
      <span className="grid place-items-center">{icon}</span>
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted">{label}</p>
        <p className="truncate font-body text-sm text-ink">{value}</p>
      </div>
      <div className="justify-self-end whitespace-nowrap font-body text-xs text-ink2">{metric}</div>
      <div className="justify-self-end">{side}</div>
    </div>
  );
}

function TodayPlanCard({ data }: { data: DashboardResponse }) {
  const calories = data.todayPlan.calorieTarget ?? 0;
  const waterTarget = data.todayPlan.waterTargetMl ?? 2500;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.01, boxShadow: "0 8px 28px rgba(31,27,22,0.09)" }}
      className="dashboard-card relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-card p-4 text-ink shadow-[0_2px_12px_rgba(31,27,22,0.08)]"
    >
      <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-clay">today's plan</p>
        <p className="font-mono text-[9px] text-muted">{timeLabel()}</p>
      </div>
      <div className="mt-2">
        <PlanRow
          icon={<UtensilsCrossed className="size-4 text-clay" />}
          label="Meals"
          value={data.todayPlan.mealFocus ?? "Balanced meals"}
          metric={calories ? `${formatInt(calories)} kcal` : "Set target"}
          side={<TinyRing value={percent(data.logs.caloriesConsumed, calories)} color="#B8704F" />}
        />
        <PlanRow
          icon={<Droplets className="size-4 text-[#6B8AA8]" />}
          label="Water"
          value="Hydration target"
          metric={`${formatInt(data.logs.waterMl)} of ${formatInt(waterTarget)}ml`}
          side={<TinyRing value={percent(data.logs.waterMl, waterTarget)} color="#6B8AA8" />}
        />
        <PlanRow
          icon={<Dumbbell className="size-4 text-sage" />}
          label="Workout"
          value={data.todayPlan.workoutName ?? "Gentle cycle support"}
          metric={
            data.logs.workoutCompleted ? (
              <Chip tone="sage" className="h-6 px-2 text-[10px]">Done</Chip>
            ) : (
              <Link href="/app/workout" className="rounded-xl border border-hairline bg-card px-2 py-1 font-body text-[10px] text-ink transition-colors hover:bg-shell">
                Start →
              </Link>
            )
          }
        />
      </div>
      <div className="-mx-4 -mb-4 mt-auto flex items-center justify-between gap-2 rounded-b-2xl bg-shell/40 px-4 py-2">
        <p className="truncate font-body text-[10px] italic text-muted">{cleanInsight(data.insight)}</p>
        <Link href="/app/chat" className="shrink-0 font-body text-[10px] text-clay transition-colors hover:text-ink">
          Ask assistant →
        </Link>
      </div>
      </div>
    </motion.div>
  );
}

function polarToCartesian(radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return { x: 60 + radius * Math.cos(angleInRadians), y: 60 + radius * Math.sin(angleInRadians) };
}

function describeArc(startAngle: number, endAngle: number, radius: number) {
  const start = polarToCartesian(radius, endAngle);
  const end = polarToCartesian(radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function CyclePhaseCard({ data }: { data: DashboardResponse }) {
  const phase = normalizePhase(data.personalizationFactors.cyclePhase);
  const day = data.personalizationFactors.cycleDay ?? 1;
  const dot = polarToCartesian(43, (Math.min(28, Math.max(1, day)) / 28) * 360);
  let angle = 0;

  return (
    <DashboardCard className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">cycle phase</p>
        <Chip tone={data.personalizationFactors.cycleConfidence === "high" ? "sage" : "neutral"} className="h-6 px-2 text-[10px]">
          {data.personalizationFactors.cycleConfidence ?? "medium"}
        </Chip>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center py-1">
        <motion.svg
          viewBox="0 0 120 120"
          preserveAspectRatio="xMidYMid meet"
          className="h-auto w-full max-w-[130px]"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {phaseMeta.map((item) => {
            const start = angle;
            const end = angle + (item.days / 28) * 360;
            angle = end;
            return (
              <path
                key={item.name}
                d={describeArc(start, end - 2, 43)}
                fill="none"
                strokeWidth={item.name === phase ? 16 : 13}
                strokeLinecap="round"
                className={cn(item.strokeClassName, item.name === phase ? "opacity-100" : "opacity-45")}
              />
            );
          })}
          {data.personalizationFactors.cycleDay ? (
            <g>
              <motion.circle cx={dot.x} cy={dot.y} r={9} className="fill-clay opacity-20" animate={{ scale: [1, 1.45, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <circle cx={dot.x} cy={dot.y} r={5.5} className="fill-card stroke-clay" strokeWidth={2.2} />
              <circle cx={dot.x} cy={dot.y} r={2.8} className="fill-clay" />
            </g>
          ) : null}
          <text x="60" y="58" textAnchor="middle" className="fill-ink font-display text-[14px] italic">
            {phase}
          </text>
        </motion.svg>
      </div>
      <p className="text-center font-mono text-xs uppercase tracking-widest text-muted">
        {data.personalizationFactors.cycleDay ? `Day ${data.personalizationFactors.cycleDay} · ${phase}` : "Add cycle info"}
      </p>
      <p className="mt-1 truncate text-center font-body text-xs italic text-muted">
        {phaseMeta.find((item) => item.name === phase)?.tip ?? "Log symptoms to improve guidance."}
      </p>
    </DashboardCard>
  );
}

function PersonalisationCard({ data }: { data: DashboardResponse }) {
  const groups = [
    { label: "Phase", tone: "blush" as const, values: [cleanLabel(data.personalizationFactors.cyclePhase)] },
    { label: "Goal", tone: "clay" as const, values: [cleanLabel(data.personalizationFactors.goal)] },
    { label: "Diet", tone: "bone" as const, values: [cleanLabel(data.personalizationFactors.dietType)] },
    {
      label: "Health",
      tone: "neutral" as const,
      values: [...data.personalizationFactors.healthContext, ...data.personalizationFactors.symptomsToday].map(cleanLabel).slice(0, 4),
    },
  ]
    .map((group) => ({ ...group, values: group.values.filter((value): value is string => Boolean(value)) }))
    .filter((group) => group.values.length);

  return (
    <DashboardCard className="flex flex-col bg-gradient-to-br from-paper to-cream">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-clay">karigai knows</p>
      <p className="mb-2 mt-1 font-body text-[10px] italic text-muted">This is what makes your plan yours.</p>
      <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
        {groups.length ? (
          groups.map((group) => (
            <div key={group.label} className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.16em] text-muted">{group.label}</span>
              <div className="flex min-w-0 flex-wrap gap-1 overflow-hidden">
                {group.values.map((value) => (
                  <Chip key={`${group.label}-${value}`} tone={group.tone} className="h-5 px-2 py-0.5 font-mono text-[9px]">
                    {value}
                  </Chip>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="font-body text-xs text-muted">Add onboarding details to unlock personalization.</p>
        )}
      </div>
      <Link href="/app/setup" className="mt-auto inline-block font-mono text-[9px] text-muted transition-colors hover:text-clay">
        Update context →
      </Link>
    </DashboardCard>
  );
}

function AnimatedRingLabel({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => String(Math.floor(latest)));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.8,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });

    return controls.stop;
  }, [count, delay, value]);

  return <motion.span>{rounded}</motion.span>;
}

function MacroRingColumn({
  label,
  consumed,
  target,
  color,
  delay = 0,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="flex min-w-0 flex-col items-center gap-2 text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay }}
    >
      <div className="relative grid place-items-center">
        <ProgressRing value={percent(consumed, target)} size={60} stroke={5} color={color} track="#EFE7DA" sublabel="g" />
        <div className="absolute inset-0 grid place-items-center pb-2 font-body text-sm font-semibold text-ink">
          <AnimatedRingLabel value={Math.round(consumed)} delay={delay} />
        </div>
      </div>
      <p className="font-mono text-[8px] uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono text-[10px] text-ink2">
        {formatInt(consumed)}g / {formatInt(target)}g
      </p>
    </motion.div>
  );
}

function NutritionCard({ data }: { data: DashboardResponse }) {
  const calorieTarget = data.todayPlan.calorieTarget ?? 1800;
  const proteinTarget = data.todayPlan.proteinTarget ?? 90;
  const carbsTarget = data.todayPlan.carbsTarget ?? Math.round((calorieTarget * 0.45) / 4);
  const fatTarget = data.todayPlan.fatTarget ?? Math.round((calorieTarget * 0.28) / 9);

  return (
    <DashboardCard className="flex flex-col justify-between bg-[linear-gradient(180deg,rgba(239,231,218,0.18)_0%,#FFFFFF_44%)]">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">nutrition today</p>
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="font-display text-2xl leading-none text-clay">{formatInt(data.logs.caloriesConsumed)}</span>
          <span className="font-mono text-xs text-muted">of {formatInt(calorieTarget)} kcal</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-around gap-3 px-2 pb-1">
        <MacroRingColumn label="Protein" consumed={data.logs.proteinConsumed} target={proteinTarget} color="#7A8B6F" />
        <MacroRingColumn label="Carbs" consumed={data.logs.carbsConsumed} target={carbsTarget} color="#C9B99A" delay={0.12} />
        <MacroRingColumn label="Fat" consumed={data.logs.fatConsumed} target={fatTarget} color="#E8B4A8" delay={0.24} />
      </div>
      {!data.logs.caloriesConsumed ? (
        <Link href="/app/meals" className="mt-2 text-center font-body text-xs text-clay transition-colors hover:text-ink">
          + Log your first meal →
        </Link>
      ) : null}
    </DashboardCard>
  );
}

function HydrationCard({ data, onChanged }: { data: DashboardResponse; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const target = data.todayPlan.waterTargetMl ?? 2500;
  const [optimisticWater, setOptimisticWater] = useState(data.logs.waterMl);
  const [waterPulse, setWaterPulse] = useState(false);

  useEffect(() => setOptimisticWater(data.logs.waterMl), [data.logs.waterMl]);

  async function addWater(amountMl: number) {
    if (!(await ensureAuthenticated("signup"))) return;
    const previous = optimisticWater;
    setOptimisticWater((current) => Math.max(0, current + amountMl));
    const response = await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amountMl }),
    });
    if (!response.ok) {
      setOptimisticWater(previous);
      addToast("Couldn't update water", "error");
      return;
    }
    setWaterPulse(true);
    window.setTimeout(() => setWaterPulse(false), 320);
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    onChanged();
  }

  return (
    <DashboardCard className="flex flex-col">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">hydration</p>
      <div className="flex flex-1 flex-col justify-center gap-0.5 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-4xl leading-none text-ink">{waterDisplay(optimisticWater)}</span>
          <motion.span
            animate={{ scale: waterPulse ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-full bg-shell px-2 py-0.5 font-mono text-[10px] text-muted"
          >
            {Math.round(percent(optimisticWater, target) * 100)}%
          </motion.span>
        </div>
        <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-muted">of {formatInt(target)}ml</p>
        <div className="mb-3 mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-shell">
            <motion.div
              className="h-full rounded-full bg-[#6B8AA8]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percent(optimisticWater, target) * 100)}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="mt-0.5 flex justify-between">
            <span className="font-mono text-[9px] text-muted">0ml</span>
            <span className="font-mono text-[9px] text-muted">{formatInt(target)}ml goal</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {[
          { label: "-500", delta: -500, positive: false },
          { label: "-250", delta: -250, positive: false },
          { label: "+250", delta: 250, positive: true },
          { label: "+500", delta: 500, positive: true },
        ].map(({ label, delta, positive }) => (
            <motion.button
              key={label}
              type="button"
              data-cursor-hover
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              onClick={() => void addWater(delta)}
              className={cn(
                "h-8 min-w-0 flex-1 rounded-xl border font-body text-xs transition-colors",
                positive
                  ? "border-[#6B8AA8]/20 bg-[#6B8AA8]/10 text-[#6B8AA8] hover:bg-[#6B8AA8]/20"
                  : "border-hairline bg-shell text-muted hover:bg-bone",
              )}
            >
              {label}
            </motion.button>
        ))}
      </div>
    </DashboardCard>
  );
}
function WorkoutCard({ data }: { data: DashboardResponse }) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [completed, setCompleted] = useState(data.logs.workoutCompleted);

  useEffect(() => setCompleted(data.logs.workoutCompleted), [data.logs.workoutCompleted]);

  async function completeWorkout() {
    if (!(await ensureAuthenticated("signup"))) return;
    setCompleted(true);
    const response = await fetch("/api/workout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ completed: true }),
    });
    if (!response.ok) {
      setCompleted(false);
      addToast("Couldn't complete workout. Try again.", "error");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <DashboardCard className="flex flex-col">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">workout today</p>
      <h3 className="mt-1 line-clamp-1 font-body text-sm font-semibold leading-tight text-ink">{data.todayPlan.workoutName ?? "Gentle cycle support"}</h3>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <Chip tone="neutral" className="h-5 px-2 text-[9px]">45 min</Chip>
        <Chip tone="neutral" className="h-5 px-2 text-[9px]">moderate</Chip>
      </div>
      <p className="mt-1.5 truncate font-mono text-[9px] leading-tight text-muted" title="Walking · Yoga · Stretching">Walking · Yoga · Stretching</p>
      <div className="mt-auto flex items-center gap-2 pt-2">
        {completed ? (
          <Chip tone="sage" className="h-8 min-w-0 flex-1 justify-center truncate px-2 text-[11px]">Completed today ✓</Chip>
        ) : (
          <button type="button" data-cursor-hover onClick={() => void completeWorkout()} className="h-8 min-w-0 flex-1 whitespace-nowrap rounded-xl bg-clay px-3 font-body text-xs text-cream shadow-[0_2px_12px_rgba(184,112,79,0.25)]">
            Mark complete
          </button>
        )}
        <Link href="/app/workout" className="grid h-8 w-16 shrink-0 place-items-center whitespace-nowrap rounded-xl border border-hairline bg-shell font-body text-xs text-ink transition-colors hover:bg-card">
          View →
        </Link>
      </div>
      <p className="mt-1.5 truncate font-body text-[9px] leading-tight text-muted">Backup: {data.todayPlan.backupWorkout ?? "20-min walk"}</p>
    </DashboardCard>
  );
}

function EnergyCheckInCard() {
  const [energy, setEnergy] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const visibleSymptoms = showAllSymptoms ? symptoms : symptoms.slice(0, 5);
  const hiddenSymptoms = symptoms.length - visibleSymptoms.length;

  async function saveCheckIn() {
    if (!(await ensureAuthenticated("signup"))) return;
    const response = await fetch("/api/cycle/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date: todayIsoDate(), energyScore: energy, symptoms: selectedSymptoms }),
    });
    if (!response.ok) {
      addToast("Couldn't save check-in. Try again.", "error");
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["cycle"] }),
    ]);
  }

  return (
    <DashboardCard className="flex flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <p className="font-body text-sm font-medium text-ink">
          How are you feeling? <span className="font-normal text-muted">· Tap a number + symptoms</span>
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 py-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
            <motion.button
              key={score}
              type="button"
              data-cursor-hover
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.92 }}
              animate={{ scale: energy === score ? 1.15 : 1, y: energy === score ? -2 : 0 }}
              transition={{ type: "spring", stiffness: 430, damping: 24 }}
              onClick={() => setEnergy(score)}
              className={cn("grid size-[30px] shrink-0 place-items-center rounded-full font-mono text-[11px] shadow-sm", energy === score ? "bg-clay text-cream shadow-md" : "bg-shell text-muted hover:bg-bone hover:text-ink")}
            >
              {score}
            </motion.button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 overflow-hidden">
          {visibleSymptoms.map((symptom) => {
            const selected = selectedSymptoms.includes(symptom);
            return (
              <motion.button
                key={symptom}
                type="button"
                data-cursor-hover
                whileTap={{ scale: 0.96 }}
                animate={{ scale: selected ? 1.04 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                onClick={() => setSelectedSymptoms((current) => selected ? current.filter((item) => item !== symptom) : [...current, symptom])}
              className={cn("h-[28px] shrink-0 whitespace-nowrap rounded-chip border px-3 font-body text-xs transition-colors", selected ? "border-clay bg-clay text-cream" : "border-hairline bg-shell text-muted hover:bg-bone")}
              >
                {symptom}
              </motion.button>
            );
          })}
          {hiddenSymptoms > 0 ? (
            <button
              type="button"
              data-cursor-hover
              onClick={() => setShowAllSymptoms(true)}
              className="h-[28px] shrink-0 whitespace-nowrap rounded-chip border border-hairline bg-shell px-2.5 font-body text-xs text-muted transition-colors hover:bg-bone hover:text-ink"
            >
              + {hiddenSymptoms}
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 justify-end pt-1">
        <button type="button" data-cursor-hover onClick={() => void saveCheckIn()} className="h-8 w-fit shrink-0 rounded-xl bg-clay px-4 font-body text-xs text-cream">
          {saved ? "Saved ✓" : "Save check-in"}
        </button>
      </div>
    </DashboardCard>
  );
}

function ChecklistCard({ data }: { data: DashboardResponse }) {
  const items = data.checklist.length
    ? data.checklist
    : [
        { id: "water", label: "Drink 500ml water", done: false },
        { id: "breakfast", label: "Log breakfast", done: false },
        { id: "lunch", label: "Log lunch", done: false },
        { id: "workout", label: "Complete workout", done: false },
        { id: "energy", label: "Log today's energy", done: false },
      ];
  const done = items.filter((item) => item.done).length;

  return (
    <DashboardCard className="flex flex-col">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">today · {done}/{items.length} done</p>
      <div className="mt-2 flex-1 space-y-1 overflow-hidden">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex h-6 items-center gap-2.5">
            <span className={cn("grid size-3.5 place-items-center rounded-sm border-2", item.done ? "border-clay bg-clay text-cream" : "border-hairline bg-card")}>
              {item.done ? <Check className="size-3" /> : null}
            </span>
            <span className={cn("relative font-body text-xs transition-colors", item.done ? "text-muted line-through" : "text-ink2")}>{item.label}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

function LoadingDashboard() {
  return (
    <div className="grid min-h-[480px] min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
      {Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const openModal = useAuthModalStore((state) => state.openModal);
  const greet = useMemo(() => greeting(), []);

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-paper p-4">
      {!authLoading && !isAuthenticated ? (
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex h-10 items-center justify-between gap-3 rounded-2xl bg-ink px-4 text-cream guest-shimmer"
        >
          <p className="truncate font-body text-xs">Sign in to personalise your dashboard and save your data.</p>
          <div className="flex gap-2">
            <button type="button" className="font-body text-xs text-cream/70 hover:text-cream" onClick={() => openModal("login")}>Sign in</button>
            <button type="button" className="rounded-xl bg-clay px-3 py-1 font-body text-xs text-cream" onClick={() => openModal("signup")}>Create account</button>
          </div>
        </motion.div>
      ) : null}

      <motion.header variants={fadeUp} initial="hidden" animate="visible" className="mb-2 flex shrink-0 items-end justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-normal text-ink">
            {greet}{data?.profileName ? `, ${data.profileName}` : ""} <span className="pulse-star inline-block text-clay">✦</span>
          </p>
          <p className="font-body text-sm text-muted">Your daily overview, shaped by what Karigai knows.</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{dateLabel()}</p>
      </motion.header>

      {isLoading ? <LoadingDashboard /> : null}
      {error ? <QueryError error={error} retry={() => void refetch()} /> : null}
      {data ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid min-h-[480px] w-full min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]"
        >
          <TodayPlanCard data={data} />
          <CyclePhaseCard data={data} />
          <PersonalisationCard data={data} />
          <NutritionCard data={data} />
          <HydrationCard data={data} onChanged={() => void refetch()} />
          <WorkoutCard data={data} />
          <div className="h-full min-w-0 xl:col-span-2"><EnergyCheckInCard /></div>
          <ChecklistCard data={data} />
        </motion.div>
      ) : null}
    </div>
  );
}
