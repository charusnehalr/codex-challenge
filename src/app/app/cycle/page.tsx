"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Eyebrow,
  Modal,
  PageHeader,
  QueryError,
  SafetyBanner,
  Select,
  SkeletonCard,
  Toggle,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type CycleLog = {
  id: string;
  date: string;
  is_period_day: boolean;
  flow_level: string | null;
  pain_score: number | null;
  symptoms: string[] | null;
  mood: string | null;
  energy_score: number | null;
  notes: string | null;
  phase?: string;
  cycleDay?: number;
};

type CycleProfile = {
  last_period_start: string | null;
  average_cycle_length: number | null;
  cycle_regular: string | null;
};

type CycleResponse = {
  cycleProfile: CycleProfile | null;
  todayLog: CycleLog | null;
  logs: CycleLog[];
  cycleDay?: number;
  cyclePhase: string;
  cycleConfidence: "low" | "medium" | "high";
  nextPeriodEstimate?: string;
  daysUntilNextPeriod?: number;
};

const phaseDescriptions: Record<string, string> = {
  Menstrual:
    "The uterine lining is shedding and energy may be lower. Gentle movement, steady meals, hydration, and rest may feel more supportive. Some people notice cramps, fatigue, or lower motivation during this phase. Karigai will keep intensity flexible and recovery-friendly.",
  Follicular:
    "Oestrogen typically begins rising after your period. Energy and motivation may improve, and many people feel ready for more structured strength training. This can be a useful window for learning new movements or increasing challenge gradually. Karigai may lean into protein, training consistency, and steady routines.",
  Ovulation:
    "Ovulation is often a higher-energy window for many women. If it feels right, higher-intensity workouts or heavier strength sessions may fit well. Appetite, mood, and confidence can shift in either direction, so your symptom logs still matter. Karigai will keep your plan responsive rather than rigid.",
  Luteal:
    "Progesterone rises in the luteal phase and energy may shift. Cravings, mood changes, bloating, and sleep changes are common for many people. Gentle consistency, protein, fiber, and recovery can be useful anchors. Karigai may reduce intensity if symptoms or energy suggest it.",
  Unknown:
    "Add cycle information to help Karigai estimate your phase. Until then, symptom logs are the most useful signal. You can still track pain, flow, energy, mood, and notes daily. Karigai will avoid over-relying on date prediction without your cycle context.",
};

