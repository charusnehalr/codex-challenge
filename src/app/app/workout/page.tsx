"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Check,
  ChevronDown,
  Dumbbell,
  Flower2,
  Footprints,
  Heart,
  Moon,
  PersonStanding,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { Button, Card, Chip, Eyebrow, QueryError, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { ensureAuthenticated } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast.store";
import type { WorkoutPlan } from "@/lib/workout-engine";
import type { WorkoutLog } from "@/types/user";

type WorkoutContext = {
  phase?: string;
  energyScore?: number;
  healthFlags: string[];
};

type WorkoutResponse = {
  plan: WorkoutPlan;
  backupWorkout: WorkoutPlan;
  completed: boolean;
  skippedReason?: string | null;
  feedback?: string | null;
  history: WorkoutLog[];
  context?: WorkoutContext;
};

type GenerateOptions = {
  focusArea: string;
  durationMinutes: number;
  energyLevel: string;
  extraNotes: string;
};

async function fetchWorkout() {
  const response = await fetch("/api/workout/today", { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load workout.");
  return (await response.json()) as WorkoutResponse;
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFriendlyDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function exerciseIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("walk")) return Footprints;
  if (lower.includes("yoga") || lower.includes("breath")) return Flower2;
  if (lower.includes("stretch") || lower.includes("mobility")) return PersonStanding;
  if (lower.includes("squat") || lower.includes("row") || lower.includes("push") || lower.includes("strength")) return Dumbbell;
  return Activity;
}

function exerciseMeta(exercise: WorkoutPlan["exercises"][number]) {
  return exercise.duration ?? [exercise.sets ? `${exercise.sets} sets` : "", exercise.reps ?? ""].filter(Boolean).join(" x ");
}

function ExerciseRow({ exercise, index }: { exercise: WorkoutPlan["exercises"][number]; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = exerciseIcon(exercise.name);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      className="rounded-xl border border-hairline bg-card/80"
    >
      <button
        type="button"
        data-cursor-hover
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150 hover:bg-shell/40"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon className="size-4 shrink-0 text-sage" />
          <span className="font-mono text-[10px] text-muted">{String(index + 1).padStart(2, "0")}</span>
          <span className="truncate font-body text-sm font-medium text-ink">{exercise.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-xs text-muted">{exerciseMeta(exercise)}</span>
          <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && exercise.notes ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-3 pb-3"
          >
            <span className="block rounded-lg bg-shell/55 px-3 py-2 font-body text-xs italic leading-5 text-muted">
              {exercise.notes}
            </span>
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function CustomWorkoutPanel({
  onGenerate,
  loading,
  className,
}: {
  onGenerate: (options: GenerateOptions) => void;
  loading: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focusArea, setFocusArea] = useState("Full body");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [energyLevel, setEnergyLevel] = useState("Moderate");
  const [extraNotes, setExtraNotes] = useState("");
  const focusOptions = ["Upper body", "Lower body", "Full body", "Core", "Flexibility", "Cardio"];
  const durationOptions = [15, 30, 45, 60];
  const energyOptions = ["Low", "Moderate", "High"];

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="h-8 border-hairline px-3 text-xs" onClick={() => setOpen((value) => !value)}>
          <Sparkles className="size-3.5" /> Customise with AI
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-hairline bg-shell/40 p-4">
              <ChipSelector label="Focus" value={focusArea} options={focusOptions} onChange={setFocusArea} tone="sage" />
              <ChipSelector label="Duration" value={`${durationMinutes} min`} options={durationOptions.map((option) => `${option} min`)} onChange={(value) => setDurationMinutes(Number.parseInt(value, 10))} tone="clay" />
              <ChipSelector label="Energy" value={energyLevel} options={energyOptions} onChange={setEnergyLevel} tone="sage" />
              <input
                value={extraNotes}
                onChange={(event) => setExtraNotes(event.target.value)}
                placeholder="e.g. lower back issue today, prefer no jumping"
                className="mt-3 h-9 w-full rounded-xl border border-hairline bg-card px-3 font-body text-xs text-ink outline-none transition-all focus:border-clay focus:ring-2 focus:ring-clay/15"
              />
              <Button
                variant="accent"
                size="sm"
                loading={loading}
                className="mt-3 w-full"
                onClick={() => onGenerate({ focusArea, durationMinutes, energyLevel, extraNotes })}
              >
                {loading ? "Karigai is building your workout..." : "Generate workout"}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ChipSelector({
  label,
  value,
  options,
  onChange,
  tone,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  tone: "sage" | "clay";
}) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const selected = value === option;
          return (
            <motion.button
              key={option}
              type="button"
              data-cursor-hover
              whileTap={{ scale: 0.95 }}
              animate={{ scale: selected ? 1.04 : 1 }}
              onClick={() => onChange(option)}
              className={cn(
                "h-7 rounded-chip border px-2.5 font-body text-[10px] transition-colors",
                selected
                  ? tone === "sage"
                    ? "border-sage bg-sage text-cream"
                    : "border-clay bg-clay text-cream"
                  : "border-hairline bg-shell text-muted hover:text-ink",
              )}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackInline({ onSave }: { onSave: (feedback: string) => void }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-3 flex flex-wrap items-center gap-4 overflow-hidden rounded-xl bg-sageSoft/20 p-3"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <motion.button key={value} type="button" data-cursor-hover whileTap={{ scale: 0.85 }} onClick={() => setRating(value)}>
            <Star className={cn("size-4", value <= rating ? "fill-amber text-amber" : "text-muted")} />
          </motion.button>
        ))}
      </div>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Quick note..."
        className="h-8 max-w-[220px] flex-1 border-b border-hairline bg-transparent font-body text-xs outline-none focus:border-clay"
      />
      <button type="button" data-cursor-hover className="ml-auto font-body text-xs text-clay hover:underline" onClick={() => onSave(`${rating}/5 ${note}`.trim())}>
        Save feedback
      </button>
    </motion.div>
  );
}

function WorkoutPlanCard({
  plan,
  completed,
  aiGenerated,
  generating,
  onComplete,
  onGenerate,
}: {
  plan: WorkoutPlan;
  completed: boolean;
  aiGenerated: boolean;
  generating: boolean;
  onComplete: (feedback?: string, skippedReason?: string, completed?: boolean) => void;
  onGenerate: (options?: GenerateOptions) => void;
}) {
  const [skipOpen, setSkipOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [cooldownOpen, setCooldownOpen] = useState(false);

  return (
    <motion.div layout className="relative h-full overflow-hidden rounded-2xl border border-hairline bg-card shadow-[0_2px_16px_rgba(31,27,22,0.06)]">
      <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-sage" />
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 pl-5 scrollbar-hide">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>today's workout</Eyebrow>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl italic leading-tight text-ink">{plan.name}</h2>
              {aiGenerated ? <Chip tone="clay" className="h-6 px-2 font-mono text-[9px]">AI Custom</Chip> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip tone="neutral" className="h-6 px-2 text-[9px]">Duration: {plan.duration}min</Chip>
              <Chip tone={plan.intensity === "low" ? "sage" : plan.intensity === "high" ? "alert" : "clay"} className="h-6 px-2 text-[9px]">
                Intensity: {titleCase(plan.intensity)}
              </Chip>
              <Chip tone="bone" className="h-6 px-2 text-[9px]">Type: {titleCase(plan.type)}</Chip>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {completed ? (
              <Chip tone="sage" className="h-9 justify-center px-4">Completed today</Chip>
            ) : (
              <Button variant="accent" size="sm" onClick={() => onComplete(undefined, undefined, true)}>
                <Check className="size-4" /> Mark complete
              </Button>
            )}
            <Button variant="ghost" size="sm" loading={generating} onClick={() => onGenerate()}>
              {generating ? "Building your workout..." : "Generate new"}
            </Button>
          </div>
        </div>

        {completed ? <FeedbackInline onSave={(feedback) => onComplete(feedback, undefined, true)} /> : null}

        <div className="flex items-start gap-2 rounded-xl border border-hairline bg-shell/50 p-2.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-clay" />
          <p className="line-clamp-2 font-body text-xs leading-5 text-ink2">{plan.whyThisWorkout}</p>
        </div>

        <div className="space-y-2">
          {plan.exercises.map((exercise, index) => (
            <ExerciseRow key={`${exercise.name}-${index}`} exercise={exercise} index={index} />
          ))}
        </div>

        <div className="border-t border-hairline pt-4">
          <div className="grid gap-3 md:grid-cols-2">
          <CollapsibleText title="Warmup" body={plan.warmup} open={warmupOpen} onToggle={() => setWarmupOpen((value) => !value)} />
          <CollapsibleText title="Cooldown" body={plan.cooldown} open={cooldownOpen} onToggle={() => setCooldownOpen((value) => !value)} />
          </div>
        </div>

        {plan.modifications?.length ? (
          <div className="mt-4 rounded-xl bg-bone/40 p-3 font-body text-xs leading-5 text-muted">
            {plan.modifications.join(" ")}
          </div>
        ) : null}

        <div className="border-t border-hairline pt-3">
          <div className="flex items-center justify-between gap-3">
            <button type="button" data-cursor-hover onClick={() => setSkipOpen((value) => !value)} className="shrink-0 font-body text-xs text-muted underline hover:text-ink">
              Skip today
            </button>
            <CustomWorkoutPanel className="flex-1" onGenerate={(options) => onGenerate(options)} loading={generating} />
          </div>
          <AnimatePresence initial={false}>
            {skipOpen ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="w-full overflow-hidden">
                <div className="mt-3 rounded-xl bg-shell/40 p-3">
                  <p className="font-body text-xs text-muted">Reason optional:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Too tired", "Injured", "No time"].map((option) => (
                      <button key={option} type="button" data-cursor-hover onClick={() => setReason(option)} className={cn("rounded-chip border px-3 py-1 font-body text-xs", reason === option ? "border-clay bg-clay text-cream" : "border-hairline bg-card text-muted")}>
                        {option}
                      </button>
                    ))}
                  </div>
                  <button type="button" data-cursor-hover className="mt-3 font-body text-xs text-clay hover:underline" onClick={() => onComplete(undefined, reason, false)}>
                    Confirm skip
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function CollapsibleText({ title, body, open, onToggle }: { title: string; body: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-hairline bg-card/70 p-3">
      <button type="button" data-cursor-hover onClick={onToggle} className="flex w-full items-center gap-2 text-left">
        <span className="size-2 rounded-full bg-claySoft" />
        <span className="font-body text-sm font-medium text-ink">{title}</span>
        <ChevronDown className={cn("ml-auto size-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-2 font-body text-xs leading-5 text-muted">
            {body}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ContextPanel({ context, backupWorkout, onSwitch }: { context?: WorkoutContext; backupWorkout: WorkoutPlan; onSwitch: () => void }) {
  const rows = [
    { icon: Moon, label: context?.phase ? `${context.phase} phase` : "Cycle phase", value: "Gentle movement preferred" },
    { icon: Zap, label: `Energy: ${context?.energyScore ?? 5}/10`, value: "Moderate intensity max" },
    { icon: Heart, label: context?.healthFlags[0] ?? "Health context", value: context?.healthFlags.length ? "Personalised safeguards active" : "No major flags logged" },
  ];

  return (
    <Card className="space-y-3">
      <Eyebrow>why karigai chose this</Eyebrow>
      <div>
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-start gap-2 border-b border-hairline py-2 last:border-b-0">
              <Icon className="mt-0.5 size-4 shrink-0 text-clay" />
              <div className="min-w-0">
                <p className="font-body text-xs font-medium text-ink">{row.label}</p>
                <p className="font-body text-[10px] text-muted">{row.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl bg-shell/40 p-3">
        <Eyebrow>low energy option</Eyebrow>
        <p className="mt-1 font-body text-sm italic text-muted">{backupWorkout.name}</p>
        <Button variant="ghost" size="sm" className="mt-2 w-full border-hairline text-xs" onClick={onSwitch}>Switch to backup</Button>
      </div>
    </Card>
  );
}

function completionStreak(history: WorkoutLog[]) {
  let streak = 0;
  for (const log of history) {
    if (log.completed) streak += 1;
    else break;
  }
  return streak;
}

function WorkoutHistory({ history }: { history: WorkoutLog[] }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Eyebrow>last 7 days</Eyebrow>
        <span className="font-mono text-xs text-clay">{completionStreak(history)} days in a row</span>
      </div>
      <div>
        {history.length ? (
          history.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-3 border-b border-hairline py-2.5 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate font-body text-sm text-ink">{log.workout_name ?? "Workout"}</p>
                <p className="font-mono text-xs text-muted">{formatFriendlyDate(log.date)}</p>
              </div>
              <Chip tone={log.completed ? "sage" : log.skipped_reason ? "neutral" : "bone"} className="h-6 shrink-0 text-[10px]">
                {log.completed ? "Done" : log.skipped_reason ? "Skipped" : "Planned"}
              </Chip>
            </div>
          ))
        ) : (
          <p className="font-body text-xs text-muted">No workouts logged yet.</p>
        )}
      </div>
    </Card>
  );
}

export default function WorkoutPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["workout-today", user?.id ?? "guest"], queryFn: fetchWorkout });
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const plan = activePlan ?? data?.plan;

  async function complete(feedback?: string, skippedReason?: string, completed = true) {
    if (!(await ensureAuthenticated("signup"))) return;
    const response = await fetch("/api/workout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ completed, feedback, skippedReason }),
    });
    if (!response.ok) {
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }
    if (completed && !feedback) useToastStore.getState().addToast("Workout complete", "success");
    await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]);
  }

  async function generateNew(options?: GenerateOptions) {
    if (!(await ensureAuthenticated("signup"))) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/workout/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(options ?? {}),
      });
      const payload = (await response.json()) as { plan?: WorkoutPlan; aiGenerated?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to generate workout.");
      setActivePlan(payload.plan ?? null);
      setAiGenerated(Boolean(payload.aiGenerated));
      await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]);
    } catch (generateError) {
      useToastStore.getState().addToast(generateError instanceof Error ? generateError.message : "Unable to generate workout.", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="-my-8 flex h-[calc(100vh-3rem)] flex-col overflow-hidden py-3 md:-my-10 md:py-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="shrink-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">movement</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl leading-tight text-ink">Workout Planner</h1>
            <p className="mt-1 font-body text-xs text-muted">Cycle-aware movement based on your energy and context.</p>
          </div>
        </div>
      </motion.div>
      {isLoading ? <SkeletonCard /> : null}
      {error ? <QueryError error={error} retry={() => void refetch()} /> : null}
      {data && plan ? (
        <div className="mt-2 grid min-h-0 min-w-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
          <WorkoutPlanCard
            plan={plan}
            completed={data.completed}
            aiGenerated={aiGenerated}
            generating={generating}
            onComplete={complete}
            onGenerate={generateNew}
          />
          <div className="min-h-0 space-y-3 overflow-y-auto scrollbar-hide">
            <ContextPanel context={data.context} backupWorkout={data.backupWorkout} onSwitch={() => setActivePlan(data.backupWorkout)} />
            <WorkoutHistory history={data.history} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
