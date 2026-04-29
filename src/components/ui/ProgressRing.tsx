type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sublabel?: string;
};

export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  color = "#B8704F",
  track = "#EFE7DA",
  label,
  sublabel,
}: ProgressRingProps) {
  const normalizedValue = Math.min(1, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - normalizedValue);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label ? <span className="font-body text-xs font-semibold text-ink">{label}</span> : null}
        {sublabel ? (
          <span className="font-mono text-[8px] uppercase tracking-widest text-muted">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
