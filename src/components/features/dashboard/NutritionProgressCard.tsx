import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { Card, Eyebrow, ProgressRing } from "@/components/ui";

export function NutritionProgressCard({
  calories,
  calorieTarget,
  protein,
  proteinTarget,
}: {
  calories: number;
  calorieTarget?: number;
  protein: number;
  proteinTarget?: number;
}) {
  const carbs = Math.round(Math.max(0, calories - protein * 4) / 4);
  const carbTarget = 220;

  return (
    <Card className="min-h-56">
      <Eyebrow>nutrition today</Eyebrow>
      {calories === 0 ? (
        <div className="mt-5 flex flex-col items-center text-center">
          <UtensilsCrossed className="size-7 text-muted" />
          <p className="mt-3 font-body text-sm font-semibold text-ink">No meals logged</p>
          <Link href="/app/meals" className="mt-2 font-body text-sm text-clay">
            Log your first meal →
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <ProgressRing value={calories / (calorieTarget ?? 1)} label="cal" />
            <p className="mt-2 font-mono text-xs text-muted">{calories}/{calorieTarget}</p>
          </div>
          <div>
            <ProgressRing value={protein / (proteinTarget ?? 1)} color="#7A8B6F" label="pro" />
            <p className="mt-2 font-mono text-xs text-muted">{protein}/{proteinTarget}g</p>
          </div>
          <div>
            <ProgressRing value={carbs / carbTarget} color="#6B8AA8" label="carb" />
            <p className="mt-2 font-mono text-xs text-muted">{carbs}/{carbTarget}g</p>
          </div>
        </div>
      )}
    </Card>
  );
}
