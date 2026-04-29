export type WorkoutIntensity = "rest" | "light" | "moderate" | "strong";

export type WorkoutPlan = {
  id: string;
  title: string;
  intensity: WorkoutIntensity;
  minutes: number;
};
