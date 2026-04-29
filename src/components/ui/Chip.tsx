import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipTone = "neutral" | "sage" | "clay" | "blush" | "bone" | "alert" | "ink";

type ChipProps = {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
};

const tones: Record<ChipTone, string> = {
  neutral: "border border-hairline bg-shell text-ink2",
  sage: "border border-sageSoft bg-sageSoft text-ink",
  clay: "border border-claySoft bg-claySoft text-ink2",
  blush: "border border-blush/50 bg-blush/30 text-ink2",
  bone: "border border-hairline bg-bone text-ink2",
  alert: "border border-alert/30 bg-alert/10 text-alert",
  ink: "border border-ink bg-ink text-cream",
};

export function Chip({ children, tone = "neutral", className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-chip px-3 font-body text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
