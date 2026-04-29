export type HealthCheckIn = {
  painLevel?: number;
  hasHeavyBleeding?: boolean;
  hasDizziness?: boolean;
  hasEatingDisorderHistory?: boolean;
  isPregnant?: boolean;
  isFasting?: boolean;
};

export type SafetyBanner = {
  code: string;
  message: string;
};
