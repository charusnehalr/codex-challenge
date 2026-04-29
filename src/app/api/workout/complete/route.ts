import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const result = await supabase.from("workout_logs").insert({
    user_id: user.id,
    date: todayIsoDate(),
    workout_name: "Cycle-aware strength and mobility",
    duration_minutes: 45,
    intensity: "moderate",
    completed: true,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
