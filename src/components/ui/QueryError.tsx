"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function safeMessage(error: unknown) {
  if (error instanceof Error && error.message && !error.stack?.includes(error.message)) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message.split("\n")[0] ?? "Please try again.";
  }

  return "Please try again.";
}

export function QueryError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center text-center">
      <AlertTriangle className="size-8 text-alert" />
      <h2 className="mt-4 font-display text-3xl text-ink">Something went wrong</h2>
      <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">{safeMessage(error)}</p>
      <Button className="mt-5" variant="ghost" onClick={retry}>
        Retry
      </Button>
    </Card>
  );
}
