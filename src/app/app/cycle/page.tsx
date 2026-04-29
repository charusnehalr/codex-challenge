"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Check, Dumbbell, Sparkles, UtensilsCrossed } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Eyebrow,
  Modal,
  PageHeader,
  PageTransition,
  QueryError,
  SafetyBanner,
  SkeletonCard,
} from "@/components/ui";
import { ensureAuthenticated } from "@/lib/auth-guard";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

type CycleLog = {
  id: string;
  date: string;
  is_period_day: boolean;
  period_not_started_yet?: boolean | null;
  flow_level: string | null;
  pain_score: number | null;
  symptoms: string[] | null;
  mood: string | null;
  energy_score: number | null;
  notes: string | null;
  phase?: string;
  cycleDay?: number;
};

type CycleProfile = {
  last_period_start: string | null;
  average_cycle_length: number | null;
  cycle_regular: string | null;
};

type CycleResponse = {
  cycleProfile: CycleProfile | null;
  todayLog: CycleLog | null;
  logs: CycleLog[];
  cycleDay?: number;
  cyclePhase: string;
  cycleConfidence: "low" | "medium" | "high";
  nextPeriodEstimate?: string;
  daysUntilNextPeriod?: number;
  cycleStatus: {
    cycleDay: number;
    cyclePhase: PhaseName;
    cycleLength: number;
    confidence: "low" | "medium" | "high";
    nextPeriodDate: string | null;
    daysUntilNextPeriod: number;
    phaseProgressPercent: number;
    phaseDay: number;
    phaseTotalDays: number;
    isConfirmedPeriodDay: boolean;
    periodNotStartedYet: boolean;
    isPeriodExpected: boolean;
    overdueDays: number;
  };
};

type PhaseName = "Menstrual" | "Follicular" | "Ovulation" | "Luteal" | "Late Luteal" | "Unknown";

const phaseInfo: Record<PhaseName, string> = {
  Menstrual:
    "The uterine lining sheds during this phase. Many women notice lower energy, cramps, or a need for more rest - this is completely normal. Gentle movement like walking, yoga, or stretching tends to feel best. Karigai will suggest lower-intensity workouts and iron-supportive meals.",
  Follicular:
    "Oestrogen begins rising. Energy often improves through this phase, and focus may feel sharper. It is often a good time for strength training and trying new routines. Karigai may suggest higher-intensity options as your energy builds.",
  Ovulation:
    "Oestrogen peaks around this time. Many women feel their best - highest energy, clearest mood, strongest workouts. A short phase but often a productive one. Karigai will suggest your highest-intensity options here.",
  Luteal:
    "Progesterone rises after ovulation. Energy often shifts, especially in the second half of this phase. Cravings, bloating, or mood changes are common and normal. Karigai adjusts suggestions as your symptoms change day to day.",
  "Late Luteal":
    "Your cycle may be running longer than average. This can happen for many reasons, including stress, sleep changes, travel, or hormone shifts. Keep logging symptoms, and if your period is significantly late, it may be worth speaking with a doctor.",
  Unknown:
    "Add cycle information to help Karigai estimate your phase. Until then, symptom logs are the most useful signal. You can still track pain, flow, energy, mood, and notes daily.",
};

