"use client";

import { cn } from "@/lib/utils";

type CheckboxTone = "default" | "sage" | "clay";

type CheckboxProps = {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: CheckboxTone;
};

const checkedTones: Record<CheckboxTone, string> = {
  default: "border-ink bg-ink",
  sage: "border-sage bg-sage",
  clay: "border-clay bg-clay",
};

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  tone = "default",
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-7 items-start gap-2.5 text-left disabled:opacity-60"
    >
      <span
        className={cn(
          "mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-sm border border-hairline bg-card transition",
          checked ? checkedTones[tone] : null,
        )}
      >
        {checked ? (
          <svg viewBox="0 0 14 14" className="size-2.5 text-cream" aria-hidden="true">
            <path
              d="M3 7.2 5.8 10 11 4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        ) : null}
      </span>
      {label ? <span className="font-body text-sm leading-snug text-ink2">{label}</span> : null}
    </button>
  );
}
