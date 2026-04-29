"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Button, Card, Chip, Eyebrow, PageHeader, QueryError, SafetyBanner, SkeletonCard } from "@/components/ui";
import { ensureAuthenticated } from "@/lib/auth-guard";
import { useToastStore } from "@/store/toast.store";
import type { WorkoutPlan } from "@/lib/workout-engine";
import type { WorkoutLog } from "@/types/user";

type WorkoutResponse = {
  plan: WorkoutPlan;
  backupWorkout: WorkoutPlan;
  completed: boolean;
  skippedReason?: string | null;
  feedback?: string | null;
  history: WorkoutLog[];
};

async function fetchWorkout() {
  const response = await fetch("/api/workout/today");
  if (!response.ok) throw new Error("Unable to load workout.");
  return (await response.json()) as WorkoutResponse;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ExerciseRow({ exercise }: { exercise: WorkoutPlan["exercises"][number] }) {
  return (
    <details className="rounded-xl border border-hairline p-3">
      <summary className="flex cursor-pointer items-center justify-between gap-3">
        <span className="font-body text-sm font-semibold text-ink">{exercise.name}</span>
        <span className="font-mono text-xs text-muted">
          {exercise.sets ? `${exercise.sets} sets` : exercise.duration ?? ""} {exercise.reps ?? ""}
        </span>
      </summary>
      {exercise.notes ? <p className="mt-3 font-body text-sm leading-6 text-muted">{exercise.notes}</p> : null}
    </details>
  );
}

function WorkoutPlanCard({
  plan,
  completed,
  onComplete,
  onGenerate,
}: {
  plan: WorkoutPlan;
  completed: boolean;
  onComplete: (feedback?: string, skippedReason?: string, completed?: boolean) => void;
  onGenerate?: () => void;
}) {
  const [skipOpen, setSkipOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="font-display text-2xl text-ink">{plan.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="neutral">Duration: {plan.duration}min</Chip>
            <Chip tone={plan.intensity === "low" ? "sage" : plan.intensity === "high" ? "alert" : "clay"}>
              Intensity: {titleCase(plan.intensity)}
            </Chip>
            <Chip tone="bone">Type: {titleCase(plan.type)}</Chip>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" onClick={() => onComplete(undefined, undefined, true)} disabled={completed}>
            {completed ? "✓ Complete" : "✓ Mark complete"}
          </Button>
          {onGenerate ? <Button variant="ghost" onClick={onGenerate}>Generate new →</Button> : null}
        </div>
      </div>
      <div className="rounded-xl bg-shell p-4 font-body text-sm leading-6 text-ink2">{plan.whyThisWorkout}</div>
      <div className="space-y-3">
        {plan.exercises.map((exercise) => <ExerciseRow key={exercise.name} exercise={exercise} />)}
      </div>
      {plan.modifications?.length ? (
        <SafetyBanner tone="info" title="Modifications" body={plan.modifications.join(" ")} />
      ) : null}
      <details className="rounded-xl bg-card">
        <summary className="flex cursor-pointer items-center gap-2 font-body text-sm font-semibold text-ink">
          <ChevronDown className="size-4" /> Warmup
        </summary>
        <p className="mt-2 font-body text-sm text-muted">{plan.warmup}</p>
      </details>
      <details className="rounded-xl bg-card">
        <summary className="flex cursor-pointer items-center gap-2 font-body text-sm font-semibold text-ink">
          <ChevronDown className="size-4" /> Cooldown
        </summary>
        <p className="mt-2 font-body text-sm text-muted">{plan.cooldown}</p>
      </details>
      <div className="border-t border-hairline pt-5">
        <Button variant="ghost" onClick={() => setSkipOpen((open) => !open)}>Skip today</Button>
        {skipOpen ? (
          <div className="mt-3 space-y-3">
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for skipping"
              className="min-h-20 w-full rounded-xl border border-hairline bg-card px-4 py-3 font-body text-sm outline-none focus:border-clay focus:ring-2 focus:ring-clay/30"
            />
            <Button size="sm" onClick={() => onComplete(undefined, reason, false)}>Save skip</Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function WorkoutFeedbackForm({ onSave }: { onSave: (feedback: string) => void }) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");

  async function saveRating(value: number) {
    setStars(value);
    onSave(`${value}/5 ${text}`.trim());
  }

  return (
    <Card className="space-y-4">
      <Eyebrow>workout feedback</Eyebrow>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => void saveRating(value)}
            className={value <= stars ? "text-clay" : "text-muted"}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => stars > 0 && onSave(`${stars}/5 ${text}`.trim())}
        placeholder="How did it go?"
        className="min-h-20 w-full rounded-xl border border-hairline bg-card px-4 py-3 font-body text-sm outline-none focus:border-clay focus:ring-2 focus:ring-clay/30"
      />
    </Card>
  );
}

function BackupWorkoutCard({ plan, onSwitch }: { plan: WorkoutPlan; onSwitch: () => void }) {
  return (
    <Card className="space-y-4">
      <Eyebrow>low energy option</Eyebrow>
      <details>
        <summary className="cursor-pointer font-display text-xl text-ink">{plan.name}</summary>
        <div className="mt-4 space-y-3">
          <p className="font-body text-sm text-muted">{plan.whyThisWorkout}</p>
          {plan.exercises.map((exercise) => <ExerciseRow key={exercise.name} exercise={exercise} />)}
        </div>
      </details>
      <Button size="sm" variant="ghost" onClick={onSwitch}>Switch to backup</Button>
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
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Eyebrow>last 7 days</Eyebrow>
        <span className="font-mono text-xs text-muted">{completionStreak(history)} days in a row 🔥</span>
      </div>
      <div className="space-y-2">
        {history.map((log) => (
          <div key={log.id} className="flex items-center justify-between gap-3 rounded-xl border border-hairline p-3">
            <div>
              <p className="font-body text-sm font-semibold text-ink">{log.workout_name ?? "Workout"}</p>
              <p className="font-mono text-xs text-muted">{log.date}</p>
            </div>
            <Chip tone={log.completed ? "sage" : log.skipped_reason ? "bone" : "neutral"}>
              {log.completed ? "completed" : log.skipped_reason ? "skipped" : "planned"}
            </Chip>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function WorkoutPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["workout-today"], queryFn: fetchWorkout });
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const plan = activePlan ?? data?.plan;

  async function complete(feedback?: string, skippedReason?: string, completed = true) {
    if (!(await ensureAuthenticated("signup"))) {
      return;
    }

    const response = await fetch("/api/workout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed, feedback, skippedReason }),
    });
    if (!response.ok) {
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }
    if (completed && !feedback) {
      useToastStore.getState().addToast("Workout complete 🔥", "success");
    }
    await refetch();
  }

  async function generateNew() {
    if (!(await ensureAuthenticated("signup"))) {
      return;
    }

    const response = await fetch("/api/workout/generate", { method: "POST" });
    const payload = (await response.json()) as { plan?: WorkoutPlan };
    setActivePlan(payload.plan ?? null);
    await refetch();
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="movement" title="Workout Planner" subtitle="Cycle-aware movement based on energy, access, and health context." />
      {isLoading ? <SkeletonCard /> : null}
      {error ? <QueryError error={error} retry={() => void refetch()} /> : null}
      {data && plan ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <WorkoutPlanCard plan={plan} completed={data.completed} onComplete={complete} onGenerate={generateNew} />
            {data.completed ? <WorkoutFeedbackForm onSave={(feedback) => void complete(feedback, undefined, true)} /> : null}
          </div>
          <div className="space-y-6">
            <BackupWorkoutCard plan={data.backupWorkout} onSwitch={() => setActivePlan(data.backupWorkout)} />
            <WorkoutHistory history={data.history} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
