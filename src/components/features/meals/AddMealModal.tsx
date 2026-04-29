"use client";

import { useEffect, useState } from "react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { useToastStore } from "@/store/toast.store";

export type MealDraft = {
  mealType: string;
  mealName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  notes?: string;
};

type AddMealModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  draft?: MealDraft | null;
};

const emptyDraft: MealDraft = {
  mealType: "breakfast",
  mealName: "",
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  notes: "",
};

export function AddMealModal({ open, onClose, onSaved, draft }: AddMealModalProps) {
  const [form, setForm] = useState<MealDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(draft ?? emptyDraft);
      setError(null);
    }
  }, [draft, open]);

  function update<K extends keyof MealDraft>(key: K, value: MealDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!form.mealName.trim()) {
      setError("Meal name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    const response = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to log meal.");
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }

    useToastStore.getState().addToast("Meal logged ✓", "success");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add meal" width="lg">
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Meal type"
          value={form.mealType}
          onChange={(event) => update("mealType", event.target.value)}
          options={[
            { value: "breakfast", label: "Breakfast" },
            { value: "snack", label: "Snack" },
            { value: "lunch", label: "Lunch" },
            { value: "dinner", label: "Dinner" },
          ]}
        />
        <Input label="Meal name" value={form.mealName} onChange={(event) => update("mealName", event.target.value)} />
        <Input label="Calories" type="number" min={0} value={form.calories} onChange={(event) => update("calories", Number(event.target.value))} />
        <Input label="Protein (g)" type="number" min={0} value={form.proteinG} onChange={(event) => update("proteinG", Number(event.target.value))} />
        <Input label="Carbs (g)" type="number" min={0} value={form.carbsG} onChange={(event) => update("carbsG", Number(event.target.value))} />
        <Input label="Fat (g)" type="number" min={0} value={form.fatG} onChange={(event) => update("fatG", Number(event.target.value))} />
        <Input label="Fiber (g)" type="number" min={0} value={form.fiberG} onChange={(event) => update("fiberG", Number(event.target.value))} />
        <Input label="Notes" value={form.notes ?? ""} onChange={(event) => update("notes", event.target.value)} />
      </div>
      {error ? <p className="mt-4 font-body text-xs text-alert">{error}</p> : null}
      <Button className="mt-5 w-full" onClick={save} loading={saving}>
        Log meal
      </Button>
    </Modal>
  );
}
