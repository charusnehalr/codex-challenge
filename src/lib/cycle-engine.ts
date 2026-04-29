export type CyclePhase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal" | "Late Luteal" | "Unknown";

export interface CycleProfileInput {
  last_period_start: string | null;
  average_cycle_length: number | null;
  average_period_length?: number | null;
  cycle_regular: string | null;
}

export interface CycleLogInput {
  date: string;
  is_period_day: boolean;
  period_not_started_yet?: boolean | null;
}

export interface CycleStatus {
  cycleDay: number;
  cyclePhase: CyclePhase;
  cycleLength: number;
  confidence: "low" | "medium" | "high";
  lastPeriodStart: Date | null;
  nextPeriodDate: Date | null;
  daysUntilNextPeriod: number;
  phaseProgressPercent: number;
  phaseDay: number;
  phaseTotalDays: number;
  isConfirmedPeriodDay: boolean;
  periodNotStartedYet: boolean;
  isPeriodExpected: boolean;
  overdueDays: number;
}

const DAY_MS = 86400000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateFromIso(value: string) {
  return new Date(`${value}T00:00:00`);
}

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
 * Returns current phase range details for a given cycle day and cycle length.
 */
export function getPhaseProgress(cycleDay: number, cycleLength: number) {
  const follicularEnd = Math.round(cycleLength * 0.45);
  const ovulationEnd = Math.round(cycleLength * 0.55);

  if (cycleDay <= 5) {
    return { phaseDay: cycleDay, phaseTotalDays: 5 };
  }

  if (cycleDay <= follicularEnd) {
    return { phaseDay: cycleDay - 5, phaseTotalDays: Math.max(1, follicularEnd - 5) };
  }

  if (cycleDay <= ovulationEnd) {
    return { phaseDay: cycleDay - follicularEnd, phaseTotalDays: Math.max(1, ovulationEnd - follicularEnd) };
  }

  return { phaseDay: cycleDay - ovulationEnd, phaseTotalDays: Math.max(1, cycleLength - ovulationEnd) };
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
 * Calculates the authoritative cycle status shared by Analysis, Cycle Tracker, and Dashboard.
 */
export function calculateCycleStatus(
  cycleProfile: CycleProfileInput | null,
  todayLog: CycleLogInput | null,
  today: Date = new Date(),
): CycleStatus {
  const todayStart = startOfDay(today);
  const todayString = isoDate(todayStart);
  const cycleLength = cycleProfile?.average_cycle_length ?? 28;
  const confidence = getCycleConfidence(cycleProfile?.cycle_regular ?? "unsure");
  const isConfirmedPeriodDay = Boolean(todayLog?.is_period_day && todayLog.date === todayString);
  const periodNotStartedYet = Boolean(todayLog?.period_not_started_yet && todayLog.date === todayString);
  const profileStart = cycleProfile?.last_period_start ? dateFromIso(cycleProfile.last_period_start) : null;
  const effectiveStart = isConfirmedPeriodDay ? todayStart : profileStart;

  if (!effectiveStart) {
    return {
      cycleDay: 0,
      cyclePhase: "Unknown",
      cycleLength,
      confidence,
      lastPeriodStart: null,
      nextPeriodDate: null,
      daysUntilNextPeriod: 0,
      phaseProgressPercent: 0,
      phaseDay: 0,
      phaseTotalDays: 0,
      isConfirmedPeriodDay,
      periodNotStartedYet,
      isPeriodExpected: false,
      overdueDays: 0,
    };
  }

  const daysSince = Math.max(0, Math.floor((todayStart.getTime() - effectiveStart.getTime()) / DAY_MS));
  const rawCycleDay = daysSince + 1;
  const isPeriodExpected = rawCycleDay >= cycleLength;
  const overdueDays = Math.max(0, rawCycleDay - cycleLength);
  const cycleDay = periodNotStartedYet ? rawCycleDay : ((daysSince % cycleLength) + 1);
  const cyclePhase = periodNotStartedYet && rawCycleDay > cycleLength ? "Late Luteal" : estimateCyclePhase(cycleDay, cycleLength);
  const progress = cyclePhase === "Late Luteal"
    ? { phaseDay: Math.max(1, cycleLength - Math.round(cycleLength * 0.55) + overdueDays), phaseTotalDays: Math.max(1, cycleLength - Math.round(cycleLength * 0.55)) }
    : getPhaseProgress(cycleDay || 1, cycleLength);
  const phaseProgressPercent = progress.phaseTotalDays ? Math.min(100, (progress.phaseDay / progress.phaseTotalDays) * 100) : 0;
  const periodsElapsed = Math.max(1, Math.ceil(daysSince / cycleLength));
  const nextPeriodDate = new Date(effectiveStart);
  nextPeriodDate.setDate(effectiveStart.getDate() + periodsElapsed * cycleLength);
  let daysUntilNextPeriod = Math.ceil((nextPeriodDate.getTime() - todayStart.getTime()) / DAY_MS);

  if (periodNotStartedYet && isPeriodExpected) {
    daysUntilNextPeriod = 1;
  } else if (daysUntilNextPeriod <= 0) {
    daysUntilNextPeriod = 1;
  }

  return {
    cycleDay,
    cyclePhase,
    cycleLength,
    confidence,
    lastPeriodStart: effectiveStart,
    nextPeriodDate,
    daysUntilNextPeriod,
    phaseProgressPercent,
    phaseDay: progress.phaseDay,
    phaseTotalDays: progress.phaseTotalDays,
    isConfirmedPeriodDay,
    periodNotStartedYet,
    isPeriodExpected,
    overdueDays,
  };
}

/**
 * Returns the most recent logged phase when available, preserving compatibility with earlier app code.
 */
export function inferCyclePhase(logs: { phase?: string }[]): string {
  return logs.at(-1)?.phase ?? "unknown";
}
