import { NextResponse } from "next/server";
import {
  estimateCyclePhase,
  estimateNextPeriod,
  getCycleConfidence,
  getCycleDay,
  getDaysUntilNextPeriod,
} from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";

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
  const cycleDay = lastPeriodStart ? getCycleDay(lastPeriodStart, today, cycleLength) : undefined;
  const cyclePhase = cycleDay ? estimateCyclePhase(cycleDay, cycleLength) : "Unknown";
  const cycleConfidence = cycleProfile ? getCycleConfidence(cycleProfile.cycle_regular ?? "unsure") : "medium";
  const nextPeriod = lastPeriodStart ? estimateNextPeriod(lastPeriodStart, cycleLength) : undefined;
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
    cycleDay,
    cyclePhase,
    cycleConfidence,
    nextPeriodEstimate: nextPeriod ? isoDate(nextPeriod) : undefined,
    daysUntilNextPeriod: nextPeriod ? getDaysUntilNextPeriod(nextPeriod, today) : undefined,
  });
}
