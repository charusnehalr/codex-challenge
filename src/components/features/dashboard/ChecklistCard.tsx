"use client";

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
            <span className={cn("font-body text-sm", item.done ? "text-muted line-through" : "text-ink2")}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
