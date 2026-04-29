"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Apple, ChevronDown, Coffee, Droplets, Info, Moon, Sun, Trash2, UtensilsCrossed, X } from "lucide-react";
import { AddMealModal, type MealDraft } from "@/components/features/meals/AddMealModal";
import { Button, Card, Chip, Eyebrow, PageTransition, ProgressRing, QueryError, SafetyBanner, SkeletonCard } from "@/components/ui";
import { useDashboard } from "@/hooks/useDashboard";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { ensureAuthenticated } from "@/lib/auth-guard";
import { formatHealthLabel } from "@/lib/format-labels";
import type { MacroTargets, NutritionSummary } from "@/lib/nutrition-engine";
import { cn } from "@/lib/utils";
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
    fastingDisabled?: boolean;
    showIronFoodReminder?: boolean;
    showB12FoodReminder?: boolean;
    showVitaminDReminder?: boolean;
  };
};

const mealGroups = [
  { key: "breakfast", label: "Breakfast", icon: Coffee },
  { key: "snack", label: "Snack", icon: Apple },
  { key: "lunch", label: "Lunch", icon: Sun },
  { key: "dinner", label: "Dinner", icon: Moon },
] as const;

async function fetchMealsToday() {
  const response = await fetch("/api/meals/today", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Unable to load meals.");
  }
  return (await response.json()) as MealsTodayResponse;
}

function formatDate() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function percent(value: number, target: number) {
  return target ? Math.min(1, Math.max(0, value / target)) : 0;
}

function emptyMealDraft(mealType = "breakfast"): MealDraft {
  return { mealType, mealName: "", calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, notes: "" };
}

function phaseTip(phase?: string) {
  const clean = formatHealthLabel(phase ?? "").toLowerCase();
  if (clean.includes("menstrual")) return "Iron-rich foods are helpful today.";
  if (clean.includes("follicular")) return "Light, varied meals. Good energy phase.";
  if (clean.includes("ovulation")) return "Balanced macros. Anti-inflammatory foods.";
  if (clean.includes("luteal")) return "Protein and complex carbs for cravings.";
  return "Steady meals with protein and fibre.";
}

function healthChips(health: HealthContext | null) {
  if (!health) return [];
  return [
    health.has_pcos ? "PCOS" : "",
    health.has_pcod ? "PCOD" : "",
    health.has_iron_deficiency ? "Iron deficiency" : "",
    health.has_b12_deficiency ? "B12 deficiency" : "",
    health.has_vitamin_d_deficiency ? "Vitamin D deficiency" : "",
    health.has_thyroid_condition ? "Thyroid condition" : "",
    health.has_prediabetes ? "Prediabetes" : "",
  ].filter(Boolean);
}

function dietChips(diet: DietPreferences | null) {
  if (!diet) return [];
  return [
    diet.diet_type ? formatHealthLabel(diet.diet_type) : "",
    diet.is_gluten_free ? "Gluten-free" : "",
    diet.is_lactose_free ? "Lactose-free" : "",
    diet.is_dairy_free ? "Dairy-free" : "",
    diet.is_jain ? "Jain" : "",
    diet.is_halal ? "Halal" : "",
    diet.is_kosher ? "Kosher" : "",
    diet.is_nut_free ? "Nut-free" : "",
    diet.is_soy_free ? "Soy-free" : "",
  ].filter(Boolean);
}

function ContextStrip({ data }: { data: MealsTodayResponse }) {
  const { data: dashboard } = useDashboard();
  const factors = dashboard?.personalizationFactors;
  const chips = [
    { value: data.dietPreferences?.diet_type ? formatHealthLabel(data.dietPreferences.diet_type) : "", tone: "bone" as const },
    ...healthChips(data.healthContext).slice(0, 2).map((value) => ({ value, tone: "neutral" as const })),
    { value: factors?.cyclePhase ? `${formatHealthLabel(factors.cyclePhase)} phase` : "", tone: "blush" as const },
    { value: factors?.goal ? formatHealthLabel(factors.goal) : "", tone: "clay" as const },
  ].filter((chip) => chip.value);

  return (
    <div className="mt-3 flex items-center justify-between gap-4 rounded-xl bg-shell/40 p-3">
      <div className="flex flex-wrap gap-1.5">
        {chips.length ? (
          chips.map((chip) => (
            <Chip key={`${chip.tone}-${chip.value}`} tone={chip.tone} className="h-6 px-2.5 font-mono text-[10px]">
              {chip.value}
            </Chip>
          ))
        ) : (
          <p className="font-body text-xs text-muted">Add onboarding context to personalise meal guidance.</p>
        )}
      </div>
      <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{formatDate()}</p>
    </div>
  );
}

