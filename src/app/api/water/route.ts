import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const { amountMl } = (await request.json()) as { amountMl?: number };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const today = todayIsoDate();
  const existing = await supabase
    .from("daily_logs")
    .select("water_ml")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();
  const nextWater = (existing.data?.water_ml ?? 0) + (amountMl ?? 0);
  const result = await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      date: today,
      water_ml: nextWater,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" },
  );

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, waterMl: nextWater });
}
