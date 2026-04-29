export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealEntry = {
  id: string;
  type: MealType;
  name: string;
  loggedAt: string;
};
