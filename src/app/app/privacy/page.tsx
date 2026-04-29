"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Modal, PageHeader, SafetyBanner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/store/toast.store";

type ConfirmAction = "clear_logs" | "delete_account" | null;

export default function PrivacyPage() {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busy, setBusy] = useState(false);

  async function exportData() {
    const response = await fetch("/api/export");
    if (!response.ok) {
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "karigai-data-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function runPrivacyAction() {
    if (!confirmAction) {
      return;
    }

    setBusy(true);
    const response = await fetch("/api/privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: confirmAction }),
    });
    setBusy(false);

    if (!response.ok) {
      useToastStore.getState().addToast("Something went wrong. Try again.", "error");
      return;
    }

    if (confirmAction === "delete_account") {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } else {
      useToastStore.getState().addToast("Logs cleared ✓", "success");
      setConfirmAction(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="data" title="Privacy & data" subtitle="Control what Karigai stores and how your context is used." />

      <Card>
        <h2 className="font-display text-2xl text-ink">What we store</h2>
        <p className="mt-3 font-body text-sm leading-6 text-muted">
          Karigai stores your profile, health context, cycle information, meal logs, hydration logs, workout logs, and chat messages so your plan can stay personalised.
        </p>
      </Card>

      <Card>
        <h2 className="font-display text-2xl text-ink">How AI uses your data</h2>
        <p className="mt-3 font-body text-sm leading-6 text-muted">
          Your data is sent to the Anthropic API to generate personalised suggestions. Anthropic's privacy policy applies. You can disable AI suggestions below.
        </p>
        <Button className="mt-5" variant="ghost" disabled>
          Disable AI suggestions
        </Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Your data controls</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => void exportData()}>Export my data as JSON</Button>
          <Button variant="ghost" onClick={() => setConfirmAction("clear_logs")}>Clear all logs</Button>
          <Button variant="danger" onClick={() => setConfirmAction("delete_account")}>Delete my account</Button>
        </div>
      </Card>

      <SafetyBanner
        tone="info"
        title="Karigai is not a medical product"
        body="All wellness guidance is personalised based on self-reported information. Karigai does not diagnose, treat, or replace professional medical advice."
      />

      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === "delete_account" ? "Delete account data?" : "Clear all logs?"}
      >
        <p className="font-body text-sm leading-6 text-muted">
          {confirmAction === "delete_account"
            ? "This deletes your Karigai data and signs you out. Your Supabase auth user may still need to be removed from the Supabase dashboard."
            : "This deletes meal, water, cycle, workout, and chat logs. Your onboarding and profile remain."}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button variant={confirmAction === "delete_account" ? "danger" : "primary"} loading={busy} onClick={() => void runPrivacyAction()}>
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
