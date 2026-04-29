"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, CalendarDays, Droplet, Dumbbell, Info, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Eyebrow,
  PageHeader,
  PageTransition,
  ProgressRing,
  QueryError,
  SafetyBanner,
  SkeletonCard,
} from "@/components/ui";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal.store";

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
  cycleStatus?: {
    cycleDay: number;
    cyclePhase: string;
    cycleLength: number;
    confidence: "low" | "medium" | "high";
    nextPeriodDate: string | null;
    daysUntilNextPeriod: number;
    phaseProgressPercent: number;
    phaseDay: number;
    phaseTotalDays: number;
    periodNotStartedYet: boolean;
    overdueDays: number;
  };
  cycleUpdatedToday?: boolean;
  goalSummary?: string;
  setupProgress: number;
  missingDataFor: string[];
};

const metricHelp: Record<string, string> = {
  BMI: "Body Mass Index compares weight with height. It is a broad population tool, not a measure of health or fitness.",
  WHR: "Waist-to-hip ratio is a body shape estimate. Higher values may suggest more central fat distribution.",
  BRI: "Body Roundness Index uses waist and height to estimate body shape. It is wellness context, not a diagnosis.",
  BMR: "Basal Metabolic Rate estimates calories your body may use at complete rest.",
  TDEE: "Total Daily Energy Expenditure estimates daily energy needs after activity.",
  Protein: "Protein targets are estimated from body weight and goal, then softened by wellness context.",
  Water: "Hydration target uses a simple body-weight estimate.",
};

const phaseDescriptions: Record<string, string> = {
  Menstrual: "Rest and gentle movement are common preferences. Energy may be lower, and iron-rich foods can be supportive during this time.",
  Follicular: "Rising energy for many women. This is often a good phase for strength training, new projects, and social connection.",
  Ovulation: "Peak energy phase for many. Higher-intensity workouts may feel easier, and mood often lifts during this window.",
  Luteal: "Progesterone rises. Energy may shift in the second half, and cravings or mood changes are common.",
  Unknown: "Add your cycle dates in onboarding to see a phase estimate here.",
};

function confidenceTone(confidence?: string) {
  if (confidence === "high") {
    return "sage";
  }
  if (confidence === "low") {
    return "blush";
  }
  return "neutral";
}

function titleCase(value?: string) {
  if (!value) {
    return "Not set";
  }
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value?: number, suffix = "") {
  if (value === undefined) {
    return "Add data";
  }
  return `${new Intl.NumberFormat("en-US").format(value)}${suffix}`;
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value?: string) {
  if (!value) {
    return "after cycle setup";
  }
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function nextPeriodSummary(cycleDay?: number, cycleLength = 28) {
  if (!cycleDay) {
    return undefined;
  }
  let remaining = cycleLength - cycleDay + 1;
  if (remaining <= 0) {
    remaining += cycleLength;
  }
  const today = new Date();
  const target = new Date(today);
  target.setDate(today.getDate() + remaining);
  return {
    days: remaining,
    date: formatShortDate(target.toISOString().slice(0, 10)),
  };
}

function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        data-cursor-hover
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-muted transition-colors duration-150 hover:text-clay"
        aria-label={`About ${label}`}
      >
        <Info className="size-3.5" />
      </button>
      {open ? (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="absolute left-1/2 top-6 z-30 w-52 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-left font-body text-xs leading-relaxed text-cream shadow-xl"
        >
          {children}
        </motion.span>
      ) : null}
    </span>
  );
}

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-2 font-display text-2xl italic tracking-tight text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function HeroSummary({ data }: { data: AnalysisResponse }) {
  const todayLabel = useMemo(() => formatLongDate(new Date()), []);
  const phase = data.cyclePhase ? `${data.cyclePhase}${data.cycleDay ? ` · Day ${data.cycleDay}` : ""}` : "Cycle pending";

  return (
    <Card padding="lg" className="overflow-hidden bg-shell/50" interactive>
      <div className="grid gap-8 lg:grid-cols-[1fr_180px] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-chip bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            <Sparkles className="size-3 text-clay" />
            analysis
          </div>
          <h2 className="mt-5 font-display text-5xl italic leading-tight text-ink">Your wellness snapshot</h2>
          <p className="mt-3 max-w-2xl font-body text-base leading-relaxed text-muted">
            Based on what you have shared with Karigai - {todayLabel}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip tone="clay">Setup: {data.setupProgress}% complete</Chip>
            <Chip tone="sage">Goal: {titleCase(data.goalSummary)}</Chip>
            <Chip tone="neutral">Phase: {phase}</Chip>
          </div>
        </div>
        <div className="flex justify-start lg:justify-end">
          <ProgressRing
            value={data.setupProgress / 100}
            size={140}
            stroke={10}
            label={`${data.setupProgress}%`}
            sublabel="profile complete"
          />
        </div>
      </div>
    </Card>
  );
}

