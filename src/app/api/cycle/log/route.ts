import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const { energy_score, symptoms } = (await request.json()) as {
    energy_score?: number;
    symptoms?: string[];
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const today = todayIsoDate();
  const result = await supabase.from("cycle_logs").upsert(
    {
      user_id: user.id,
      date: today,
      energy_score,
      symptoms: symptoms ?? [],
    },
    { onConflict: "user_id,date" },
  );

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
