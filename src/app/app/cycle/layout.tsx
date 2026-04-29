import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cycle Tracker" };

export default function CycleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
