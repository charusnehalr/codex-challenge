import Link from "next/link";
import { Card, Eyebrow } from "@/components/ui";

export function AIInsightCard({ insight }: { insight: string }) {
  return (
    <Card className="border-l-[3px] border-l-clay">
      <Eyebrow>today's insight</Eyebrow>
      <p className="mt-4 font-body text-sm leading-relaxed text-ink2">{insight}</p>
      <Link href="/app/chat" className="mt-5 block font-body text-sm text-clay">
        Ask the assistant →
      </Link>
    </Card>
  );
}
