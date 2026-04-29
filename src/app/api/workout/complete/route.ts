import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    completed?: boolean;
    feedback?: string;
    skippedReason?: string;
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const today = todayIsoDate();
  const existing = await supabase
    .from("workout_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!existing.data) return NextResponse.json({ error: "No workout found for today." }, { status: 404 });

  const result = await supabase
    .from("workout_logs")
    .update({
      completed: body.completed ?? true,
      feedback: body.feedback,
      skipped_reason: body.completed === false ? body.skippedReason : null,
    })
    .eq("id", existing.data.id);

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
