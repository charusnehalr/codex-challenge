import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    date?: string;
    isPeriodDay?: boolean;
    flowLevel?: string;
    painScore?: number;
    symptoms?: string[];
    mood?: string;
    energyScore?: number;
    energy_score?: number;
    notes?: string;
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const date = body.date ?? todayIsoDate();
  const energyScore = body.energyScore ?? body.energy_score;
  const cycleResult = await supabase.from("cycle_logs").upsert(
    {
      user_id: user.id,
      date,
      is_period_day: body.isPeriodDay ?? false,
      flow_level: body.flowLevel,
      pain_score: body.painScore,
      symptoms: body.symptoms ?? [],
      mood: body.mood,
      energy_score: energyScore,
      notes: body.notes,
    },
    { onConflict: "user_id,date" },
  );

  if (cycleResult.error) {
    return NextResponse.json({ error: cycleResult.error.message }, { status: 500 });
  }

  const dailyResult = await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      date,
      energy_score: energyScore,
      mood: body.mood,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" },
  );

  if (dailyResult.error) {
    return NextResponse.json({ error: dailyResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
