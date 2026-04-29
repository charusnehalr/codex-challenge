"use client";

import { useEffect, useState } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { Button, Card, Eyebrow, ProgressRing } from "@/components/ui";
import { ensureAuthenticated } from "@/lib/auth-guard";
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
  const motionWater = useMotionValue(0);
  const formattedWater = useTransform(motionWater, (latest) => Math.round(latest).toLocaleString());
  const [displayWater, setDisplayWater] = useState(waterMl.toLocaleString());

  useEffect(() => {
    const controls = animate(motionWater, waterMl, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    const unsubscribe = formattedWater.on("change", setDisplayWater);
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [formattedWater, motionWater, waterMl]);

  async function addWater(amountMl: number) {
    if (!(await ensureAuthenticated("signup"))) {
      return;
    }

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
          <p className="font-display text-5xl text-ink">{displayWater}</p>
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
