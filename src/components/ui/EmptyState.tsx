"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  body: string;
  action?: EmptyStateAction;
};

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-muted">{icon}</div>
      <h3 className="mt-4 font-body text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm font-body text-sm text-muted">{body}</p>
      {action ? (
        <Button className="mt-5" variant="accent" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
