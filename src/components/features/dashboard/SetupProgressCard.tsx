"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, Eyebrow } from "@/components/ui";

export function SetupProgressCard({ progress }: { progress: number }) {
  return (
    <Card className="min-h-48">
      <Eyebrow>onboarding progress</Eyebrow>
      <p className="mt-5 font-display text-5xl text-ink">{progress}%</p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-chip bg-shell">
        <motion.div
          className="h-full rounded-chip bg-clay"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {progress < 100 ? (
        <Link href="/app/setup" className="mt-4 block font-body text-sm text-muted transition hover:text-clay">
          Complete onboarding to personalise your plan
        </Link>
      ) : (
        <p className="mt-4 font-body text-sm text-sage">Onboarding complete ✓</p>
      )}
    </Card>
  );
}
