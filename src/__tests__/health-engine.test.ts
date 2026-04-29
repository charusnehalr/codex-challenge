import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateBMI,
  calculateBMR,
  calculateBRI,
  calculateCalorieTarget,
  calculateProteinTarget,
  calculateTDEE,
  calculateWHR,
  calculateWaterTarget,
  categorizeBMI,
} from "../lib/health-engine.ts";

test("calculateBMI rounds to one decimal place", () => {
  assert.equal(calculateBMI(68, 163), 25.6);
  assert.equal(calculateBMI(55, 165), 20.2);
});

test("categorizeBMI returns non-judgmental labels", () => {
  assert.equal(categorizeBMI(18), "Underweight range");
  assert.equal(categorizeBMI(31), "High range");
});

test("categorizeBMI handles healthy and above healthy ranges", () => {
  assert.equal(categorizeBMI(22), "Healthy range");
  assert.equal(categorizeBMI(27), "Above healthy range");
});

test("calculateWHR rounds to two decimals", () => {
  assert.equal(calculateWHR(82, 101), 0.81);
  assert.equal(calculateWHR(70, 95), 0.74);
});

test("calculateBRI rounds to two decimals", () => {
  assert.equal(calculateBRI(82, 163), 17.95);
  assert.equal(calculateBRI(70, 165), 12.28);
});

test("calculateBMR uses female Mifflin-St Jeor", () => {
  assert.equal(calculateBMR({ weightKg: 68, heightCm: 163, age: 28 }), 1398);
  assert.equal(calculateBMR({ weightKg: 55, heightCm: 165, age: 35 }), 1245);
});

test("calculateTDEE applies activity multipliers and fallback", () => {
  assert.equal(calculateTDEE(1400, "moderate"), 2170);
  assert.equal(calculateTDEE(1400, "unknown"), 1925);
});

test("calculateCalorieTarget respects goals and safety floor", () => {
  assert.equal(calculateCalorieTarget({ tdee: 2000, goal: "lose_weight", hasThyroidCondition: false }), 1600);
  assert.equal(calculateCalorieTarget({ tdee: 1300, goal: "lose_weight", hasThyroidCondition: false }), 1200);
});

test("calculateCalorieTarget limits thyroid deficit", () => {
  assert.equal(calculateCalorieTarget({ tdee: 2000, goal: "lose_weight", hasThyroidCondition: true }), 1700);
  assert.equal(calculateCalorieTarget({ tdee: 2000, goal: "gain_muscle", hasThyroidCondition: true }), 2300);
});

test("calculateProteinTarget varies by goal", () => {
  assert.equal(calculateProteinTarget(68, "lose_weight"), 109);
  assert.equal(calculateProteinTarget(68, "gain_muscle"), 122);
});

test("calculateProteinTarget defaults to maintenance multiplier", () => {
  assert.equal(calculateProteinTarget(68, "maintain"), 95);
  assert.equal(calculateProteinTarget(68, "unknown"), 95);
});

test("calculateWaterTarget rounds to nearest 100ml", () => {
  assert.equal(calculateWaterTarget(68), 2200);
  assert.equal(calculateWaterTarget(75), 2500);
});
