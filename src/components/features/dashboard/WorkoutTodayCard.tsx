"use client";

import Link from "next/link";
import { Button, Card, Chip, Eyebrow } from "@/components/ui";
import { useToastStore } from "@/store/toast.store";

export function WorkoutTodayCard({
  name,
  completed,
  backupWorkout,
  onChanged,
}: {
  name?: string;
  completed: boolean;
  backupWorkout?: string;
  onChanged: () => void;
}) {
  async function markComplete() {
    const response = await fetch("/api/workout/complete", { method: "POST" });
    if (!response.ok) {
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }
    useToastStore.getState().addToast("Workout complete 🔥", "success");
    onChanged();
  }

  return (
    <Card className="min-h-56">
      <Eyebrow>workout today</Eyebrow>
      <p className="mt-5 font-body text-base font-semibold text-ink">{name ?? "Recovery walk"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip tone="sage">45 min</Chip>
        <Chip tone="neutral">moderate</Chip>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {completed ? (
          <Chip tone="sage">✓ Done</Chip>
        ) : (
          <Button variant="accent" size="sm" onClick={markComplete}>Mark complete</Button>
        )}
        <Link href="/app/workout" className="font-body text-xs text-clay">
          View backup →
        </Link>
      </div>
      {backupWorkout ? <p className="mt-3 font-body text-xs text-muted">Backup: {backupWorkout}</p> : null}
    </Card>
  );
}
