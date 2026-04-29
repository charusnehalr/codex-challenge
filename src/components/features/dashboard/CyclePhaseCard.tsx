import Link from "next/link";
import { CalendarHeart } from "lucide-react";
import { Card, Chip, Eyebrow } from "@/components/ui";

const descriptions: Record<string, string> = {
  menstrual: "Rest and gentle movement. Energy may be lower.",
  follicular: "Rising energy. Good phase for strength training.",
  ovulatory: "Peak energy phase for many women.",
  luteal: "Energy may shift. Cravings and mood changes are common.",
};

function confidenceTone(confidence?: string) {
  if (confidence === "high") {
    return "sage";
  }

  if (confidence === "low") {
    return "alert";
  }

  return "neutral";
}

export function CyclePhaseCard({ phase, confidence }: { phase?: string; confidence?: string }) {
  if (!phase) {
    return (
      <Card className="flex min-h-48 flex-col items-center justify-center text-center">
        <CalendarHeart className="size-7 text-muted" aria-hidden="true" />
        <h3 className="mt-4 font-body text-sm font-semibold text-ink">No cycle data yet</h3>
        <p className="mt-1 font-body text-sm text-muted">Add cycle info to unlock phase-aware guidance.</p>
        <Link href="/app/setup?section=4" className="mt-4 font-body text-sm text-clay">
          Add cycle info →
        </Link>
      </Card>
    );
  }

  const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1);

  return (
    <Card className="min-h-48">
      <Eyebrow>cycle phase</Eyebrow>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl text-ink">{phaseName}</p>
          <p className="mt-1 font-mono text-xs text-muted">Day estimated</p>
        </div>
        <Chip tone={confidenceTone(confidence)}>{confidence ?? "unknown"}</Chip>
      </div>
      <p className="mt-5 font-body text-sm leading-6 text-muted">{descriptions[phase] ?? descriptions.luteal}</p>
    </Card>
  );
}
