"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type StatDisplayProps = {
  value: string | number;
  unit?: string;
  label: string;
  sub?: string;
  color?: string;
};

export function StatDisplay({
  value,
  unit,
  label,
  sub,
  color = "text-clay",
}: StatDisplayProps) {
  const numericValue = typeof value === "number" ? value : null;
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    numericValue !== null && Number.isInteger(numericValue) ? Math.round(latest).toLocaleString() : latest.toFixed(1),
  );
  const [displayValue, setDisplayValue] = useState(String(value));

  useEffect(() => {
    if (numericValue === null) {
      setDisplayValue(String(value));
      return;
    }

    const controls = animate(motionValue, numericValue, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    const unsubscribe = rounded.on("change", setDisplayValue);

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [motionValue, numericValue, rounded, value]);

  return (
    <div>
      <div className="flex items-end gap-1">
        <motion.span className={cn("font-display text-5xl font-normal tracking-tight", color)}>
          {displayValue}
        </motion.span>
        {unit ? (
          <span className="pb-1 font-mono text-xs tracking-widest text-muted">{unit}</span>
        ) : null}
      </div>
      <p className="mt-0.5 font-body text-xs text-ink2">{label}</p>
      {sub ? (
        <p className="mt-1 font-mono text-[9.5px] uppercase tracking-widest text-muted">{sub}</p>
      ) : null}
    </div>
  );
}
