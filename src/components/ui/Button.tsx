"use client";

import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "accent" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-cream hover:bg-ink2",
  accent: "bg-clay text-cream hover:opacity-90",
  ghost: "border border-ink bg-transparent text-ink hover:bg-shell",
  danger: "bg-alert text-cream hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 rounded-xl px-3 text-xs",
  md: "h-10 rounded-xl px-5 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-body font-medium transition disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