function metricPosition(value: number | undefined, min: number, max: number) {
  if (value === undefined) {
    return 0;
  }
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function SpectrumRow({
  label,
  value,
  help,
  min,
  max,
  markerLabel,
  note,
  missing,
}: {
  label: string;
  value?: number;
  help: string;
  min: number;
  max: number;
  markerLabel: string;
  note?: string;
  missing: string;
}) {
  const left = metricPosition(value, min, max);

  return (
    <div className="rounded-2xl bg-paper/70 p-4">
      <div className="grid gap-4 lg:grid-cols-[180px_1fr_180px] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-body text-base font-semibold text-ink">{label}</span>
            <Tooltip label={label}>{help}</Tooltip>
          </div>
          <p className="mt-1 font-display text-4xl text-ink">{value ?? "--"}</p>
        </div>
        {value === undefined ? (
          <div className="rounded-xl border border-dashed border-hairline bg-card p-4 font-body text-sm text-muted">{missing}</div>
        ) : (
          <div className="pt-8">
            <div className="relative h-4 rounded-chip bg-gradient-to-r from-[#6B8AA8] via-sage via-45% via-amber to-alert">
              <motion.span
                initial={{ left: "0%" }}
                animate={{ left: `${left}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              >
                <span className="absolute bottom-7 rounded-chip bg-ink px-2 py-0.5 font-mono text-[10px] text-cream shadow-md">
                  {value}
                </span>
                <span className="absolute bottom-6 size-2 rotate-45 bg-ink" />
                <span className="grid size-5 place-items-center rounded-full border-2 border-ink bg-card shadow-[0_2px_8px_rgba(31,27,22,0.35)]">
                  <span className="size-2 rounded-full bg-clay" />
                </span>
              </motion.span>
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <span>Low</span>
              <span>Mid</span>
              <span>Higher</span>
            </div>
          </div>
        )}
        <div>
          <p className="font-body text-sm font-semibold text-ink2">{value === undefined ? "Waiting for data" : markerLabel}</p>
          {note ? <p className="mt-1 font-body text-xs leading-relaxed text-muted">{note}</p> : null}
        </div>
      </div>
    </div>
  );
}

function BodyComposition({ data }: { data: AnalysisResponse }) {
  return (
    <section>
      <SectionTitle eyebrow="body composition" title="How your measurements compare" />
      <Card padding="lg" className="space-y-4" interactive>
        <SpectrumRow
          label="BMI"
          value={data.bmi}
          help={metricHelp.BMI}
          min={16}
          max={36}
          markerLabel={data.bmiCategory ?? "Wellness estimate"}
          missing="Add height and weight in onboarding to calculate BMI."
        />
        <SpectrumRow
          label="WHR"
          value={data.whr}
          help={metricHelp.WHR}
          min={0.65}
          max={1.15}
          markerLabel={data.whr && data.whr >= 0.9 ? "Higher central distribution" : "Lower central distribution"}
          note="Waist-to-hip ratio - wellness estimate only."
          missing="Add waist and hip measurements to calculate WHR."
        />
        <SpectrumRow
          label="BRI"
          value={data.bri}
          help={metricHelp.BRI}
          min={1}
          max={14}
          markerLabel={data.bri && data.bri > 13 ? "Worth discussing if this looks unexpected" : "Body-shape context"}
          missing="Add waist measurement and height to calculate BRI."
        />
        {data.whr && data.whr > 0.85 ? (
          <SafetyBanner
            tone="info"
            title="Worth a conversation"
            body="A WHR above 0.85 for women may suggest central fat distribution. Consider mentioning this to your doctor - it is not a diagnosis."
          />
        ) : null}
        {data.bri && data.bri > 13 ? (
          <SafetyBanner
            tone="warn"
            title="BRI looks unusually high"
            body="This may be due to measurement input. Double-check your waist and height in onboarding. If accurate, it is worth discussing with a clinician."
          />
        ) : null}
      </Card>
    </section>
  );
}

function TargetBar({
  icon,
  label,
  value,
  help,
  colorClass,
  caption,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  help: string;
  colorClass: string;
  caption: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted">{icon}</span>
          <span className="font-body text-sm font-semibold text-ink">{label}</span>
          <Tooltip label={label}>{help}</Tooltip>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-chip bg-shell">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full origin-left rounded-chip", colorClass)}
        />
      </div>
      <p className="mt-2 font-body text-xs leading-relaxed text-muted">{caption}</p>
    </div>
  );
}

function EnergyComponentRow({
  label,
  value,
  caption,
  width,
  barClassName,
  valueClassName,
  delay,
}: {
  label: string;
  value: string;
  caption: string;
  width: number;
  barClassName: string;
  valueClassName?: string;
  delay: number;
}) {
  return (
    <div className="rounded-2xl bg-paper/70 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-body text-sm font-semibold text-ink">{label}</p>
        <p className={cn("font-mono text-xs uppercase tracking-widest text-muted", valueClassName)}>{value}</p>
      </div>
      <div className="mt-3 h-3 rounded-chip bg-shell">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(6, Math.min(100, width))}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-chip", barClassName)}
        />
      </div>
      <p className="mt-2 font-body text-xs leading-relaxed text-muted">{caption}</p>
    </div>
  );
}

function EnergyTargets({ data }: { data: AnalysisResponse }) {
  const bmr = data.bmr ?? 0;
  const tdee = data.tdee ?? 0;
  const calorieTarget = data.calorieTarget ?? 0;
  const activity = Math.max(0, tdee - bmr);
  const deficit = Math.max(0, tdee - calorieTarget);
  const total = Math.max(tdee, 1);

  return (
    <section>
      <SectionTitle eyebrow="energy and nutrition" title="Daily targets with context" />
      <Card padding="lg" interactive>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>daily energy</Eyebrow>
            <h3 className="mt-2 font-display text-4xl text-ink">{formatNumber(data.calorieTarget, " kcal")} target</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-muted">
              {titleCase(data.goalSummary)} {deficit ? `· ${deficit} kcal deficit from TDEE` : "· maintenance estimate"}
            </p>
            {data.bmr && data.tdee && data.calorieTarget ? (
              <div className="mt-6 space-y-3">
                <EnergyComponentRow
                  label="Base rate"
                  value={`${formatNumber(data.bmr)} kcal`}
                  caption="What your body may burn at rest."
                  width={(bmr / total) * 100}
                  barClassName="bg-ink2"
                  delay={0}
                />
                <EnergyComponentRow
                  label="Activity"
                  value={`+${formatNumber(activity)} kcal`}
                  caption="Added from your activity level."
                  width={(activity / total) * 100}
                  barClassName="bg-sage"
                  valueClassName="text-sage"
                  delay={0.2}
                />
                <EnergyComponentRow
                  label="Daily target"
                  value={`${formatNumber(data.calorieTarget)} kcal`}
                  caption={`Your goal: ${deficit} kcal below TDEE.`}
                  width={(calorieTarget / total) * 100}
                  barClassName="border border-dashed border-clay bg-claySoft/30"
                  valueClassName="text-clay"
                  delay={0.4}
                />
                <p className="pt-2 font-mono text-xs uppercase tracking-widest text-muted">
                  TDEE {formatNumber(data.tdee)} - deficit {formatNumber(deficit)} = target {formatNumber(data.calorieTarget)} kcal/day
                </p>
              </div>
            ) : (
              <EmptyState icon={<Activity className="size-7" />} title="Energy target pending" body="Add profile, goal, and activity context in onboarding." />
            )}
          </div>
          <div className="space-y-7 rounded-2xl bg-paper/70 p-5">
            <Eyebrow>daily targets</Eyebrow>
            <TargetBar
              icon={<Dumbbell className="size-4" />}
              label="Protein"
              value={data.proteinTarget ? `${data.proteinTarget}g / day` : "Add data"}
              help={metricHelp.Protein}
              colorClass="bg-sage"
              caption="Estimated from your body weight and goal."
            />
            <TargetBar
              icon={<Droplet className="size-4" />}
              label="Hydration"
              value={data.waterTargetMl ? `${data.waterTargetMl}ml / day` : "Add data"}
              help={metricHelp.Water}
              colorClass="bg-[#6B8AA8]"
              caption="Around 33ml per kg body weight."
            />
          </div>
        </div>
      </Card>
    </section>
  );
}

function describeArc(startAngle: number, endAngle: number, radius: number) {
  const start = polarToCartesian(radius, endAngle);
  const end = polarToCartesian(radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: 90 + radius * Math.cos(angleInRadians),
    y: 90 + radius * Math.sin(angleInRadians),
  };
}

type PhaseName = "Menstrual" | "Follicular" | "Ovulation" | "Luteal";

const phaseMeta: Array<{
  name: PhaseName;
  days: number;
  startDay: number;
  endDay: number;
  className: string;
  fillClassName: string;
  next: string;
}> = [
  { name: "Menstrual", days: 5, startDay: 1, endDay: 5, className: "stroke-blush", fillClassName: "bg-blush", next: "Follicular rising" },
  { name: "Follicular", days: 8, startDay: 6, endDay: 13, className: "stroke-sage", fillClassName: "bg-sage", next: "Ovulation approaching" },
  { name: "Ovulation", days: 3, startDay: 14, endDay: 16, className: "stroke-clay", fillClassName: "bg-clay", next: "Luteal approaching" },
  { name: "Luteal", days: 12, startDay: 17, endDay: 28, className: "stroke-bone", fillClassName: "bg-bone", next: "Menstrual phase approaching" },
];

function getPhaseProgress(phase?: string, cycleDay?: number) {
  const fallback = phaseMeta[1];
  const meta = phaseMeta.find((item) => item.name === phase) ?? fallback;
  const dayInPhase = cycleDay ? Math.min(meta.days, Math.max(1, cycleDay - meta.startDay + 1)) : 0;
  return { meta, dayInPhase, percent: meta.days ? (dayInPhase / meta.days) * 100 : 0 };
}

function CycleWheel({ data }: { data: AnalysisResponse }) {
  const displayPhase = data.cycleStatus?.cyclePhase ?? data.cyclePhase;
  const currentPhase = phaseMeta.find((phase) => phase.name === displayPhase)?.name ?? "Follicular";
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(currentPhase);
  const cycleLength = data.cycleStatus?.cycleLength ?? 28;
  const day = data.cycleStatus?.cycleDay ?? data.cycleDay ?? 1;
  const dotAngle = (Math.min(cycleLength, Math.max(1, day)) / cycleLength) * 360;
  const dot = polarToCartesian(64, dotAngle);
  const nextPeriod = data.cycleStatus?.periodNotStartedYet
    ? { days: data.cycleStatus.daysUntilNextPeriod, date: formatShortDate(data.nextPeriodEstimate) }
    : nextPeriodSummary(data.cycleStatus?.cycleDay ?? data.cycleDay, cycleLength);
  const progress = data.cycleStatus?.phaseTotalDays
    ? {
        meta: phaseMeta.find((item) => item.name === currentPhase) ?? phaseMeta[1],
        dayInPhase: data.cycleStatus.phaseDay,
        percent: data.cycleStatus.phaseProgressPercent,
      }
    : getPhaseProgress(data.cyclePhase, data.cycleDay);
  let angle = 0;

  return (
    <section>
      <SectionTitle eyebrow="cycle rhythm" title="Where today sits in your cycle" />
      <Card padding="lg" interactive>
        <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:items-center">
          <div className="relative mx-auto size-[280px]">
            <svg viewBox="0 0 180 180" className="size-full">
              {phaseMeta.map((phase) => {
                const start = angle;
                const end = angle + (phase.days / cycleLength) * 360;
                const midpoint = start + (end - start) / 2;
                const labelPoint = polarToCartesian(82, midpoint);
                const lineStart = polarToCartesian(72, midpoint);
                const isSelected = selectedPhase === phase.name;
                angle = end;
                return (
                  <g key={phase.name}>
                    <motion.path
                      data-cursor-hover
                      d={describeArc(start, end - 2, 64)}
                      fill="none"
                      strokeWidth={isSelected ? 22 : 18}
                      strokeLinecap="round"
                      className={cn(phase.className, isSelected ? "opacity-100" : "opacity-55")}
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      whileTap={{ scale: 0.98 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => setSelectedPhase(phase.name)}
                    />
                    <line x1={lineStart.x} y1={lineStart.y} x2={labelPoint.x} y2={labelPoint.y} className="stroke-hairline" strokeWidth={1} />
                    <text
                      x={labelPoint.x}
                      y={labelPoint.y}
                      textAnchor={labelPoint.x > 90 ? "start" : "end"}
                      dominantBaseline="middle"
                      className={cn("fill-muted font-mono text-[7px] uppercase tracking-wider", isSelected && "fill-ink")}
                    >
                      {phase.name}
                    </text>
                  </g>
                );
              })}
              {data.cycleDay ? (
                <g>
                  <motion.circle
                    cx={dot.x}
                    cy={dot.y}
                    r={12}
                    className="fill-clay opacity-20"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <circle cx={dot.x} cy={dot.y} r={8} className="fill-card stroke-clay" strokeWidth={2} />
                  <circle cx={dot.x} cy={dot.y} r={4} className="fill-clay" />
                </g>
              ) : null}
              <text x="90" y="92" textAnchor="middle" className="fill-ink font-display text-[20px] italic">
                {day ? `Day ${day}` : "add dates"}
              </text>
              <text x="90" y="108" textAnchor="middle" className="fill-muted font-mono text-[7px] uppercase tracking-widest">
                current
              </text>
            </svg>
          </div>
          <div>
            <p className="font-display text-4xl italic text-clay">{displayPhase ?? "Add cycle info"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm uppercase tracking-widest text-muted">
                {day ? `Day ${day} of ${cycleLength}` : "Cycle day pending"}
              </span>
              <Chip tone={confidenceTone(data.cycleStatus?.confidence ?? data.cycleConfidence)}>{data.cycleStatus?.confidence ?? data.cycleConfidence ?? "unknown"} confidence</Chip>
            </div>
            <p className="mt-5 max-w-xl font-body text-sm leading-relaxed text-ink2">
              {phaseDescriptions[selectedPhase]}
            </p>
            {data.cycleDay ? (
              <div className="mt-6 rounded-2xl bg-paper/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-body text-sm font-semibold text-ink">{progress.meta.name} progress</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Day {progress.dayInPhase} of {data.cycleStatus?.phaseTotalDays ?? progress.meta.days}
                  </p>
                </div>
                <div className="mt-3 h-2 rounded-chip bg-shell">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progress.percent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("h-full rounded-chip", progress.meta.fillClassName)}
                  />
                </div>
                <p className="mt-2 font-body text-xs text-muted">
                  Day {progress.dayInPhase} of {data.cycleStatus?.phaseTotalDays ?? progress.meta.days} in {progress.meta.name} · {data.cycleStatus?.periodNotStartedYet ? "cycle running longer than average" : progress.meta.next}
                </p>
              </div>
            ) : null}
            <div className="mt-6 rounded-2xl border border-hairline bg-shell/60 p-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 text-clay" />
                <div>
                  <p className="font-body text-sm font-semibold text-ink">
                    {data.cycleStatus?.periodNotStartedYet
                      ? `Late Luteal · ~${data.cycleStatus.overdueDays} days overdue`
                      : nextPeriod
                        ? `Next period in ~${nextPeriod.days} days · around ${nextPeriod.date}`
                      : "Next period estimate appears after cycle onboarding"}
                  </p>
                  {data.cycleConfidence === "low" ? (
                    <p className="mt-1 font-body text-xs text-muted">(estimate - cycle is irregular)</p>
                  ) : null}
                  <p className={cn("mt-1 font-mono text-[9px] uppercase tracking-widest", data.cycleUpdatedToday ? "text-sage" : "text-muted")}>
                    {data.cycleUpdatedToday ? "Updated today" : "Log symptoms to improve accuracy →"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);
  const openModal = useAuthModalStore((state) => state.openModal);

  useEffect(() => {
    fetch("/api/analysis")
      .then((response) => {
        if (response.status === 401) {
          setGuest(true);
          return null;
        }
        if (!response.ok) {
          throw new Error("Unable to load analysis.");
        }
        return response.json() as Promise<AnalysisResponse>;
      })
      .then((payload) => payload && setData(payload))
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load analysis."),
      );
  }, []);

  return (
    <PageTransition>
      <div className="space-y-8">
        <PageHeader
          eyebrow="your wellness analysis"
          title="Analysis"
          subtitle="Calculated estimates from the context you have shared."
          action={<Link href="/app/setup" className="font-body text-sm text-clay transition-colors duration-150 hover:text-ink">Update onboarding</Link>}
        />
        <SafetyBanner
          tone="info"
          title="Wellness estimates only"
          body="These metrics are calculated from self-reported data. They are not medical measurements or clinical values."
        />

        {guest ? (
          <Card className="min-h-72">
            <EmptyState
              icon={<Activity className="size-8" />}
              title="Sign in to see your analysis"
              body="Your wellness estimates (BMI, BMR, cycle phase) appear here after onboarding."
              action={{ label: "Sign in", onClick: () => openModal("login") }}
            />
          </Card>
        ) : null}

        {error ? <QueryError error={new Error(error)} retry={() => window.location.reload()} /> : null}

        {!data && !error && !guest ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : null}

        {data ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10">
            {data.missingDataFor.length ? (
              <motion.div variants={fadeUp}>
                <Card className="flex flex-wrap items-center gap-2">
                  <span className="font-body text-sm text-muted">Missing data for:</span>
                  {data.missingDataFor.map((item) => <Badge key={item}>{item}</Badge>)}
                  <Button size="sm" variant="ghost" onClick={() => window.location.assign("/app/setup")}>Add in onboarding</Button>
                </Card>
              </motion.div>
            ) : null}
            <motion.div variants={fadeUp}><HeroSummary data={data} /></motion.div>
            <motion.div variants={fadeUp}><BodyComposition data={data} /></motion.div>
            <motion.div variants={fadeUp}><EnergyTargets data={data} /></motion.div>
            <motion.div variants={fadeUp}><CycleWheel data={data} /></motion.div>
          </motion.div>
        ) : null}
      </div>
    </PageTransition>
  );
}
