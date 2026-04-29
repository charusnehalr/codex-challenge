import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateCyclePhase,
  estimateNextPeriod,
  getCycleConfidence,
  getCycleDay,
  getDaysUntilNextPeriod,
  inferCyclePhase,
} from "../lib/cycle-engine.ts";

test("getCycleDay counts from last period start with day one offset", () => {
  assert.equal(getCycleDay(new Date("2026-04-01"), new Date("2026-04-01")), 1);
  assert.equal(getCycleDay(new Date("2026-04-01"), new Date("2026-04-10")), 10);
});

test("getCycleDay wraps after default cycle length", () => {
  assert.equal(getCycleDay(new Date("2026-04-01"), new Date("2026-04-29")), 1);
  assert.equal(getCycleDay(new Date("2026-04-01"), new Date("2026-04-30")), 2);
});

test("estimateCyclePhase maps menstrual and follicular windows", () => {
  assert.equal(estimateCyclePhase(3, 28), "Menstrual");
  assert.equal(estimateCyclePhase(8, 28), "Follicular");
});

test("estimateCyclePhase maps ovulation, luteal, and unknown windows", () => {
  assert.equal(estimateCyclePhase(14, 28), "Ovulation");
  assert.equal(estimateCyclePhase(22, 28), "Luteal");
  assert.equal(estimateCyclePhase(29, 28), "Unknown");
});

test("estimateNextPeriod adds cycle length days", () => {
  assert.equal(estimateNextPeriod(new Date("2026-04-01"), 28).toISOString().slice(0, 10), "2026-04-29");
  assert.equal(estimateNextPeriod(new Date("2026-04-01"), 32).toISOString().slice(0, 10), "2026-05-03");
});

test("getCycleConfidence maps regularity values", () => {
  assert.equal(getCycleConfidence("regular"), "high");
  assert.equal(getCycleConfidence("irregular"), "low");
});

test("getCycleConfidence defaults unknown regularity to medium", () => {
  assert.equal(getCycleConfidence("unsure"), "medium");
  assert.equal(getCycleConfidence(""), "medium");
});

test("getDaysUntilNextPeriod returns ceiling day distance", () => {
  assert.equal(getDaysUntilNextPeriod(new Date("2026-04-30"), new Date("2026-04-29")), 1);
  assert.equal(getDaysUntilNextPeriod(new Date("2026-05-02"), new Date("2026-04-29")), 3);
});

test("getDaysUntilNextPeriod never returns negative", () => {
  assert.equal(getDaysUntilNextPeriod(new Date("2026-04-20"), new Date("2026-04-29")), 0);
  assert.equal(getDaysUntilNextPeriod(new Date("2026-04-29"), new Date("2026-04-29")), 0);
});

test("inferCyclePhase preserves compatibility with logged phase arrays", () => {
  assert.equal(inferCyclePhase([{ phase: "luteal" }]), "luteal");
  assert.equal(inferCyclePhase([]), "unknown");
});
