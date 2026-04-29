import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardPadding = "sm" | "md" | "lg";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
  dark?: boolean;
};

const paddings: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-[18px]",
  lg: "p-7",
};

export function Card({ children, className, padding = "md", dark = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border",
        dark ? "border-inkLine bg-inkSurf text-cream" : "border-hairline bg-card text-ink",
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
