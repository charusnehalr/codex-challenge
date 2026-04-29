"use client";

import { Button, Card, Eyebrow, ProgressRing } from "@/components/ui";
import { useToastStore } from "@/store/toast.store";

export function WaterProgressCard({
  waterMl,
  targetMl,
  onChanged,
}: {
  waterMl: number;
  targetMl?: number;
  onChanged: () => void;
}) {
  async function addWater(amountMl: number) {
    const response = await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl }),
    });
    if (!response.ok) {
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }
    useToastStore.getState().addToast("Water updated ✓", "success");
    onChanged();
  }

  const target = targetMl ?? 2500;

  return (
    <Card className="min-h-56">
      <Eyebrow>hydration</Eyebrow>
      <div className="mt-5 flex items-center justify-between gap-5">
        <div>
          <p className="font-display text-5xl text-ink">{waterMl.toLocaleString()}</p>
          <p className="mt-1 font-mono text-xs text-muted">of {target.toLocaleString()}ml</p>
        </div>
        <ProgressRing value={waterMl / target} size={78} stroke={7} color="#6B8AA8" label="ml" />
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => addWater(250)}>+250ml</Button>
        <Button variant="ghost" size="sm" onClick={() => addWater(500)}>+500ml</Button>
      </div>
    </Card>
  );
}
