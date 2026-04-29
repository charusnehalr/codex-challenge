import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block font-body text-sm text-ink">
      {label ? <span className="mb-1.5 block text-xs font-medium text-ink2">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-xl border border-hairline bg-card px-4 font-body text-sm text-ink outline-none transition placeholder:text-muted focus:border-clay focus:ring-2 focus:ring-clay/30",
          error ? "border-alert focus:border-alert focus:ring-alert/20" : null,
          className,
        )}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-xs text-alert">{error}</span> : null}
      {!error && hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
