import { NextResponse, type NextRequest } from "next/server";
import { buildMealSuggestionPrompt } from "@/lib/ai-prompt-engine";
import { calculateMacroTargets, calculateRemaining, summarizeMealLogs } from "@/lib/nutrition-engine";
import { runPersonalizationRules } from "@/lib/safety-rules";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";

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

function fallbackSuggestion(mealType: string): MealSuggestion {
  return {
    mealName: `${mealType} lentil power bowl`,
    ingredients: ["lentils", "brown rice", "spinach", "cucumber", "lemon", "olive oil"],
    estimatedCalories: 520,
    estimatedMacros: { proteinG: 26, carbsG: 72, fatG: 14, fiberG: 15 },
    reason:
      "This fallback keeps the meal vegetarian, protein-forward, and fiber-rich based on your shared context.",
    safetyNote: "This is wellness guidance only and may not fit every medical need.",
  };
}

function parseSuggestion(content: string, mealType: string): MealSuggestion {
  try {
    const parsed = JSON.parse(content) as Partial<MealSuggestion>;

    if (
      typeof parsed.mealName === "string" &&
      Array.isArray(parsed.ingredients) &&
      typeof parsed.estimatedCalories === "number" &&
      parsed.estimatedMacros &&
      typeof parsed.reason === "string"
    ) {
      return {
        mealName: parsed.mealName,
        ingredients: parsed.ingredients.filter((item): item is string => typeof item === "string"),
        estimatedCalories: parsed.estimatedCalories,
        estimatedMacros: {
          proteinG: Number(parsed.estimatedMacros.proteinG ?? 0),
          carbsG: Number(parsed.estimatedMacros.carbsG ?? 0),
          fatG: Number(parsed.estimatedMacros.fatG ?? 0),
          fiberG: Number(parsed.estimatedMacros.fiberG ?? 0),
        },
        reason: parsed.reason,
        safetyNote: typeof parsed.safetyNote === "string" ? parsed.safetyNote : undefined,
      };
    }
  } catch {
    return fallbackSuggestion(mealType);
  }

  return fallbackSuggestion(mealType);
}

export async function POST(request: NextRequest) {
  const { mealType } = (await request.json()) as { mealType?: string };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const ctx = await getUserContext(user.id);
  const today = new Date().toISOString().slice(0, 10);
  const todaysMeals = ctx.mealLogs.filter((log) => log.date === today);
  const targets = calculateMacroTargets(ctx);
  const remaining = calculateRemaining(targets, summarizeMealLogs(todaysMeals));
  const rules = runPersonalizationRules({
    healthContext: ctx.healthContext,
    dietPreferences: ctx.dietPreferences,
    fastingPreferences: ctx.fastingPreferences,
    fitnessPreferences: ctx.fitnessPreferences,
    todayEnergyScore: ctx.todayEnergyScore,
  });
  const selectedMealType = mealType ?? "lunch";
  const prompt = buildMealSuggestionPrompt(ctx, rules, selectedMealType, remaining.calories);

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    const firstBlock = msg.content?.[0];
    const text = typeof firstBlock?.text === "string" ? firstBlock.text : "";

    return NextResponse.json(parseSuggestion(text, selectedMealType));
  } catch {
    return NextResponse.json(fallbackSuggestion(selectedMealType));
  }
}
