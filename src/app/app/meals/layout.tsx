import type { Metadata } from "next";

export const metadata: Metadata = { title: "Meals & Nutrition" };

export default function MealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
