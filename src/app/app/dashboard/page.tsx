"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
  return waterMl >= 1000 ? `${(waterMl / 1000).toFixed(1)}L` : formatInt(waterMl);
}

function DashboardCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.01, boxShadow: "0 8px 28px rgba(31,27,22,0.09)" }}
      className={cn("h-full overflow-hidden rounded-2xl border border-hairline bg-card p-4 shadow-[0_1px_4px_rgba(31,27,22,0.05)]", className)}
    >
      {children}
    </motion.div>
  );
}

function TinyRing({ value, color = "#B8704F" }: { value: number; color?: string }) {
  const size = 28;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span className="grid size-8 place-items-center rounded-full bg-shell/40">
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
    <div className="grid grid-cols-[20px_1fr_auto_32px] items-center gap-3 border-b border-hairline py-3 last:border-b-0 first:pt-2">
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
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-[linear-gradient(180deg,rgba(184,112,79,0.08)_0%,#FFFFFF_40%)] p-4 text-ink shadow-[0_2px_20px_rgba(31,27,22,0.08)]"
    >
      <div className="absolute bottom-0 left-0 top-0 z-10 w-[3px] bg-clay" />
      <div className="flex min-h-0 flex-1 flex-col pl-3">
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
      <div className="-mb-4 -ml-3 -mr-4 mt-auto flex items-center justify-between gap-3 rounded-b-2xl bg-clay/5 px-4 py-2">
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
  const dot = polarToCartesian(38, (Math.min(28, Math.max(1, day)) / 28) * 360);
  let angle = 0;

  return (
    <DashboardCard className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">cycle phase</p>
        <Chip tone={data.personalizationFactors.cycleConfidence === "high" ? "sage" : "neutral"} className="h-6 px-2 text-[10px]">
          {data.personalizationFactors.cycleConfidence ?? "medium"}
        </Chip>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <svg viewBox="0 0 120 120" className="size-[100px]">
          {phaseMeta.map((item) => {
            const start = angle;
            const end = angle + (item.days / 28) * 360;
            angle = end;
            return (
              <path
                key={item.name}
                d={describeArc(start, end - 2, 38)}
                fill="none"
                strokeWidth={item.name === phase ? 12 : 9}
                strokeLinecap="round"
                className={cn(item.strokeClassName, item.name === phase ? "opacity-100" : "opacity-45")}
              />
            );
          })}
          {data.personalizationFactors.cycleDay ? (
            <g>
              <motion.circle cx={dot.x} cy={dot.y} r={8} className="fill-clay opacity-20" animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <circle cx={dot.x} cy={dot.y} r={5} className="fill-card stroke-clay" strokeWidth={2} />
              <circle cx={dot.x} cy={dot.y} r={2.5} className="fill-clay" />
            </g>
          ) : null}
          <text x="60" y="58" textAnchor="middle" className="fill-ink font-display text-[14px] italic">
            {phase}
          </text>
        </svg>
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

function MiniNutritionRing({ label, sublabel, value, color, caption }: { label: string; sublabel: string; value: number; color: string; caption: string }) {
  return (
    <div className="flex min-w-[80px] flex-col items-center gap-1 text-center">
      <ProgressRing value={value} size={56} stroke={5} color={color} label={label} sublabel={sublabel} />
      <p className="font-mono text-[9px] text-muted">{caption}</p>
    </div>
  );
}

function NutritionCard({ data }: { data: DashboardResponse }) {
  const calorieTarget = data.todayPlan.calorieTarget ?? 1800;
  const proteinTarget = data.todayPlan.proteinTarget ?? 90;
  const waterTarget = data.todayPlan.waterTargetMl ?? 2500;

  return (
    <DashboardCard className="flex flex-col">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">nutrition today</p>
      <div className="mt-3 flex justify-evenly gap-2">
        <MiniNutritionRing label={`${formatInt(data.logs.caloriesConsumed)}`} sublabel="kcal" value={percent(data.logs.caloriesConsumed, calorieTarget)} color="#B8704F" caption={`${formatInt(data.logs.caloriesConsumed)} / ${formatInt(calorieTarget)}`} />
        <MiniNutritionRing label={`${formatInt(data.logs.proteinConsumed)}`} sublabel="g" value={percent(data.logs.proteinConsumed, proteinTarget)} color="#7A8B6F" caption={`${formatInt(data.logs.proteinConsumed)} / ${formatInt(proteinTarget)}`} />
        <MiniNutritionRing label={waterDisplay(data.logs.waterMl)} sublabel="water" value={percent(data.logs.waterMl, waterTarget)} color="#6B8AA8" caption={`${formatInt(data.logs.waterMl)} / ${formatInt(waterTarget)}`} />
      </div>
      {!data.logs.caloriesConsumed ? (
        <Link href="/app/meals" className="mt-2 inline-block font-body text-xs text-clay transition-colors hover:text-ink">
          + Log your first meal
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
    setOptimisticWater((current) => current + amountMl);
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
      <div className="mt-2 flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex min-h-0 flex-1 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-4xl leading-none text-ink">{waterDisplay(optimisticWater)}</p>
            <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-muted">of {formatInt(target)}ml</p>
          </div>
          <motion.div animate={{ scale: waterPulse ? [1, 1.1, 1] : 1 }} transition={{ duration: 0.3 }}>
            <ProgressRing value={percent(optimisticWater, target)} size={56} stroke={6} color="#6B8AA8" track="#EFE7DA" />
          </motion.div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-shell">
          <div
            className="h-full rounded-full bg-[#6B8AA8] transition-all duration-700"
            style={{ width: `${Math.min(100, percent(optimisticWater, target) * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pb-1">
          {[250, 500].map((amount) => (
            <motion.button
              key={amount}
              type="button"
              data-cursor-hover
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              onClick={() => void addWater(amount)}
              className="h-8 rounded-xl border border-[#6B8AA8]/20 bg-[#EFF3F8] font-body text-xs text-[#6B8AA8] transition-colors hover:bg-[#6B8AA8]/20"
            >
              + {amount}ml
            </motion.button>
          ))}
        </div>
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
    <DashboardCard className="flex flex-col p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">workout today</p>
      <h3 className="mt-2 line-clamp-1 font-body text-base font-semibold text-ink">{data.todayPlan.workoutName ?? "Gentle cycle support"}</h3>
      <div className="mb-2 mt-2 flex gap-1.5">
        <Chip tone="neutral" className="h-6 px-2 text-[10px]">45 min</Chip>
        <Chip tone="neutral" className="h-6 px-2 text-[10px]">moderate</Chip>
      </div>
      <p className="mt-2 truncate font-mono text-[10px] text-muted" title="Walking · Yoga · Stretching">Walking · Yoga · Stretching</p>
      <div className="mt-auto flex items-center gap-2">
        {completed ? (
          <Chip tone="sage" className="h-8 flex-1 justify-center">Completed today ✓</Chip>
        ) : (
          <button type="button" data-cursor-hover onClick={() => void completeWorkout()} className="h-9 min-w-0 flex-1 whitespace-nowrap rounded-xl bg-clay px-3 font-body text-xs text-cream shadow-[0_2px_12px_rgba(184,112,79,0.25)]">
            Mark complete
          </button>
        )}
        <Link href="/app/workout" className="grid h-9 w-16 place-items-center rounded-xl border border-hairline bg-shell font-body text-xs text-ink transition-colors hover:bg-card">
          View →
        </Link>
      </div>
      <p className="mt-2 truncate font-body text-[10px] text-muted">Backup: {data.todayPlan.backupWorkout ?? "20-min walk"}</p>
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
    <DashboardCard className="flex flex-col justify-between gap-3">
      <div className="min-w-0">
        <p className="font-body text-xs font-medium text-ink">
          How are you feeling? <span className="font-normal text-muted">· Tap a number + symptoms</span>
        </p>
        <div className="mt-4 flex min-w-0 gap-1">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
            <motion.button
              key={score}
              type="button"
              data-cursor-hover
              whileTap={{ scale: 0.92 }}
              animate={{ scale: energy === score ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              onClick={() => setEnergy(score)}
              className={cn("grid size-[30px] shrink-0 place-items-center rounded-full font-mono text-[11px] shadow-sm", energy === score ? "bg-clay text-cream" : "bg-shell text-muted")}
            >
              {score}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-nowrap justify-end gap-1.5 overflow-hidden">
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
              className={cn("h-7 whitespace-nowrap rounded-chip border px-2.5 py-0.5 font-body text-[10px] transition-colors", selected ? "border-clay bg-clay text-cream" : "border-hairline bg-shell text-muted")}
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
              className="h-7 whitespace-nowrap rounded-chip border border-hairline bg-shell px-2.5 py-0.5 font-body text-[10px] text-muted transition-colors hover:text-ink"
            >
              + {hiddenSymptoms}
            </button>
          ) : null}
        </div>
        <button type="button" data-cursor-hover onClick={() => void saveCheckIn()} className="h-9 w-fit shrink-0 rounded-xl bg-clay px-4 font-body text-xs text-cream">
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
      <div className="mt-2 max-h-[150px] space-y-1.5 overflow-y-auto scrollbar-hide">
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
    <div className="grid min-h-[480px] gap-2.5 md:h-auto md:grid-cols-2 lg:h-[calc(100vh-7.25rem)] lg:max-h-[900px] lg:grid-cols-[2fr_1.1fr_1.1fr] lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
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
    <div className="-mb-8 -mt-6 h-[calc(100vh-2rem)] max-h-[900px] space-y-3 overflow-hidden bg-paper md:-mx-4 md:-mb-10 md:-mt-7">
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

      <motion.header variants={fadeUp} initial="hidden" animate="visible" className="mb-3 flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-normal text-ink">
            {greet}{data?.profileName ? `, ${data.profileName}` : ""} <span className="pulse-star inline-block">✦</span>
          </p>
          <p className="font-body text-xs text-muted">Your daily overview, shaped by what Karigai knows.</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{dateLabel()}</p>
      </motion.header>

      {isLoading ? <LoadingDashboard /> : null}
      {error ? <QueryError error={error} retry={() => void refetch()} /> : null}
      {data ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid min-h-[480px] gap-2.5 md:h-auto md:grid-cols-2 lg:h-[calc(100vh-7.25rem)] lg:max-h-[900px] lg:grid-cols-[2fr_1.1fr_1.1fr] lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]"
        >
          <TodayPlanCard data={data} />
          <CyclePhaseCard data={data} />
          <PersonalisationCard data={data} />
          <NutritionCard data={data} />
          <HydrationCard data={data} onChanged={() => void refetch()} />
          <WorkoutCard data={data} />
          <div className="h-full lg:col-span-2"><EnergyCheckInCard /></div>
          <ChecklistCard data={data} />
        </motion.div>
      ) : null}
    </div>
  );
}
