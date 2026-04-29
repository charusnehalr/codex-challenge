import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: string;
  error?: string;
  options: SelectOption[];
};

export function Select({ label, error, options, id, className, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="block font-body text-sm text-ink">
      {label ? <span className="mb-2 block text-sm font-medium text-ink2">{label}</span> : null}
      <span className="relative block">
        <select
          id={selectId}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-hairline bg-card px-4 pr-10 font-body text-sm text-ink outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/15",
            error ? "border-alert focus:border-alert focus:ring-alert/20" : null,
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-4 top-1/2 size-2 -translate-y-1/2 rotate-45 border-b border-r border-muted"
          aria-hidden="true"
        />
      </span>
      {error ? <span className="mt-1.5 block text-xs text-alert">{error}</span> : null}
    </label>
  );
}
