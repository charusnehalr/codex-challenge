import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-shell text-ink2",
  success: "bg-sageSoft text-ink",
  warning: "bg-claySoft text-ink2",
  error: "bg-alert text-cream",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-chip px-2 font-body text-[10px] font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
