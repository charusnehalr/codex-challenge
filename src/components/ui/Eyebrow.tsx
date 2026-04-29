import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EyebrowProps = {
  children: ReactNode;
  color?: string;
  className?: string;
};

export function Eyebrow({ children, color = "text-muted", className }: EyebrowProps) {
  return (
    <p className={cn("font-mono text-[10px] uppercase tracking-[0.2em]", color, className)}>
      {children}
    </p>
  );
}
