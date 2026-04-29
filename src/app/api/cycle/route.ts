import { NextResponse } from "next/server";
import {
  calculateCycleStatus,
  estimateCyclePhase,
  getCycleDay,
} from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const today = new Date();
  const todayString = isoDate(today);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [profileResult, todayLogResult, logsResult] = await Promise.all([
    supabase.from("cycle_profile").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("cycle_logs").select("*").eq("user_id", user.id).eq("date", todayString).maybeSingle(),
    supabase
      .from("cycle_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", isoDate(thirtyDaysAgo))
      .order("date", { ascending: false }),
  ]);

  if (profileResult.error || todayLogResult.error || logsResult.error) {
    return NextResponse.json(
      { error: profileResult.error?.message ?? todayLogResult.error?.message ?? logsResult.error?.message },
      { status: 500 },
    );
  }

  const cycleProfile = profileResult.data;
  const cycleLength = cycleProfile?.average_cycle_length ?? 28;
  const lastPeriodStart = cycleProfile?.last_period_start
    ? new Date(`${cycleProfile.last_period_start}T00:00:00`)
    : null;
  const cycleStatus = calculateCycleStatus(cycleProfile, todayLogResult.data, today);
  const logs = (logsResult.data ?? []).map((log) => {
    const logDate = new Date(`${log.date}T00:00:00`);
    const logCycleDay = lastPeriodStart ? getCycleDay(lastPeriodStart, logDate, cycleLength) : undefined;

    return {
      ...log,
      phase: logCycleDay ? estimateCyclePhase(logCycleDay, cycleLength) : "Unknown",
      cycleDay: logCycleDay,
    };
  });

  return NextResponse.json({
    cycleProfile,
    todayLog: todayLogResult.data,
    logs,
    cycleStatus,
    cycleDay: cycleStatus.cycleDay || undefined,
    cyclePhase: cycleStatus.cyclePhase,
    cycleConfidence: cycleStatus.confidence,
    nextPeriodEstimate: cycleStatus.nextPeriodDate ? isoDate(cycleStatus.nextPeriodDate) : undefined,
    daysUntilNextPeriod: cycleStatus.daysUntilNextPeriod,
  });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { last_period_start?: string };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (!body.last_period_start) {
    return NextResponse.json({ error: "last_period_start is required." }, { status: 400 });
  }

  const result = await supabase.from("cycle_profile").upsert(
    {
      user_id: user.id,
      last_period_start: body.last_period_start,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const profileResult = await supabase.from("cycle_profile").select("*").eq("user_id", user.id).maybeSingle();
  const logResult = await supabase
    .from("cycle_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", body.last_period_start)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    newCycleStatus: calculateCycleStatus(profileResult.data, logResult.data, new Date(`${body.last_period_start}T00:00:00`)),
  });
}
