"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { AddMealModal, type MealDraft } from "@/components/features/meals/AddMealModal";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Eyebrow,
  PageHeader,
  ProgressRing,
  QueryError,
  SafetyBanner,
  Select,
  SkeletonCard,
} from "@/components/ui";
import type { MacroTargets, NutritionSummary } from "@/lib/nutrition-engine";
import { useToastStore } from "@/store/toast.store";
import type { DietPreferences, HealthContext, MealLog } from "@/types/user";

type MealSuggestion = {
  mealName: string;
  ingredients: string[];
  estimatedCalories: number;
  estimatedMacros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  reason: string;
  safetyNote?: string;
};

type MealsTodayResponse = {
  logs: MealLog[];
  summary: NutritionSummary;
  targets: MacroTargets;
  remaining: MacroTargets;
  waterMl: number;
  waterTargetMl: number;
  dietPreferences: DietPreferences | null;
  healthContext: HealthContext | null;
  fastingPreferences: {
    interested_in_fasting: boolean;
    fasting_type: string | null;
    eating_window_start: string | null;
    eating_window_end: string | null;
    feels_dizzy_when_fasting: boolean;
    fasting_caution_flags: string[] | null;
  } | null;
  rules: {
    fastingDisabled: boolean;
    showIronFoodReminder: boolean;
    showB12FoodReminder: boolean;
    showVitaminDReminder: boolean;
  };
};

const mealGroups = [
  { key: "breakfast", label: "Breakfast" },
  { key: "snack", label: "Snack" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];

async function fetchMealsToday() {
  const response = await fetch("/api/meals/today");
  if (!response.ok) {
    throw new Error("Unable to load meals.");
  }
  return (await response.json()) as MealsTodayResponse;
}

function MacroRing({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const over = value > target;
  return (
    <div className="text-center">
      <ProgressRing value={target ? value / target : 0} color={over ? "#C99356" : color} label={label} />
      <p className="mt-2 font-mono text-xs text-muted">
        {Math.round(value)} / {Math.round(target)}
      </p>
    </div>
  );
}

function NutritionProgressCard({ summary, targets }: { summary: NutritionSummary; targets: MacroTargets }) {
  return (
    <Card className="min-h-60">
      <Eyebrow>nutrition today</Eyebrow>
      <div className="mt-5 grid grid-cols-4 gap-3">
        <MacroRing label="cal" value={summary.calories} target={targets.calories} color="#B8704F" />
        <MacroRing label="pro" value={summary.proteinG} target={targets.proteinG} color="#7A8B6F" />
        <MacroRing label="carb" value={summary.carbsG} target={targets.carbsG} color="#6B8AA8" />
        <MacroRing label="fat" value={summary.fatG} target={targets.fatG} color="#C99356" />
      </div>
    </Card>
  );
}

function WaterProgressCard({
  waterMl,
  targetMl,
  onChanged,
}: {
  waterMl: number;
  targetMl: number;
  onChanged: () => void;
}) {
  async function add(amountMl: number) {
    const response = await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl }),
    });
    if (!response.ok) {
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }
    useToastStore.getState().addToast("Water updated ✓", "success");
    onChanged();
  }

  return (
    <Card className="min-h-60">
      <Eyebrow>hydration</Eyebrow>
      <div className="mt-5 flex items-center justify-between gap-5">
        <ProgressRing value={waterMl / targetMl} size={120} stroke={9} color="#6B8AA8" label="water" />
        <div>
          <p className="font-display text-4xl text-ink">{waterMl.toLocaleString()}</p>
          <p className="font-mono text-xs text-muted">of {targetMl.toLocaleString()}ml</p>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => add(250)}>+250ml</Button>
            <Button variant="ghost" size="sm" onClick={() => add(500)}>+500ml</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FastingWindowCard({ data }: { data: MealsTodayResponse }) {
  const fasting = data.fastingPreferences;
  if (!fasting?.interested_in_fasting || data.rules.fastingDisabled) {
    return (
      <Card className="min-h-60">
        <EmptyState icon={<span className="font-display text-3xl">—</span>} title="No fasting window" body="Karigai will focus on regular balanced meals." />
      </Card>
    );
  }

  const start = fasting.eating_window_start?.slice(0, 5) ?? "08:00";
  const end = fasting.eating_window_end?.slice(0, 5) ?? "22:00";
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const open = current >= start && current <= end;

  return (
    <Card className="min-h-60">
      <Eyebrow>fasting window</Eyebrow>
      <p className="mt-5 font-display text-3xl text-ink">{start} – {end}</p>
      <p className="mt-1 font-mono text-xs text-muted">({fasting.fasting_type})</p>
      <div className="mt-5">
        <Chip tone={open ? "sage" : "neutral"}>{open ? "Window open" : "Resting"}</Chip>
      </div>
      <p className="mt-4 font-body text-sm text-muted">
        {open ? "Your eating window is currently open." : "Your eating window is currently closed."}
      </p>
    </Card>
  );
}