const phaseTips: Record<PhaseName, { movement: string; nutrition: string; mood: string; hero: string }> = {
  Menstrual: {
    movement: "Gentle yoga, walking, or rest. Avoid high-intensity today if your body asks for softness.",
    nutrition: "Iron-rich foods may help - lentils, spinach, tofu, and steady hydration.",
    mood: "Lower energy is common. A slower pace can still be a strong choice.",
    hero: "Rest and gentle movement tend to feel best today.",
  },
  Follicular: {
    movement: "Light to moderate work can feel good - a useful day to add strength training.",
    nutrition: "Light, energising meals and varied nutrition may feel supportive.",
    mood: "Energy often builds here. Use that lift, but keep listening to your logs.",
    hero: "Energy may be building - a good day for steady momentum.",
  },
  Ovulation: {
    movement: "Higher energy phase for many - HIIT or strength training may feel great.",
    nutrition: "Balanced macros and anti-inflammatory foods can be helpful.",
    mood: "This can be a bright, focused window. Let your actual energy score lead.",
    hero: "Peak energy is common, if it feels right for you.",
  },
  Luteal: {
    movement: "Listen to your body - moderate cardio, mobility, or strength can work well.",
    nutrition: "Protein and complex carbs may help with cravings and mood.",
    mood: "Cravings and mood changes are common. You are not doing anything wrong.",
    hero: "Keep things steady and responsive today.",
  },
  "Late Luteal": {
    movement: "Keep movement gentle and flexible while you wait for clearer cycle signals.",
    nutrition: "Steady meals, protein, and hydration can help while symptoms shift.",
    mood: "A late period can feel uncertain. Logging symptoms helps Karigai stay accurate.",
    hero: "Still waiting - Karigai will keep tracking from your logs.",
  },
  Unknown: {
    movement: "Track symptoms first. Karigai will avoid over-relying on predictions.",
    nutrition: "Balanced meals and hydration are useful while cycle context is incomplete.",
    mood: "A simple log today makes tomorrow's guidance smarter.",
    hero: "Add cycle info to unlock phase-aware guidance.",
  },
};

const phaseMeta: Array<{
  name: Exclude<PhaseName, "Unknown">;
  days: number;
  startDay: number;
  endDay: number;
  strokeClassName: string;
  fillClassName: string;
  bannerClassName: string;
  chipTone: "blush" | "sage" | "clay" | "bone";
  next: string;
}> = [
  {
    name: "Menstrual",
    days: 5,
    startDay: 1,
    endDay: 5,
    strokeClassName: "stroke-blush",
    fillClassName: "bg-blush",
    bannerClassName: "bg-blush/15",
    chipTone: "blush",
    next: "Follicular phase approaching",
  },
  {
    name: "Follicular",
    days: 8,
    startDay: 6,
    endDay: 13,
    strokeClassName: "stroke-sage",
    fillClassName: "bg-sage",
    bannerClassName: "bg-sageSoft/20",
    chipTone: "sage",
    next: "Ovulation approaching",
  },
  {
    name: "Ovulation",
    days: 3,
    startDay: 14,
    endDay: 16,
    strokeClassName: "stroke-clay",
    fillClassName: "bg-clay",
    bannerClassName: "bg-claySoft/25",
    chipTone: "clay",
    next: "Luteal phase approaching",
  },
  {
    name: "Luteal",
    days: 12,
    startDay: 17,
    endDay: 28,
    strokeClassName: "stroke-bone",
    fillClassName: "bg-bone",
    bannerClassName: "bg-bone/30",
    chipTone: "bone",
    next: "Menstrual phase approaching",
  },
];

const symptomOptions = [
  "Cramps",
  "Bloating",
  "Fatigue",
  "Acne",
  "Mood changes",
  "Cravings",
  "Spotting",
  "Headaches",
  "Back pain",
  "Low energy",
  "Nausea",
  "Other",
];

const moodOptions = [
  { value: "great", label: "Great", emoji: "😊" },
  { value: "good", label: "Good", emoji: "😌" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "low", label: "Low", emoji: "😔" },
  { value: "anxious", label: "Anxious", emoji: "😤" },
  { value: "irritable", label: "Irritable", emoji: "😠" },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromIso(value: string) {
  return new Date(`${value}T00:00:00`);
}

function friendlyDate(value: string, withYear = false) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: withYear ? "numeric" : undefined,
  }).format(dateFromIso(value));
}

function fullFriendlyToday() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function normalizePhase(phase: string): PhaseName {
  return phase === "Menstrual" || phase === "Follicular" || phase === "Ovulation" || phase === "Luteal" || phase === "Late Luteal" ? phase : "Unknown";
}

function getPhaseMeta(phase: string) {
  return phaseMeta.find((item) => item.name === phase);
}

function getPhaseProgress(phase: string, cycleDay?: number) {
  const meta = phase === "Late Luteal" ? phaseMeta[3] : getPhaseMeta(phase) ?? phaseMeta[0];
  const dayInPhase = cycleDay ? Math.min(meta.days, Math.max(1, cycleDay - meta.startDay + 1)) : 0;
  return {
    meta,
    dayInPhase,
    percent: meta.days ? (dayInPhase / meta.days) * 100 : 0,
    daysRemaining: Math.max(0, meta.endDay - (cycleDay ?? meta.startDay)),
  };
}

