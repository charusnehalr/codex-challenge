export function formatHealthLabel(raw: string): string {
  const map: Record<string, string> = {
    non_vegetarian: "Non-vegetarian",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    pescatarian: "Pescatarian",
    eggetarian: "Eggetarian",
    lose_weight: "Lose weight",
    maintain_weight: "Maintain weight",
    maintain: "Maintain weight",
    gain_muscle: "Build muscle",
    toning: "Tone body",
    improve_energy: "Improve energy",
    improve_stamina: "Improve stamina",
    improve_cycle_awareness: "Improve cycle awareness",
    improve_nutrition: "Improve nutrition",
    irregular_periods: "Irregular periods",
    iron_deficiency: "Iron deficiency",
    has_pcos: "PCOS",
    has_pcod: "PCOD",
    has_thyroid_condition: "Thyroid condition",
    menstrual: "Menstrual",
    follicular: "Follicular",
    ovulation: "Ovulation",
    ovulatory: "Ovulation",
    luteal: "Luteal",
    none: "",
  };

  return map[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
