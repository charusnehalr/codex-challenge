import type { WorkoutPlan } from "@/types/workout";

export function createRestDayPlan(): WorkoutPlan {
  return {
    id: "rest-day",
    title: "Recovery day",
    intensity: "rest",
    minutes: 0,
  };
}