const symptomOptions = [
  "Cramps",
  "Bloating",
  "Fatigue",
  "Acne",
  "Mood changes",
  "Cravings",
  "Spotting",
  "Headaches",
  "Back pain",
  "Low energy",
  "Nausea",
  "Other",
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchCycle() {
  const response = await fetch("/api/cycle");

  if (!response.ok) {
    throw new Error("Unable to load cycle tracker.");
  }

  return (await response.json()) as CycleResponse;
}

function confidenceTone(confidence: string) {
  if (confidence === "high") {
    return "sage";
  }
  if (confidence === "low") {
    return "blush";
  }
  return "neutral";
}

function CyclePhaseSummaryCard({ data }: { data: CycleResponse }) {
  if (!data.cycleProfile?.last_period_start) {
    return (
      <Card className="min-h-80">
        <EmptyState
          icon={<CalendarDays className="size-8" />}
          title="No cycle data yet"
          body="Add your cycle information to unlock phase estimates and countdowns."
          action={{ label: "Add cycle information →", onClick: () => window.location.assign("/app/setup?section=4") }}
        />
      </Card>
    );
  }

  const cycleLength = data.cycleProfile.average_cycle_length ?? 28;

  return (
    <Card className="min-h-80" padding="lg">
      <Eyebrow>your cycle</Eyebrow>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-ink">{data.cyclePhase}</h2>
          <p className="mt-1 font-mono text-xs text-muted">
            Day {data.cycleDay ?? "—"} of ~{cycleLength}
          </p>
          <p className="mt-2 font-body text-sm text-ink2">
            {data.daysUntilNextPeriod !== undefined ? `~${data.daysUntilNextPeriod} days away` : "Next period unknown"}
          </p>
        </div>
        <Chip tone={confidenceTone(data.cycleConfidence)}>{data.cycleConfidence}</Chip>
      </div>
      <p className="mt-6 font-body text-sm leading-6 text-muted">
        {phaseDescriptions[data.cyclePhase] ?? phaseDescriptions.Unknown}
      </p>
      {data.cycleConfidence === "low" ? (
        <p className="mt-4 rounded-xl bg-shell p-3 font-body text-xs leading-5 text-muted">
          Your cycle predictions have lower confidence because you've flagged irregular periods. Your symptom logs are
          more reliable.
        </p>
      ) : null}
    </Card>
  );
}

function CycleSafetyBanners({ todayLog }: { todayLog: CycleLog | null }) {
  const symptoms = todayLog?.symptoms?.map((symptom) => symptom.toLowerCase()) ?? [];

  return (
    <div className="space-y-3">
      {(todayLog?.pain_score ?? 0) >= 8 ? (
        <SafetyBanner
          tone="alert"
          title="Severe pain noted"
          body="Period pain at this level is worth discussing with a doctor, especially if recurring. Conditions like endometriosis can cause severe pain and respond well to early attention."
        />
      ) : null}
      {todayLog?.flow_level === "heavy" && symptoms.includes("dizziness") ? (
        <SafetyBanner
          tone="alert"
          title="Heavy flow with dizziness"
          body="Heavy bleeding combined with dizziness may need medical attention. Consider speaking with a healthcare professional soon."
        />
      ) : null}
    </div>
  );
}

function TodayLogForm({ todayLog, onSaved }: { todayLog: CycleLog | null; onSaved: () => void }) {
  const [isPeriodDay, setIsPeriodDay] = useState(false);
  const [flowLevel, setFlowLevel] = useState("moderate");
  const [painScore, setPainScore] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState("neutral");
  const [energyScore, setEnergyScore] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsPeriodDay(Boolean(todayLog?.is_period_day));
    setFlowLevel(todayLog?.flow_level ?? "moderate");
    setPainScore(todayLog?.pain_score ?? 0);
    setSymptoms(todayLog?.symptoms ?? []);
    setMood(todayLog?.mood ?? "neutral");
    setEnergyScore(todayLog?.energy_score ?? 5);
    setNotes(todayLog?.notes ?? "");
  }, [todayLog]);

  async function saveLog() {
    setSaving(true);
    await fetch("/api/cycle/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: todayIsoDate(),
        isPeriodDay,
        flowLevel: isPeriodDay ? flowLevel : undefined,
        painScore,
        symptoms,
        mood,
        energyScore,
        notes,
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <Eyebrow>today's log</Eyebrow>
        <h2 className="mt-3 font-display text-3xl text-ink">How is your cycle today?</h2>
      </div>
      <Toggle label="Is today a period day?" checked={isPeriodDay} onChange={setIsPeriodDay} />
      {isPeriodDay ? (
        <Select
          label="Flow level"
          value={flowLevel}
          onChange={(event) => setFlowLevel(event.target.value)}
          options={[
            { value: "light", label: "Light" },
            { value: "moderate", label: "Moderate" },
            { value: "heavy", label: "Heavy" },
          ]}
        />
      ) : null}
      <label className="block">
        <span className="font-body text-xs font-medium text-ink2">Pain score: {painScore}</span>
        <input
          type="range"
          min="0"
          max="10"
          value={painScore}
          onChange={(event) => setPainScore(Number(event.target.value))}
          className="mt-3 w-full accent-clay"
        />
        <span className="mt-1 flex justify-between font-body text-xs text-muted">
          <span>No pain</span>
          <span>Severe</span>
        </span>
      </label>
      <div>
        <p className="mb-3 font-body text-xs font-medium text-ink2">Symptoms</p>
        <div className="flex flex-wrap gap-2">
          {symptomOptions.map((symptom) => {
            const selected = symptoms.includes(symptom);
            return (
              <button
                key={symptom}
                type="button"
                onClick={() =>
                  setSymptoms((current) =>
                    selected ? current.filter((item) => item !== symptom) : [...current, symptom],
                  )
                }
              >
                <Chip tone={selected ? "clay" : "neutral"}>{symptom}</Chip>
              </button>
            );
          })}
        </div>
      </div>
      <Select
        label="Mood"
        value={mood}
        onChange={(event) => setMood(event.target.value)}
        options={[
          { value: "great", label: "Great" },
          { value: "good", label: "Good" },
          { value: "neutral", label: "Neutral" },
          { value: "low", label: "Low" },
          { value: "anxious", label: "Anxious" },
          { value: "irritable", label: "Irritable" },
        ]}
      />
      <label className="block">
        <span className="font-body text-xs font-medium text-ink2">Energy score: {energyScore}</span>
        <input
          type="range"
          min="1"
          max="10"
          value={energyScore}
          onChange={(event) => setEnergyScore(Number(event.target.value))}
          className="mt-3 w-full accent-clay"
        />
      </label>
      <label className="block font-body text-sm text-ink">
        <span className="mb-1.5 block text-xs font-medium text-ink2">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-hairline bg-card px-4 py-3 font-body text-sm outline-none focus:border-clay focus:ring-2 focus:ring-clay/30"
        />
      </label>
      <Button onClick={saveLog} loading={saving}>Save today's log</Button>
    </Card>
  );
}

