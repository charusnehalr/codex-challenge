"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type CardPadding = "sm" | "md" | "lg";

type CardProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  padding?: CardPadding;
  dark?: boolean;
  interactive?: boolean;
};

const paddings: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ children, className, padding = "md", dark = false, interactive = true, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={interactive ? { scale: 1.012, boxShadow: "0 8px 32px rgba(31,27,22,0.10)" } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "min-w-0 overflow-hidden rounded-card border shadow-[0_1px_4px_rgba(31,27,22,0.06)] transition-shadow duration-200 ease-out",
        dark ? "border-inkLine bg-inkSurf text-cream" : "border-hairline bg-card text-ink",
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