function NutritionTodayCard({ summary, targets }: { summary: NutritionSummary; targets: MacroTargets }) {
  const caloriePercent = percent(summary.calories, targets.calories);
  const macros = [
    { label: "Protein", value: summary.proteinG, target: targets.proteinG, color: "#7A8B6F", suffix: "g" },
    { label: "Carbs", value: summary.carbsG, target: targets.carbsG, color: "#C9B99A", suffix: "g" },
    { label: "Fat", value: summary.fatG, target: targets.fatG, color: "#E8B4A8", suffix: "g" },
  ];

  return (
    <Card padding="sm" className="h-[180px] p-4" interactive>
      <Eyebrow>nutrition today</Eyebrow>
      <div className="mt-3 grid grid-cols-[1.1fr_0.9fr] gap-5">
        <div className="min-w-0">
          <p className="font-display text-4xl leading-none text-clay">{formatNumber(summary.calories)}</p>
          <p className="mt-1 whitespace-nowrap font-mono text-xs text-muted">of {formatNumber(targets.calories)} kcal</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-shell">
            <motion.div
              className="h-full rounded-full bg-clay"
              initial={{ width: 0 }}
              animate={{ width: `${caloriePercent * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-3 font-body text-xs leading-relaxed text-muted">Daily target with steady protein and fibre.</p>
        </div>
        <div className="space-y-2">
          {macros.map((macro, index) => (
            <motion.div
              key={macro.label}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex items-center gap-2"
            >
              <ProgressRing value={percent(macro.value, macro.target)} size={36} stroke={4} color={macro.color} />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{macro.label}</p>
                <p className="font-mono text-[10px] text-ink2">
                  {formatNumber(macro.value)}/{formatNumber(macro.target)}
                  {macro.suffix}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function HydrationCard({ waterMl, targetMl, onChanged }: { waterMl: number; targetMl: number; onChanged: () => void }) {
  async function updateWater(amountMl: number) {
    if (!(await ensureAuthenticated("signup"))) return;

    const response = await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
    <Card padding="sm" className="flex h-[180px] flex-col p-4" interactive>
      <Eyebrow>hydration</Eyebrow>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl leading-none text-[#6B8AA8]">{formatNumber(waterMl)}</p>
          <p className="mt-1 whitespace-nowrap font-mono text-xs text-muted">of {formatNumber(targetMl)}ml</p>
        </div>
        <div className="rounded-full bg-[#6B8AA8]/10 px-3 py-1 font-mono text-[10px] text-[#6B8AA8]">
          {Math.round(percent(waterMl, targetMl) * 100)}%
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="h-3 overflow-hidden rounded-full bg-shell shadow-inner">
          <motion.div
            className="h-full rounded-full bg-[#6B8AA8]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percent(waterMl, targetMl) * 100)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between font-mono text-[9px] text-muted">
          <span>0ml</span>
          <span>{formatNumber(targetMl)}ml goal</span>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-4 gap-1.5">
        {[-500, -250, 250, 500].map((amount) => (
          <motion.button
            key={amount}
            type="button"
            data-cursor-hover
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={() => void updateWater(amount)}
            className="h-8 rounded-xl border border-[#6B8AA8]/20 bg-[#6B8AA8]/10 font-body text-[11px] text-[#6B8AA8] transition-colors hover:bg-[#6B8AA8]/20"
          >
            {amount > 0 ? "+" : "-"} {Math.abs(amount)}
          </motion.button>
        ))}
      </div>
    </Card>
  );
}

function TodayFocusCard({ data }: { data: MealsTodayResponse }) {
  const { data: dashboard } = useDashboard();
  const fasting = data.fastingPreferences;
  const fastingEnabled = fasting?.interested_in_fasting && !data.rules.fastingDisabled;
  const mealFocus = dashboard?.todayPlan.mealFocus ?? "Balanced meals with steady protein and fibre";
  const phase = dashboard?.personalizationFactors.cyclePhase;

  if (fastingEnabled) {
    const start = fasting.eating_window_start?.slice(0, 5) ?? "08:00";
    const end = fasting.eating_window_end?.slice(0, 5) ?? "22:00";
    const now = new Date();
    const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const open = current >= start && current <= end;
    return (
      <Card padding="sm" className="h-[180px] p-4" interactive>
        <Eyebrow>fasting window</Eyebrow>
        <p className="mt-4 font-display text-2xl italic text-clay">
          {start} – {end}
        </p>
        <div className="mt-3">
          <Chip tone={open ? "sage" : "neutral"}>{open ? "Window open" : "Resting"}</Chip>
        </div>
        <p className="mt-3 font-body text-xs leading-relaxed text-muted">
          {fasting.fasting_type ?? "Fasting"} · {open ? "Window currently open." : "Window currently closed."}
        </p>
      </Card>
    );
  }

  return (
    <Card padding="sm" className="h-[180px] p-4" interactive>
      <Eyebrow>today's focus</Eyebrow>
      <p className="mt-4 font-display text-xl italic leading-tight text-clay">{mealFocus}</p>
      <p className="mt-4 font-body text-xs leading-relaxed text-muted">{phaseTip(phase)}</p>
      <div className="mt-4 flex items-center gap-2 text-muted">
        <UtensilsCrossed className="size-4 text-clay" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">regular meals today</span>
      </div>
    </Card>
  );
}

function MealLogTimeline({
  logs,
  onAdd,
  onDeleted,
}: {
  logs: MealLog[];
  onAdd: (mealType?: string) => void;
  onDeleted: () => void;
}) {
  async function deleteMeal(id: string) {
    if (!(await ensureAuthenticated("signup"))) return;
    const response = await fetch(`/api/meals?id=${id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }
    onDeleted();
  }

  return (
    <Card padding="sm" className="p-4" interactive>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Eyebrow>meal log</Eyebrow>
          <h2 className="mt-1 font-display text-xl italic text-ink">Today's meals</h2>
        </div>
        <Button variant="accent" size="sm" onClick={() => onAdd()}>
          + Add meal
        </Button>
      </div>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-4 divide-y divide-hairline">
        {mealGroups.map((group) => {
          const Icon = group.icon;
          const meals = logs.filter((log) => log.meal_type === group.key);
          return (
            <motion.div key={group.key} variants={fadeUp} className="py-3 first:pt-0 last:pb-0">
              <div
                className={cn(
                  "rounded-xl border p-3",
                  meals.length ? "border-hairline bg-card" : "border-dashed border-hairline bg-shell/30",
                )}
              >
                <div className="flex min-h-8 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-shell text-clay">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium text-ink">{group.label}</p>
                      {!meals.length ? (
                        <p className="font-body text-xs text-muted">No {group.label.toLowerCase()} logged</p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-cursor-hover
                    onClick={() => onAdd(group.key)}
                    className="shrink-0 rounded-xl border border-hairline bg-card px-3 py-1.5 font-body text-xs text-clay transition-colors hover:bg-shell"
                  >
                    + add
                  </button>
                </div>
                {meals.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {meals.map((meal) => (
                      <motion.div
                        key={meal.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group inline-flex items-center gap-2 rounded-xl border border-hairline bg-card px-3 py-1.5"
                      >
                        <span className="max-w-[160px] truncate font-body text-sm text-ink">{meal.meal_name}</span>
                        <span className="font-mono text-[10px] text-muted">{meal.calories ?? 0} kcal</span>
                        <button
                          type="button"
                          data-cursor-hover
                          onClick={() => void deleteMeal(meal.id)}
                          className="text-muted opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Delete meal"
                        >
                          <X className="size-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
}

function MealSuggestionPanel({ onUseSuggestion }: { onUseSuggestion: (draft: MealDraft) => void }) {
  const [mealType, setMealType] = useState("breakfast");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<MealSuggestion | null>(null);
  const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);

  async function suggest() {
    if (!(await ensureAuthenticated("signup"))) return;

    setLoading(true);
    try {
      const response = await fetch("/api/meals/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
    <Card padding="sm" className="p-4" interactive>
      <Eyebrow>meal suggestion</Eyebrow>
      <h2 className="mt-1 font-display text-xl italic text-ink">Ask Karigai for an idea</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {mealGroups.map((group) => (
          <button
            key={group.key}
            type="button"
            data-cursor-hover
            onClick={() => setMealType(group.key)}
            className={cn(
              "h-8 rounded-chip border px-3 font-body text-xs transition-colors",
              mealType === group.key ? "border-clay bg-clay text-cream" : "border-hairline bg-shell text-muted hover:text-ink",
            )}
          >
            {group.label}
          </button>
        ))}
      </div>
      <Button variant="accent" className="mt-4 w-full" onClick={() => void suggest()} loading={loading}>
        <span className="sparkle">✦</span> Suggest a {mealLabel}
      </Button>
      {loading ? (
        <div className="mt-4">
          <SkeletonCard />
          <p className="mt-2 font-mono text-xs italic text-muted">Karigai is thinking...</p>
        </div>
      ) : null}
      {suggestion && !loading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="mt-4 rounded-2xl border border-hairline bg-card p-5"
        >
          <h3 className="font-display text-xl italic text-clay">{suggestion.mealName}</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {suggestion.ingredients.map((ingredient) => (
              <Chip key={ingredient} tone="bone" className="h-6 px-2.5 text-[10px]">
                {ingredient}
              </Chip>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] text-muted">
            {suggestion.estimatedCalories} kcal · {suggestion.estimatedMacros.proteinG}g protein · {suggestion.estimatedMacros.carbsG}g carbs · {suggestion.estimatedMacros.fatG}g fat
          </p>
          <p className="mt-3 font-body text-sm italic leading-relaxed text-ink2">{suggestion.reason}</p>
          {suggestion.safetyNote ? (
            <SafetyBanner tone="info" title="Safety note" body={suggestion.safetyNote} className="mt-3 p-3 pl-4" />
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button
              variant="accent"
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
            <Button variant="ghost" size="sm" onClick={() => void suggest()}>
              Suggest again
            </Button>
          </div>
        </motion.div>
      ) : null}
    </Card>
  );
}

function CollapsibleReminder({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-hairline bg-bone/40">
      <button
        type="button"
        data-cursor-hover
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 font-body text-sm font-medium text-ink">
          <Info className="size-4 text-clay" />
          {title}
        </span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-4">
          <SafetyBanner tone="info" title={title} body={body} className="p-3 pl-4" />
        </motion.div>
      ) : null}
    </div>
  );
}

function ActiveContextSection({ data }: { data: MealsTodayResponse }) {
  const restrictions = dietChips(data.dietPreferences);
  const reminders = [
    data.healthContext?.has_iron_deficiency
      ? {
          title: "Iron reminder",
          body: "Consider iron-rich foods today: lentils, spinach, tofu, fortified cereals. Pairing with vitamin C helps absorption. Speak with your doctor about testing levels.",
        }
      : null,
    data.healthContext?.has_b12_deficiency || data.dietPreferences?.is_vegan
      ? {
          title: "B12 reminder",
          body: "Plant-based diets can be low in B12. Consider B12-fortified foods like nutritional yeast, plant milks, or fortified cereals. Speak with a doctor about testing.",
        }
      : null,
    data.healthContext?.has_vitamin_d_deficiency
      ? {
          title: "Vitamin D reminder",
          body: "Consider dietary sources like eggs, fortified foods, and sunlight exposure. Speak with your doctor about testing your vitamin D levels.",
        }
      : null,
  ].filter((item): item is { title: string; body: string } => Boolean(item));

  return (
    <Card padding="sm" className="p-4" interactive={false}>
      <Eyebrow>your active context</Eyebrow>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {restrictions.length ? (
          restrictions.map((badge) => (
            <Chip key={badge} tone="clay" className="h-6 px-2.5 font-mono text-[10px]">
              {badge}
            </Chip>
          ))
        ) : (
          <span className="font-body text-xs text-muted">No restrictions set.</span>
        )}
      </div>
      {reminders.length ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
          {reminders.map((reminder) => (
            <CollapsibleReminder key={reminder.title} title={reminder.title} body={reminder.body} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export default function MealsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["meals-today"], queryFn: fetchMealsToday });
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<MealDraft | null>(null);

  const openModal = async (nextDraft?: MealDraft) => {
    if (!(await ensureAuthenticated("signup"))) return;
    setDraft(nextDraft ?? null);
    setModalOpen(true);
  };

  const addMealType = (mealType = "breakfast") => void openModal(emptyMealDraft(mealType));

  const topRow = useMemo(() => {
    if (!data) return null;
    return (
      <div className="grid gap-3.5 lg:grid-cols-[1.8fr_1fr_1fr]">
        <NutritionTodayCard summary={data.summary} targets={data.targets} />
        <HydrationCard waterMl={data.waterMl} targetMl={data.waterTargetMl} onChanged={() => void refetch()} />
        <TodayFocusCard data={data} />
      </div>
    );
  }, [data, refetch]);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <Eyebrow>nutrition</Eyebrow>
          <h1 className="mt-1 font-display text-3xl italic leading-tight text-ink">Meals & Nutrition</h1>
          <p className="mt-1 font-body text-sm text-muted">Track meals, hydration, and get personalised suggestions.</p>
          {data ? <ContextStrip data={data} /> : null}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-3.5 lg:grid-cols-[1.8fr_1fr_1fr]">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : null}

        {error ? <QueryError error={error} retry={() => void refetch()} /> : null}

        {data ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
            <motion.div variants={fadeUp}>{topRow}</motion.div>
            <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <MealLogTimeline logs={data.logs} onAdd={addMealType} onDeleted={() => void refetch()} />
              <MealSuggestionPanel onUseSuggestion={(nextDraft) => void openModal(nextDraft)} />
            </motion.div>
            <motion.div variants={fadeUp}>
              <ActiveContextSection data={data} />
            </motion.div>
            <AddMealModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => void refetch()} draft={draft} />
          </motion.div>
        ) : null}
      </div>
    </PageTransition>
  );
}
