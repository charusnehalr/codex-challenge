import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const tables = [
  "profiles",
  "body_metrics",
  "health_context",
  "cycle_profile",
  "cycle_logs",
  "diet_preferences",
  "fasting_preferences",
  "fitness_preferences",
  "goals",
  "daily_logs",
  "meal_logs",
  "workout_logs",
  "chat_messages",
] as const;

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const supabase = await createClient();
  const results: Record<string, string> = {};

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    results[table] = error ? `missing: ${error.message}` : "exists";
  }

  return NextResponse.json({ tables: results });
}