function MealLogList({
  logs,
  onAdd,
  onDeleted,
}: {
  logs: MealLog[];
  onAdd: () => void;
  onDeleted: () => void;
}) {
  async function deleteMeal(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Eyebrow>meal log</Eyebrow>
          <h2 className="mt-2 font-display text-2xl text-ink">Today’s meals</h2>
        </div>
        <Button variant="accent" onClick={onAdd}>+ Add meal</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {mealGroups.map((group) => {
          const meals = logs.filter((log) => log.meal_type === group.key);
          return (
            <div key={group.key} className="rounded-xl border border-hairline p-4">
              <h3 className="font-body text-sm font-semibold text-ink">{group.label}</h3>
              <div className="mt-3 space-y-3">
                {meals.length ? meals.map((meal) => (
                  <div key={meal.id} className="flex items-start justify-between gap-3 border-t border-hairline pt-3 first:border-0 first:pt-0">
                    <div>
                      <p className="font-body text-sm text-ink2">{meal.meal_name}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted">
                        {meal.calories ?? 0} cal · P {meal.protein_g ?? 0}g · C {meal.carbs_g ?? 0}g · F {meal.fat_g ?? 0}g
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteMeal(meal.id)} aria-label="Delete meal">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )) : <p className="font-body text-sm text-muted">No {group.label.toLowerCase()} logged.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DietContextBadges({ diet }: { diet: DietPreferences | null }) {
  const badges = [
    diet?.diet_type,
    diet?.is_gluten_free ? "Gluten-free" : "",
    diet?.is_lactose_free ? "Lactose-free" : "",
    diet?.is_dairy_free ? "Dairy-free" : "",
    diet?.is_jain ? "Jain" : "",
    diet?.is_halal ? "Halal" : "",
    diet?.is_kosher ? "Kosher" : "",
  ].filter(Boolean);

  return (
    <Card>
      <Eyebrow>your active restrictions</Eyebrow>
      <div className="mt-4 flex flex-wrap gap-2">
        {badges.length ? badges.map((badge) => <Chip key={badge} tone="clay">{badge}</Chip>) : <span className="font-body text-sm text-muted">No restrictions set.</span>}
      </div>
    </Card>
  );
}

function DeficiencyReminders({ data }: { data: MealsTodayResponse }) {
  return (
    <div className="space-y-3">
      {data.healthContext?.has_iron_deficiency ? (
        <SafetyBanner tone="info" title="Iron reminder" body="Consider iron-rich foods today: lentils, spinach, tofu, fortified cereals. Pairing with vitamin C helps absorption. Speak with your doctor about testing levels." />
      ) : null}
      {(data.healthContext?.has_b12_deficiency || data.dietPreferences?.is_vegan) ? (
        <SafetyBanner tone="info" title="B12 reminder" body="Plant-based diets can be low in B12. Consider B12-fortified foods like nutritional yeast, plant milks, or fortified cereals. Speak with a doctor about testing." />
      ) : null}
      {data.healthContext?.has_vitamin_d_deficiency ? (
        <SafetyBanner tone="info" title="Vitamin D reminder" body="Consider dietary sources like eggs, fortified foods, and sunlight exposure. Speak with your doctor about testing your vitamin D levels." />
      ) : null}
    </div>
  );
}

function MealSuggestionCard({
  onUseSuggestion,
}: {
  onUseSuggestion: (draft: MealDraft) => void;
}) {
  const [mealType, setMealType] = useState("breakfast");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<MealSuggestion | null>(null);

  async function suggest() {
    setLoading(true);
    try {
      const response = await fetch("/api/meals/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType }),
      });
      if (!response.ok) {
        useToastStore.getState().addToast("Something went wrong. Try again.", "error");
        return;
      }
      setSuggestion((await response.json()) as MealSuggestion);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Eyebrow>meal suggestion</Eyebrow>
          <h2 className="mt-2 font-display text-2xl text-ink">Ask Karigai for a meal idea</h2>
        </div>
        <Select
          value={mealType}
          onChange={(event) => setMealType(event.target.value)}
          options={[
            { value: "breakfast", label: "Breakfast" },
            { value: "lunch", label: "Lunch" },
            { value: "dinner", label: "Dinner" },
          ]}
        />
      </div>
      <Button variant="accent" onClick={suggest} loading={loading}>
        ✨ Suggest a meal for {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
      </Button>
      {loading ? <SkeletonCard /> : null}
      {suggestion && !loading ? (
        <div className="rounded-xl border border-hairline p-4">
          <h3 className="font-body text-base font-semibold text-ink">{suggestion.mealName}</h3>
          <ul className="mt-3 list-inside list-disc font-body text-sm text-muted">
            {suggestion.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
          </ul>
          <p className="mt-3 font-mono text-xs text-muted">
            {suggestion.estimatedCalories} cal · P {suggestion.estimatedMacros.proteinG}g · C {suggestion.estimatedMacros.carbsG}g · F {suggestion.estimatedMacros.fatG}g · Fiber {suggestion.estimatedMacros.fiberG}g
          </p>
          <p className="mt-3 font-body text-sm leading-6 text-ink2">{suggestion.reason}</p>
          {suggestion.safetyNote ? <div className="mt-3"><SafetyBanner tone="info" title="Safety note" body={suggestion.safetyNote} /></div> : null}
          <Button
            className="mt-4"
            size="sm"
            onClick={() =>
              onUseSuggestion({
                mealType,
                mealName: suggestion.mealName,
                calories: suggestion.estimatedCalories,
                proteinG: suggestion.estimatedMacros.proteinG,
                carbsG: suggestion.estimatedMacros.carbsG,
                fatG: suggestion.estimatedMacros.fatG,
                fiberG: suggestion.estimatedMacros.fiberG,
                notes: suggestion.reason,
              })
            }
          >
            Log this meal
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export default function MealsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["meals-today"], queryFn: fetchMealsToday });
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const openModal = (nextDraft?: MealDraft) => {
    setDraft(nextDraft ?? null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="nutrition" title="Meals & Nutrition" subtitle="Track meals, hydration, restrictions, and Karigai suggestions." />
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}
      {error ? <QueryError error={error} retry={() => void refetch()} /> : null}
      {data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <NutritionProgressCard summary={data.summary} targets={data.targets} />
            <WaterProgressCard waterMl={data.waterMl} targetMl={data.waterTargetMl} onChanged={() => void refetch()} />
            <FastingWindowCard data={data} />
          </div>
          <MealLogList logs={data.logs} onAdd={() => openModal()} onDeleted={() => void refetch()} />
          <MealSuggestionCard onUseSuggestion={(nextDraft) => openModal(nextDraft)} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DietContextBadges diet={data.dietPreferences} />
            <DeficiencyReminders data={data} />
          </div>
          <AddMealModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => void refetch()} draft={draft} />
        </>
      ) : null}
    </div>
  );
}
