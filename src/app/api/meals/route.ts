import { NextResponse, type NextRequest } from "next/server";
import { summarizeMealLogs } from "@/lib/nutrition-engine";
import { createClient } from "@/lib/supabase/server";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isNonNegative(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    mealType?: string;
    mealName?: string;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fiberG?: number;
    notes?: string;
  };

  if (!body.mealName?.trim()) {
    return NextResponse.json({ error: "Meal name is required." }, { status: 400 });
  }

  for (const field of ["calories", "proteinG", "carbsG", "fatG", "fiberG"] as const) {
    if (body[field] !== undefined && !isNonNegative(body[field])) {
      return NextResponse.json({ error: `${field} must be zero or more.` }, { status: 400 });
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const today = todayIsoDate();
  const insertResult = await supabase.from("meal_logs").insert({
    user_id: user.id,
    date: today,
    meal_type: body.mealType,
    meal_name: body.mealName,
    calories: body.calories ?? 0,
    protein_g: body.proteinG ?? 0,
    carbs_g: body.carbsG ?? 0,
    fat_g: body.fatG ?? 0,
    fiber_g: body.fiberG ?? 0,
    notes: body.notes,
  });

  if (insertResult.error) {
    return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
  }

  const logsResult = await supabase.from("meal_logs").select("*").eq("user_id", user.id).eq("date", today);

  return NextResponse.json({
    success: true,
    updatedTotals: summarizeMealLogs(logsResult.data ?? []),
  });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Meal id is required." }, { status: 400 });
  }

  const result = await supabase.from("meal_logs").delete().eq("id", id).eq("user_id", user.id);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
