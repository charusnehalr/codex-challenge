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
  return (
    <div>
      <div className="flex items-end gap-1">
        <span className={cn("font-display text-4xl font-normal tracking-tight", color)}>
          {value}
        </span>
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
