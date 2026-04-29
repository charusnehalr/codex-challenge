"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "accent" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-cream hover:bg-ink2 hover:shadow-[0_0_0_3px_rgba(31,27,22,0.12)]",
  accent:
    "bg-gradient-to-b from-[#C27A56] to-[#B8704F] text-cream shadow-[0_2px_12px_rgba(184,112,79,0.35)] hover:from-[#CB8560] hover:to-[#C27A56] hover:shadow-[0_4px_20px_rgba(184,112,79,0.45)]",
  ghost: "border border-ink bg-transparent text-ink hover:border-ink2 hover:bg-shell",
  danger: "bg-alert text-cream hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-xl px-4 text-xs",
  md: "h-11 rounded-xl px-6 text-sm",
  lg: "h-[52px] rounded-2xl px-8 text-base",
};

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

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
    <motion.button
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-medium tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </motion.button>
  );
}
