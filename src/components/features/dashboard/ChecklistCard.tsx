"use client";

import { motion } from "framer-motion";
import { Card, Checkbox, Eyebrow } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DashboardResponse } from "@/types/dashboard";

export function ChecklistCard({ checklist }: { checklist: DashboardResponse["checklist"] }) {
  const completed = checklist.filter((item) => item.done).length;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <Eyebrow>today's checklist</Eyebrow>
        <span className="font-mono text-xs text-muted">{completed}/{checklist.length} done</span>
      </div>
      <div className="mt-4 space-y-3">
        {checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <Checkbox checked={item.done} onChange={() => undefined} tone="clay" />
            <span className={cn("relative font-body text-sm", item.done ? "text-muted" : "text-ink2")}>
              {item.label}
              {item.done ? (
                <motion.span
                  className="absolute left-0 top-1/2 h-px bg-muted"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
