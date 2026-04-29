"use client";

import { useState } from "react";
import { Button, Card, Chip } from "@/components/ui";
import { cn } from "@/lib/utils";

const symptoms = ["Fatigue", "Cramps", "Bloating", "Headache", "Cravings", "Good energy", "Low mood", "Nausea"];

export function EnergyCheckInCard({ onSaved }: { onSaved: () => void }) {
  const [energy, setEnergy] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!energy) {
      return;
    }

    setSaving(true);
    await fetch("/api/cycle/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ energy_score: energy, symptoms: selectedSymptoms }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="font-display text-2xl text-ink">How are you feeling today?</h2>
          <p className="mt-1 font-body text-sm text-muted">Log energy and symptoms so Karigai can refine today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setEnergy(value)}
              className={cn(
                "grid size-8 place-items-center rounded-full border font-mono text-xs transition",
                energy === value ? "border-clay bg-clay text-cream" : "border-hairline bg-card text-muted hover:bg-shell",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {symptoms.map((symptom) => {
          const selected = selectedSymptoms.includes(symptom);

          return (
            <button
              key={symptom}
              type="button"
              onClick={() =>
                setSelectedSymptoms((current) =>
                  selected ? current.filter((item) => item !== symptom) : [...current, symptom],
                )
              }
            >
              <Chip tone={selected ? "clay" : "neutral"}>{symptom}</Chip>
            </button>
          );
        })}
      </div>
      <Button size="sm" onClick={save} loading={saving}>Save check-in</Button>
    </Card>
  );
}