function CycleHistory({ logs }: { logs: CycleLog[] }) {
  const [selectedLog, setSelectedLog] = useState<CycleLog | null>(null);
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (13 - index));
      const iso = date.toISOString().slice(0, 10);
      return {
        iso,
        day: date.getDate(),
        log: logs.find((item) => item.date === iso) ?? null,
      };
    });
  }, [logs]);

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <Eyebrow>cycle history</Eyebrow>
        <h2 className="mt-3 font-display text-2xl text-ink">Last 14 days</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {days.map((day) => {
          const tone = day.log?.is_period_day
            ? "bg-clay"
            : (day.log?.pain_score ?? 0) >= 5
              ? "bg-alert"
              : day.log?.symptoms?.length
                ? "bg-sage"
                : "bg-shell";
          return (
            <button key={day.iso} type="button" onClick={() => setSelectedLog(day.log)} className="flex min-w-12 flex-col items-center gap-2">
              <span className={cn("size-5 rounded-full border border-hairline", tone)} />
              <span className="font-mono text-[10px] text-muted">{day.day}</span>
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="font-mono text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Phase</th>
              <th className="py-2">Pain</th>
              <th className="py-2">Energy</th>
              <th className="py-2">Key symptoms</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm text-ink2">
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-hairline">
                <td className="py-3">{log.date}</td>
                <td className="py-3">{log.phase ?? "Unknown"}</td>
                <td className="py-3">{log.pain_score ?? "—"}</td>
                <td className="py-3">{log.energy_score ?? "—"}</td>
                <td className="py-3">{log.symptoms?.slice(0, 3).join(", ") || "none"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} title={selectedLog?.date ?? "Cycle log"}>
        {selectedLog ? (
          <div className="space-y-3 font-body text-sm text-ink2">
            <p>Phase: {selectedLog.phase ?? "Unknown"}</p>
            <p>Period day: {selectedLog.is_period_day ? "Yes" : "No"}</p>
            <p>Flow: {selectedLog.flow_level ?? "Not logged"}</p>
            <p>Pain: {selectedLog.pain_score ?? "Not logged"}</p>
            <p>Energy: {selectedLog.energy_score ?? "Not logged"}</p>
            <p>Symptoms: {selectedLog.symptoms?.join(", ") || "none"}</p>
            {selectedLog.notes ? <p>Notes: {selectedLog.notes}</p> : null}
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}

export default function CyclePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cycle"],
    queryFn: fetchCycle,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="cycle"
        title="Cycle Tracker"
        subtitle="Track phases, symptoms, pain, flow, mood, and energy in one place."
      />
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      ) : null}
      {error ? <QueryError error={error} retry={() => void refetch()} /> : null}
      {data ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <CyclePhaseSummaryCard data={data} />
              <CycleSafetyBanners todayLog={data.todayLog} />
            </div>
            <TodayLogForm todayLog={data.todayLog} onSaved={() => void refetch()} />
          </div>
          <CycleHistory logs={data.logs} />
          <p className="font-body text-xs text-muted">
            Setup details live in <Link href="/app/setup?section=4" className="text-clay">cycle setup</Link>.
          </p>
        </>
      ) : null}
    </div>
  );
}
