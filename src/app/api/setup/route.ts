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

async function throwIfError(result: { error: SupabaseError | null }) {
  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, resource: "setup" });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as SetupPayload;

  if (!isSetupSection(payload.section) || !payload.data) {
    return jsonError("Invalid setup section payload.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("Authentication is required to save setup.", 401);
  }

  const userId = user.id;

  try {
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
        );
        break;
      }
      case "body_metrics": {
        await throwIfError(
          await supabase.from("body_metrics").insert({
            user_id: userId,
            date: todayIsoDate(),
            ...pick(payload.data, ["waist_cm", "hip_cm", "body_fat_percent"]),
          }),
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
    return jsonError(error instanceof Error ? error.message : "Unable to save setup.", 500);
  }
}
