export type CyclePhase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal" | "Unknown";

/**
 * Calculates the current cycle day from the last period start date, wrapping at the provided cycle length.
 */
export function getCycleDay(lastPeriodStart: Date, today: Date, cycleLength = 28): number {
  const elapsedDays = Math.floor((today.getTime() - lastPeriodStart.getTime()) / 86400000);
  return ((Math.max(0, elapsedDays) % cycleLength) + 1);
}

/**
 * Estimates the cycle phase from cycle day and total cycle length.
 */
export function estimateCyclePhase(cycleDay: number, cycleLength: number): CyclePhase {
  if (cycleDay < 1 || cycleDay > cycleLength) {
    return "Unknown";
  }

  const follicularEnd = Math.round(cycleLength * 0.45);
  const ovulationEnd = Math.round(cycleLength * 0.55);

  if (cycleDay <= 5) {
    return "Menstrual";
  }

  if (cycleDay <= follicularEnd) {
    return "Follicular";
  }

  if (cycleDay <= ovulationEnd) {
    return "Ovulation";
  }

  return "Luteal";
}

/**
 * Estimates the next period date by adding cycle length days to the last period start.
 */
export function estimateNextPeriod(lastPeriodStart: Date, cycleLength: number): Date {
  const nextPeriod = new Date(lastPeriodStart);
  nextPeriod.setDate(nextPeriod.getDate() + cycleLength);
  return nextPeriod;
}

/**
 * Converts cycle regularity into a confidence level for predictions.
 */
export function getCycleConfidence(regularity: string): "low" | "medium" | "high" {
  if (regularity === "regular") {
    return "high";
  }

  if (regularity === "irregular") {
    return "low";
  }

  return "medium";
}

/**
 * Calculates days until the next period, never returning less than zero.
 */
export function getDaysUntilNextPeriod(nextPeriod: Date, today: Date): number {
  return Math.max(0, Math.ceil((nextPeriod.getTime() - today.getTime()) / 86400000));
}

/**
 * Returns the most recent logged phase when available, preserving compatibility with earlier app code.
 */
export function inferCyclePhase(logs: { phase?: string }[]): string {
  return logs.at(-1)?.phase ?? "unknown";
}
