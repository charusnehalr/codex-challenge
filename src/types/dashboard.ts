export type DashboardResponse = {
  profileName?: string;
  setupProgress: number;
  personalizationFactors: {
    cyclePhase?: string;
    cycleDay?: number;
    cycleLength?: number;
    cycleConfidence?: string;
    goal?: string;
    dietType?: string;
    healthContext: string[];
    fasting?: string;
    fitnessOptions: string[];
    symptomsToday: string[];
    fastingWindow?: string;
  };
  todayPlan: {
    calorieTarget?: number;
    proteinTarget?: number;
    carbsTarget?: number;
    fatTarget?: number;
    waterTargetMl?: number;
    workoutName?: string;
    backupWorkout?: string;
    mealFocus?: string;
    cycleNote?: string;
    conditionNotes: string[];
  };
  logs: {
    caloriesConsumed: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatConsumed: number;
    waterMl: number;
    workoutCompleted: boolean;
    energyScore?: number;
  };
  checklist: { id: string; label: string; done: boolean }[];
  insight: string;
};
