"use client";

import { cn } from "@/lib/utils";

type ToggleProps = {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 disabled:opacity-60"
    >
      <span
        className={cn(
          "flex h-7 w-12 items-center rounded-chip p-1 transition",
          checked ? "bg-clay" : "bg-shell",
        )}
      >
        <span
          className={cn(
            "size-5 rounded-full bg-card shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      {label ? <span className="font-body text-sm text-ink">{label}</span> : null}
    </button>
  );
}
