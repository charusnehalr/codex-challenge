import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const singleTables = [
  "profiles",
  "health_context",
  "cycle_profile",
  "diet_preferences",
  "fasting_preferences",
  "fitness_preferences",
  "goals",
] as const;

const listTables = [
  "body_metrics",
  "cycle_logs",
  "daily_logs",
  "meal_logs",
  "workout_logs",
  "chat_messages",
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const singleResults = await Promise.all(
    singleTables.map(async (table) => {
      const { data } = await supabase.from(table).select("*").eq("user_id", user.id).maybeSingle();
      return [table, data] as const;
    }),
  );

  const listResults = await Promise.all(
    listTables.map(async (table) => {
      const { data } = await supabase.from(table).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return [table, data ?? []] as const;
    }),
  );

  const payload = Object.fromEntries([...singleResults, ...listResults]);
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), userId: user.id, data: payload }, null, 2);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="karigai-data-export.json"',
    },
  });
}
