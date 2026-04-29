import { NextResponse, type NextRequest } from "next/server";
import { calculateSetupProgress, type UserSetupData } from "@/lib/setup-progress";
import { createClient } from "@/lib/supabase/server";

type SetupSection =
  | "basic_profile"
  | "body_metrics"
  | "health_context"
  | "cycle_profile"
  | "diet_preferences"
  | "fasting_preferences"
  | "fitness_preferences"
  | "goals";

type SetupPayload = {
  section?: string;
  data?: Record<string, unknown>;
};

type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

const sectionNames = new Set<string>([
  "basic_profile",
  "body_metrics",
  "health_context",
  "cycle_profile",
  "diet_preferences",
  "fasting_preferences",
  "fitness_preferences",
  "goals",
]);

function isSetupSection(section: string | undefined): section is SetupSection {
  return Boolean(section && sectionNames.has(section));
}

function pick(data: Record<string, unknown>, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, data[field]]).filter(([, value]) => value !== undefined));
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

class SetupApiError extends Error {
  status: number;
  debug?: string;

  constructor(message: string, status = 500, debug?: string) {
    super(message);
    this.name = "SetupApiError";
    this.status = status;
    this.debug = debug;
  }
}

function printMissingTablesInstructions() {
  console.error(`
============================================================
DATABASE TABLES MISSING - ACTION REQUIRED
============================================================
The Supabase database tables have not been created.

TO FIX:
1. Open: https://supabase.com/dashboard
2. Go to your project -> SQL Editor
3. Run the file: supabase/fix_missing_tables.sql
4. Restart the dev server: npm run dev
============================================================
  `);
}

function userMessageForSupabaseError(error: SupabaseError) {
  if (error.message?.includes("schema cache")) {
    return "Database setup incomplete. Please run supabase/fix_missing_tables.sql in Supabase.";
  }

  if (error.code === "42P01") {
    return "Database table missing. Please run supabase/fix_missing_tables.sql in Supabase.";
  }

  if (error.code === "42501") {
    return "Permission error. Please sign out and sign in again.";
  }

  return "Failed to save. Please try again.";
}

async function throwIfError(result: { error: SupabaseError | null }, section: SetupSection) {
  if (result.error) {
    console.error(`[Setup API] Failed to save section "${section}":`, {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    if (result.error.message?.includes("schema cache") || result.error.code === "42P01") {
      printMissingTablesInstructions();
    }

    throw new SetupApiError(userMessageForSupabaseError(result.error), 500, result.error.message);
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, resource: "setup" });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SetupPayload;
    console.log("Setup save request:", { section: payload.section });

    if (!isSetupSection(payload.section) || !payload.data) {
      console.error("Unknown or invalid setup section:", payload.section);
      return jsonError("Invalid setup section payload.", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Setup auth error:", userError);
      return jsonError("Unauthorized", 401);
    }

    const userId = user.id;

    switch (payload.section) {
      case "basic_profile": {
        await throwIfError(
          await supabase.from("profiles").upsert(
            {
              user_id: userId,
              ...pick(payload.data, ["name", "age", "height_cm", "weight_kg"]),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
          payload.section,
        );
        break;
      }
      case "body_metrics": {
        await throwIfError(
          await supabase.from("body_metrics").upsert(
            {
              user_id: userId,
              date: todayIsoDate(),
              ...pick(payload.data, ["waist_cm", "hip_cm", "body_fat_percent"]),
            },
            { onConflict: "user_id" },
          ),
          payload.section,
        );
        if (payload.data.target_weight_kg !== undefined) {
          await throwIfError(
            await supabase.from("goals").upsert(
              {
                user_id: userId,
                target_weight_kg: payload.data.target_weight_kg,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            ),
            payload.section,
          );
        }
        break;
      }
      case "health_context": {
        await throwIfError(
          await supabase.from("health_context").upsert(
            {
              user_id: userId,
              ...payload.data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
          payload.section,
        );
        break;
      }
      case "cycle_profile": {
        await throwIfError(
          await supabase.from("cycle_profile").upsert(
            {
              user_id: userId,
              ...payload.data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
          payload.section,
        );
        break;
      }
      case "diet_preferences": {
        await throwIfError(
          await supabase.from("diet_preferences").upsert(
            {
              user_id: userId,
              ...payload.data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
          payload.section,
        );
        break;
      }
      case "fasting_preferences": {
        await throwIfError(
          await supabase.from("fasting_preferences").upsert(
            {
              user_id: userId,
              ...payload.data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
          payload.section,
        );
        break;
      }
      case "fitness_preferences": {
        await throwIfError(
          await supabase.from("fitness_preferences").upsert(
            {
              user_id: userId,
              ...payload.data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
          payload.section,
        );
        break;
      }
      case "goals": {
        await throwIfError(
          await supabase.from("goals").upsert(
            {
              user_id: userId,
              ...payload.data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
          payload.section,
        );
        break;
      }
    }

    const [
      profileResult,
      bodyMetricsResult,
      healthContextResult,
      cycleProfileResult,
      dietPreferencesResult,
      fastingPreferencesResult,
      fitnessPreferencesResult,
      goalsResult,
    ] = await Promise.all([
      supabase.from("profiles").select("name,age,height_cm,weight_kg").eq("user_id", userId).maybeSingle(),
      supabase.from("body_metrics").select("waist_cm,hip_cm").eq("user_id", userId).order("date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("health_context").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("cycle_profile").select("last_period_start").eq("user_id", userId).maybeSingle(),
      supabase.from("diet_preferences").select("diet_type").eq("user_id", userId).maybeSingle(),
      supabase.from("fasting_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("fitness_preferences").select("workout_days_per_week").eq("user_id", userId).maybeSingle(),
      supabase.from("goals").select("primary_goal").eq("user_id", userId).maybeSingle(),
    ]);

    const setupProgress = calculateSetupProgress({
      profile: profileResult.data,
      bodyMetrics: bodyMetricsResult.data,
      healthContext: healthContextResult.data as Record<string, unknown> | null,
      cycleProfile: cycleProfileResult.data,
      dietPreferences: dietPreferencesResult.data,
      fastingPreferences: fastingPreferencesResult.data as Record<string, unknown> | null,
      fitnessPreferences: fitnessPreferencesResult.data,
      goals: goalsResult.data,
    } satisfies UserSetupData);

    return NextResponse.json({ success: true, setupProgress });
  } catch (error) {
    console.error("Setup route error:", error);
    if (error instanceof SetupApiError) {
      return NextResponse.json(
        {
          error: error.message,
          debug: process.env.NODE_ENV === "development" ? error.debug : undefined,
        },
        { status: error.status },
      );
    }

    return jsonError("Internal server error", 500);
  }
}
