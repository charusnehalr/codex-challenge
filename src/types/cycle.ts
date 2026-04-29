export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal" | "unknown";

export type CycleLog = {
  date: string;
  phase?: CyclePhase;
  symptoms: string[];
};
