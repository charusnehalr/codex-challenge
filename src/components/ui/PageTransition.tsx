"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { fadeUp } from "@/lib/animations";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div key={pathname} variants={fadeUp} initial="hidden" animate="visible" className="min-h-full">
      {children}
    </motion.div>
  );
}