function nextPeriodSummary(cycleDay?: number, cycleLength = 28) {
  if (!cycleDay) {
    return null;
  }
  const days = Math.max(0, cycleLength - cycleDay);
  if (days === 0) {
    return { text: "Period may be starting today", date: "today" };
  }
  const target = new Date();
  target.setDate(target.getDate() + days);
  return {
    text: `Next period in ~${days} days`,
    date: `around ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(target)}`,
  };
}

async function fetchCycle() {
  const response = await fetch("/api/cycle");

  if (!response.ok) {
    throw new Error("Unable to load cycle tracker.");
  }

  return (await response.json()) as CycleResponse;
}

function confidenceTone(confidence: string) {
  if (confidence === "high") {
    return "sage";
  }
  if (confidence === "low") {
    return "neutral";
  }
  return "neutral";
}

function polarToCartesian(radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: 90 + radius * Math.cos(angleInRadians),
    y: 90 + radius * Math.sin(angleInRadians),
  };
}

function describeArc(startAngle: number, endAngle: number, radius: number) {
  const start = polarToCartesian(radius, endAngle);
  const end = polarToCartesian(radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function PhaseHero({ data }: { data: CycleResponse }) {
  const phase = normalizePhase(data.cyclePhase);
  const meta = getPhaseMeta(phase);
  const cycleLength = data.cycleProfile?.average_cycle_length ?? 28;
  const countdown = data.cycleStatus.periodNotStartedYet
    ? { text: `Day ${data.cycleStatus.cycleDay} · ~${data.cycleStatus.overdueDays} days overdue`, date: "cycle running longer than average" }
    : nextPeriodSummary(data.cycleStatus.cycleDay, cycleLength);

  return (
    <Card padding="md" interactive className={cn("rounded-2xl", meta?.bannerClassName ?? "bg-shell/40")}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.1fr] lg:items-center">
        <div>
          <Eyebrow>your cycle · today</Eyebrow>
          <h2 className="mt-2 font-display text-4xl italic leading-tight text-clay">{phase}</h2>
          <p className="mt-1 font-mono text-sm uppercase tracking-widest text-muted">
            {data.cycleStatus.cycleDay ? `Day ${data.cycleStatus.cycleDay} of ${cycleLength}${data.cycleConfidence === "low" ? " (irregular)" : ""} · ${phase} phase` : "Add cycle dates · phase pending"}
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-card/70 px-4 py-3">
          <CalendarDays className="mt-1 size-4 text-clay" />
          <div>
            <p className="font-body text-sm font-semibold text-ink">{countdown?.text ?? "Next period estimate pending"}</p>
            <p className="mt-0.5 font-mono text-xs uppercase tracking-widest text-muted">{countdown?.date ?? "after cycle onboarding"}</p>
          </div>
        </div>
        <div className="lg:text-right">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Chip tone={meta?.chipTone ?? "neutral"}>{phase} phase</Chip>
            <Chip tone={confidenceTone(data.cycleStatus.confidence)}>{data.cycleStatus.confidence} confidence</Chip>
            <Chip tone="clay">{data.cycleStatus.cycleDay ? `Day ${data.cycleStatus.cycleDay}` : "Day pending"}</Chip>
          </div>
          <p className="mt-3 font-body text-xs italic leading-relaxed text-muted">{phaseTips[phase].hero}</p>
        </div>
      </div>
    </Card>
  );
}

function MiniCycleWheel({ data }: { data: CycleResponse }) {
  const phase = normalizePhase(data.cycleStatus.cyclePhase);
  const progress = data.cycleStatus.phaseTotalDays
    ? {
        meta: phase === "Late Luteal" ? phaseMeta[3] : getPhaseMeta(phase) ?? phaseMeta[0],
        dayInPhase: data.cycleStatus.phaseDay,
        percent: data.cycleStatus.phaseProgressPercent,
        daysRemaining: Math.max(0, data.cycleStatus.phaseTotalDays - data.cycleStatus.phaseDay),
      }
    : getPhaseProgress(phase, data.cycleStatus.cycleDay);
  const day = data.cycleStatus.cycleDay || 1;
  const dotAngle = (Math.min(28, Math.max(1, day)) / 28) * 360;
  const dot = polarToCartesian(56, dotAngle);
  let angle = 0;

  if (!data.cycleProfile?.last_period_start) {
    return (
      <Card padding="lg" className="min-h-[420px]">
        <EmptyState
          icon={<CalendarDays className="size-8" />}
          title="No cycle data yet"
          body="Add your cycle information to unlock phase estimates and countdowns."
          action={{ label: "Add cycle information", onClick: () => window.location.assign("/app/setup?section=4") }}
        />
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-5">
      <div className="mx-auto size-[220px]">
        <svg viewBox="0 0 180 180" className="size-full">
          {phaseMeta.map((item) => {
            const start = angle;
            const end = angle + (item.days / 28) * 360;
            const midpoint = start + (end - start) / 2;
            const label = polarToCartesian(78, midpoint);
            const line = polarToCartesian(68, midpoint);
            const active = item.name === phase;
            angle = end;

            return (
              <g key={item.name}>
                <motion.path
                  d={describeArc(start, end - 2, 56)}
                  fill="none"
                  strokeWidth={active ? 19 : 16}
                  strokeLinecap="round"
                  className={cn(item.strokeClassName, active ? "opacity-100" : "opacity-50")}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                />
                <line x1={line.x} y1={line.y} x2={label.x} y2={label.y} className="stroke-hairline" strokeWidth={1} />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor={label.x > 90 ? "start" : "end"}
                  dominantBaseline="middle"
                  className={cn("fill-muted font-mono text-[7px] uppercase tracking-wider", active && "fill-ink")}
                >
                  {item.name}
                </text>
              </g>
            );
          })}
          {data.cycleStatus.cycleDay ? (
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
            {data.cycleStatus.cycleDay ? `Day ${data.cycleStatus.cycleDay}` : "Cycle"}
          </text>
        </svg>
      </div>
      <div className="rounded-2xl bg-paper/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-body text-sm font-semibold text-ink">
            Day {progress.dayInPhase} of {progress.meta.days} in {progress.meta.name} phase
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{Math.round(progress.percent)}%</p>
        </div>
        <div className="mt-3 h-1.5 rounded-chip bg-shell">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${progress.percent}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn("h-full rounded-chip", progress.meta.fillClassName)}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          {progress.meta.next} in ~{progress.daysRemaining} days
        </p>
      </div>
      <div className="rounded-2xl border border-hairline bg-card p-4">
        <Eyebrow>about this phase</Eyebrow>
        <h3 className="mt-2 font-display text-2xl italic text-ink">{phase}</h3>
        <p className="mt-3 font-body text-sm leading-relaxed text-muted">{phaseInfo[phase]}</p>
        {data.cycleConfidence === "low" ? (
          <p className="mt-3 rounded-xl bg-shell p-3 font-body text-xs leading-relaxed text-muted">
            Predictions are lower confidence for irregular cycles - your symptom logs are more reliable than date estimates.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function scoreLabel(score: number, kind: "pain" | "energy") {
  if (kind === "pain") {
    if (score === 0) return "No pain";
    if (score <= 2) return "Mild";
    if (score <= 4) return "Noticeable";
    if (score <= 6) return "Moderate";
    if (score <= 8) return "Significant";
    return "Severe";
  }
  if (score <= 2) return "Exhausted";
  if (score <= 4) return "Low";
  if (score <= 6) return "Moderate";
  if (score <= 8) return "Good";
  return "High energy";
}

function scoreCircleClass(score: number, selected: boolean, kind: "pain" | "energy") {
  if (!selected) {
    return "border border-hairline bg-shell text-muted hover:bg-card";
  }
  if (kind === "pain") {
    if (score <= 2) return "border border-sage bg-sageSoft text-sage";
    if (score <= 5) return "border border-bone bg-bone text-ink";
    if (score <= 7) return "border border-amber bg-amber/20 text-amber";
    return "border border-alert bg-alert/15 text-alert";
  }
  if (score <= 3) return "border border-alert bg-alert/10 text-alert";
  if (score <= 6) return "border border-bone bg-bone text-ink";
  return "border border-sage bg-sageSoft text-sage";
}

function ScorePicker({
  label,
  value,
  onChange,
  kind,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  kind: "pain" | "energy";
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-body text-sm font-semibold text-ink">{label}</p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {value} · {scoreLabel(value, kind)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 11 }, (_, score) => {
          const selected = value === score;
          return (
            <motion.button
              key={score}
              type="button"
              data-cursor-hover
              whileTap={{ scale: 0.92 }}
              animate={{ scale: selected ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              onClick={() => onChange(score)}
              className={cn(
                "grid rounded-full font-mono text-xs transition-colors duration-150",
                selected ? "size-[42px] shadow-[0_4px_14px_rgba(31,27,22,0.12)]" : "size-9",
                scoreCircleClass(score, selected, kind),
              )}
            >
              <span className="place-self-center">{score}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodDueCard({ data, onSaved }: { data: CycleResponse; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function refreshCycleQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cycle"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["analysis"] }),
    ]);
    onSaved();
  }

  async function markStarted() {
    if (!(await ensureAuthenticated("signup"))) return;
    setSaving(true);
    const today = todayIsoDate();
    await fetch("/api/cycle/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date: today, isPeriodDay: true, confirmedStart: true }),
    });
    await fetch("/api/cycle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ last_period_start: today }),
    });
    setSaving(false);
    await refreshCycleQueries();
  }

  async function markWaiting() {
    if (!(await ensureAuthenticated("signup"))) return;
    setSaving(true);
    await fetch("/api/cycle/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date: todayIsoDate(), isPeriodDay: false, periodNotStartedYet: true }),
    });
    setSaving(false);
    await refreshCycleQueries();
  }

  if (!data.cycleStatus.isPeriodExpected && !data.cycleStatus.periodNotStartedYet) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-claySoft bg-claySoft/20 p-4">
      <p className="font-body text-sm font-semibold text-ink">
        {data.cycleStatus.periodNotStartedYet ? "Noted - still tracking" : "Your period may be due"}
      </p>
      <p className="mt-1 font-body text-xs leading-relaxed text-muted">
        {data.cycleStatus.periodNotStartedYet
          ? "Karigai will keep using your last confirmed start date. Let us know when it starts."
          : "Based on your cycle history, your period may have started. Let Karigai know so tracking stays accurate."}
      </p>
      <div className="mt-3 grid gap-2">
        <Button variant="accent" size="sm" loading={saving} onClick={() => void markStarted()}>
          Yes, my period started today
        </Button>
        {!data.cycleStatus.periodNotStartedYet ? (
          <Button variant="ghost" size="sm" loading={saving} onClick={() => void markWaiting()}>
            Not yet - still waiting
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function TodayLogForm({ data, todayLog, onSaved }: { data: CycleResponse; todayLog: CycleLog | null; onSaved: () => void }) {
  const [isPeriodDay, setIsPeriodDay] = useState(false);
  const [flowLevel, setFlowLevel] = useState("moderate");
  const [painScore, setPainScore] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState("neutral");
  const [energyScore, setEnergyScore] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setIsPeriodDay(Boolean(todayLog?.is_period_day));
    setFlowLevel(todayLog?.flow_level ?? "moderate");
    setPainScore(todayLog?.pain_score ?? 0);
    setSymptoms(todayLog?.symptoms ?? []);
    setMood(todayLog?.mood ?? "neutral");
    setEnergyScore(todayLog?.energy_score ?? 5);
    setNotes(todayLog?.notes ?? "");
  }, [todayLog]);

  async function saveLog() {
    if (!(await ensureAuthenticated("signup"))) {
      return;
    }

    setSaving(true);
    const response = await fetch("/api/cycle/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        date: todayIsoDate(),
        isPeriodDay,
        flowLevel: isPeriodDay ? flowLevel : undefined,
        confirmedStart: isPeriodDay && data.cycleStatus.cycleDay >= data.cycleStatus.cycleLength - 3,
        painScore,
        symptoms,
        mood,
        energyScore,
        notes,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
    onSaved();
  }

  return (
    <Card padding="lg" className="scrollbar-hide max-h-[600px] space-y-6 overflow-y-auto">
      <div>
        <h2 className="font-display text-3xl italic text-ink">How are you feeling today?</h2>
        <p className="mt-1 font-mono text-sm uppercase tracking-widest text-muted">{fullFriendlyToday()}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Not a period day", value: false },
          { label: "Yes, period day", value: true },
        ].map((option) => {
          const active = isPeriodDay === option.value;
          return (
            <motion.button
              key={option.label}
              type="button"
              data-cursor-hover
              whileTap={{ scale: 0.97 }}
              animate={{ scale: active ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              onClick={() => setIsPeriodDay(option.value)}
              className={cn(
                "h-11 rounded-xl border font-body text-sm transition-all duration-150",
                active ? "border-clay bg-clay text-cream" : "border-hairline bg-shell text-muted hover:bg-card hover:text-ink",
              )}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>

      {isPeriodDay ? (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <p className="mb-2 font-body text-sm font-semibold text-ink">Flow level</p>
          <div className="grid grid-cols-3 gap-2">
            {["light", "moderate", "heavy"].map((flow) => {
              const active = flowLevel === flow;
              return (
                <motion.button
                  key={flow}
                  type="button"
                  data-cursor-hover
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFlowLevel(flow)}
                  className={cn(
                    "h-10 rounded-xl border font-body text-sm capitalize transition-all duration-150",
                    active ? "border-clay bg-claySoft text-ink" : "border-hairline bg-shell text-muted hover:bg-card hover:text-ink",
                  )}
                >
                  {flow}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ) : null}

      <ScorePicker label="Pain level" value={painScore} onChange={setPainScore} kind="pain" />
      {painScore >= 8 ? (
        <SafetyBanner
          tone="alert"
          title="Severe pain"
          body="Severe pain is worth discussing with a doctor, especially if recurring."
        />
      ) : null}

      <div>
        <p className="mb-3 font-body text-sm font-semibold text-ink">Symptoms</p>
        <div className="flex flex-wrap gap-2">
          {symptomOptions.map((symptom) => {
            const selected = symptoms.includes(symptom);
            return (
              <motion.button
                key={symptom}
                type="button"
                data-cursor-hover
                whileTap={{ scale: 0.96 }}
                animate={{ scale: selected ? 1.04 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                onClick={() =>
                  setSymptoms((current) =>
                    selected ? current.filter((item) => item !== symptom) : [...current, symptom],
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-chip border px-3 py-1 font-body text-[11px] font-medium transition-colors duration-150",
                  selected ? "border-clay bg-clay text-cream" : "border-hairline bg-shell text-muted hover:bg-card hover:text-ink",
                )}
              >
                {selected ? <Check className="size-3" /> : null}
                {symptom}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 font-body text-sm font-semibold text-ink">Mood</p>
        <div className="grid grid-cols-3 gap-2">
          {moodOptions.map((option) => {
            const selected = mood === option.value;
            return (
              <motion.button
                key={option.value}
                type="button"
                data-cursor-hover
                whileTap={{ scale: 0.96 }}
                animate={{ scale: selected ? 1.03 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                onClick={() => setMood(option.value)}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center rounded-xl border transition-colors duration-150",
                  selected ? "border-clay bg-claySoft" : "border-hairline bg-shell hover:bg-card",
                )}
              >
                <span className="text-2xl" aria-hidden="true">{option.emoji}</span>
                <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">{option.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <ScorePicker label="Energy level" value={energyScore} onChange={setEnergyScore} kind="energy" />

      <label className="block font-body text-sm text-ink">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anything else to note today..."
          className="max-h-[120px] min-h-20 w-full rounded-xl border border-hairline bg-card p-4 font-body text-sm outline-none transition-all duration-150 placeholder:text-muted focus:border-clay focus:ring-2 focus:ring-clay/15"
        />
      </label>

      <Button variant={saved ? "ghost" : "accent"} size="lg" onClick={saveLog} loading={saving} className="w-full">
        {saved ? "Saved ✓" : "Save today ✓"}
      </Button>
    </Card>
  );
}

function InsightCard({ icon, title, body, href }: { icon: ReactNode; title: string; body: string; href?: string }) {
  return (
    <Card padding="sm" interactive className="min-h-40">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-shell text-clay">{icon}</span>
        <div>
          <h3 className="font-body text-base font-semibold text-ink">{title}</h3>
          <p className="mt-2 font-body text-sm leading-relaxed text-muted">{body}</p>
          {href ? (
            <Link href={href} className="mt-3 inline-block font-body text-sm text-clay transition-colors duration-150 hover:text-ink">
              {href.includes("workout") ? "See workout" : "See meals"} →
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function PhaseInsights({ phase }: { phase: PhaseName }) {
  const tips = phaseTips[phase];

  return (
    <section>
      <div className="mb-4">
        <Eyebrow>what karigai adjusted for today</Eyebrow>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <InsightCard icon={<Dumbbell className="size-4" />} title="Today's movement" body={tips.movement} href="/app/workout" />
        <InsightCard icon={<UtensilsCrossed className="size-4" />} title="Nutrition focus" body={tips.nutrition} href="/app/meals" />
        <InsightCard icon={<Sparkles className="size-4" />} title="Mood & energy" body={tips.mood} />
      </div>
    </section>
  );
}

function logTone(log: CycleLog | null, iso: string) {
  if (iso === todayIsoDate()) return "border-clay bg-clay";
  if (!log) return "border-hairline bg-shell";
  if (log.is_period_day) return "border-blush bg-blush";
  if ((log.pain_score ?? 0) >= 7) return "border-alert bg-alert/30";
  if ((log.energy_score ?? 10) <= 3) return "border-ink/20 bg-ink/10";
  return "border-sage bg-sageSoft";
}

function LogTooltip({ log, date }: { log: CycleLog | null; date: string }) {
  return (
    <div className="absolute bottom-14 left-1/2 z-30 hidden w-56 -translate-x-1/2 rounded-xl bg-ink p-3 text-left text-cream shadow-xl group-hover:block">
      <p className="font-body text-sm font-semibold">{friendlyDate(date)}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cream/70">{log?.phase ?? "No log yet"}</p>
      {log ? (
        <div className="mt-2 space-y-1 font-body text-xs leading-relaxed text-cream/80">
          <p>Pain: {log.pain_score ?? 0}</p>
          <p>Energy: {log.energy_score ?? "not logged"}</p>
          <p>{log.symptoms?.slice(0, 3).join(", ") || "No symptoms logged"}</p>
        </div>
      ) : null}
    </div>
  );
}

function CycleHistory({ logs }: { logs: CycleLog[] }) {
  const [selectedLog, setSelectedLog] = useState<CycleLog | null>(null);
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (13 - index));
      const iso = isoDate(date);
      return {
        iso,
        day: date.getDate(),
        log: logs.find((item) => item.date === iso) ?? null,
      };
    });
  }, [logs]);

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>cycle history</Eyebrow>
          <h2 className="mt-2 font-display text-2xl italic text-ink">Last 14 days</h2>
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest text-muted">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-blush" />Period</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-alert/30 ring-1 ring-alert" />High pain</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-ink/10 ring-1 ring-ink/20" />Low energy</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-sageSoft ring-1 ring-sage" />Logged</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-shell ring-1 ring-hairline" />Not logged</span>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {days.map((day) => (
          <button
            key={day.iso}
            type="button"
            data-cursor-hover
            onClick={() => setSelectedLog(day.log)}
            className="group relative flex min-w-12 flex-col items-center gap-2"
          >
            <span className={cn("relative grid size-10 place-items-center rounded-full border-2 font-mono text-xs text-ink", logTone(day.log, day.iso))}>
              {day.iso === todayIsoDate() ? (
                <motion.span
                  className="absolute inset-0 rounded-full bg-clay/20"
                  animate={{ scale: [1, 1.45, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
              <span className="relative">{day.day}</span>
            </span>
            <span className="font-mono text-[10px] text-muted">{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(dateFromIso(day.iso))}</span>
            <LogTooltip log={day.log} date={day.iso} />
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="font-mono text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Phase</th>
              <th className="py-2">Pain</th>
              <th className="py-2">Energy</th>
              <th className="py-2">Key symptoms</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm text-ink2">
            {logs.slice(0, 8).map((log) => {
              const phase = normalizePhase(log.phase ?? "Unknown");
              const meta = getPhaseMeta(phase);
              const symptoms = log.symptoms ?? [];
              return (
                <tr key={log.id} className="border-t border-hairline">
                  <td className="py-3">{friendlyDate(log.date)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", meta?.fillClassName ?? "bg-shell")} />
                      {phase}
                    </span>
                  </td>
                  <td className={cn("py-3 font-mono", (log.pain_score ?? 0) >= 7 ? "text-alert" : "text-sage")}>{log.pain_score ?? "-"}</td>
                  <td className={cn("py-3 font-mono", (log.energy_score ?? 10) <= 3 ? "text-alert" : "text-sage")}>{log.energy_score ?? "-"}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {symptoms.slice(0, 2).map((symptom) => <Chip key={symptom} tone="neutral">{symptom}</Chip>)}
                      {symptoms.length > 2 ? <Chip tone="bone">+ {symptoms.length - 2} more</Chip> : null}
                      {!symptoms.length ? <span className="text-muted">none</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} title={selectedLog ? friendlyDate(selectedLog.date, true) : "Cycle log"}>
        {selectedLog ? (
          <div className="space-y-3 font-body text-sm text-ink2">
            <p>Phase: {selectedLog.phase ?? "Unknown"}</p>
            <p>Period day: {selectedLog.is_period_day ? "Yes" : "No"}</p>
            <p>Flow: {selectedLog.flow_level ?? "Not logged"}</p>
            <p>Pain: {selectedLog.pain_score ?? "Not logged"}</p>
            <p>Energy: {selectedLog.energy_score ?? "Not logged"}</p>
            <p>Symptoms: {selectedLog.symptoms?.join(", ") || "none"}</p>
            {selectedLog.notes ? <p>Notes: {selectedLog.notes}</p> : null}
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}

function CycleSafetyBanners({ todayLog }: { todayLog: CycleLog | null }) {
  const symptoms = todayLog?.symptoms?.map((symptom) => symptom.toLowerCase()) ?? [];

  return (
    <div className="space-y-3">
      {(todayLog?.pain_score ?? 0) >= 8 ? (
        <SafetyBanner
          tone="alert"
          title="Severe pain noted"
          body="Period pain at this level is worth discussing with a doctor, especially if recurring."
        />
      ) : null}
      {todayLog?.flow_level === "heavy" && symptoms.includes("dizziness") ? (
        <SafetyBanner
          tone="alert"
          title="Heavy flow with dizziness"
          body="Heavy bleeding combined with dizziness may need medical attention. Consider speaking with a healthcare professional soon."
        />
      ) : null}
    </div>
  );
}

export default function CyclePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cycle"],
    queryFn: fetchCycle,
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="cycle"
          title="Cycle Tracker"
          subtitle="Track phases, symptoms, pain, flow, mood, and energy in one place."
        />
        {isLoading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard />
          </div>
        ) : null}
        {error ? <QueryError error={error} retry={() => void refetch()} /> : null}
        {data ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp}><PhaseHero data={data} /></motion.div>
            <motion.div variants={fadeUp}>
              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <MiniCycleWheel data={data} />
                  <CycleSafetyBanners todayLog={data.todayLog} />
                </div>
                <div className="space-y-4">
                  <PeriodDueCard data={data} onSaved={() => void refetch()} />
                  <TodayLogForm data={data} todayLog={data.todayLog} onSaved={() => void refetch()} />
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp}><PhaseInsights phase={normalizePhase(data.cyclePhase)} /></motion.div>
            <motion.div variants={fadeUp}><CycleHistory logs={data.logs} /></motion.div>
            <p className="font-body text-xs text-muted">
              Onboarding details live in <Link href="/app/setup?section=4" className="text-clay transition-colors duration-150 hover:text-ink">cycle onboarding</Link>.
            </p>
          </motion.div>
        ) : null}
      </div>
    </PageTransition>
  );
}
