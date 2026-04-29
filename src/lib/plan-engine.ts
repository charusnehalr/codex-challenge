import type { DailyPlan } from "@/types/plan";

export function createDailyPlan(date: string): DailyPlan {
  return {
    date,
    focus: "Check in gently",
    reminders: [],
  };
}
