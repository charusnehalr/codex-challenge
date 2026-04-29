import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({ title, subtitle, action, eyebrow }: PageHeaderProps) {
  return (
    <header className="flex flex-col items-start justify-between gap-5 md:flex-row md:gap-6">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-2xl font-body text-base leading-relaxed text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
