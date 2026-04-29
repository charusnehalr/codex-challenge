import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const logTables = ["meal_logs", "cycle_logs", "workout_logs", "chat_messages", "daily_logs", "body_metrics"] as const;
const allTables = [
  ...logTables,
  "goals",
  "fitness_preferences",
  "fasting_preferences",
  "diet_preferences",
  "cycle_profile",
  "health_context",
  "profiles",
] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { action?: string };
  const tables = body.action === "delete_account" ? allTables : body.action === "clear_logs" ? logTables : null;

  if (!tables) {
    return NextResponse.json({ error: "Unknown privacy action" }, { status: 400 });
  }

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: "Unable to update privacy data." }, { status: 500 });
    }
  }

  if (body.action === "delete_account") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceRoleKey && !serviceRoleKey.startsWith("your_")) {
      const admin = createSupabaseAdminClient(url, serviceRoleKey);
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) {
        return NextResponse.json({ error: "Account data was cleared, but auth deletion failed." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
