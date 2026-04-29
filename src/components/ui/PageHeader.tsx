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
    <header className="flex items-start justify-between gap-6">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl font-body text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
