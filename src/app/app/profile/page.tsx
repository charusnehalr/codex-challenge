"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BasicProfileForm } from "@/components/features/setup/BasicProfileForm";
import { BodyMetricsForm } from "@/components/features/setup/BodyMetricsForm";
import { CycleInfoForm } from "@/components/features/setup/CycleInfoForm";
import { DietPreferenceForm } from "@/components/features/setup/DietPreferenceForm";
import { FastingPreferenceForm } from "@/components/features/setup/FastingPreferenceForm";
import { FitnessPreferenceForm } from "@/components/features/setup/FitnessPreferenceForm";
import { GoalsForm } from "@/components/features/setup/GoalsForm";
import { HealthContextForm } from "@/components/features/setup/HealthContextForm";
import type { SetupSectionKey } from "@/components/features/setup/setup-shared";
import { Button, Card, Eyebrow, PageHeader, SkeletonCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function EditSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-card border border-hairline bg-card p-5">
      <summary className="cursor-pointer font-body text-sm font-semibold text-ink">{title}</summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);
  const onSaved = (_section: SetupSectionKey, _setupProgress: number, _data: Record<string, unknown>) => undefined;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "Not available");
      setLoading(false);
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="account" title="Profile" subtitle="Edit the context Karigai uses to personalise your plan." />

      {loading ? <SkeletonCard /> : null}

      {!loading ? (
        <>
          <Card className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <Eyebrow>account</Eyebrow>
              <p className="mt-2 font-body text-sm text-ink2">{email}</p>
              <p className="mt-1 font-body text-xs text-muted">Change password is not included in this MVP.</p>
            </div>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </Card>

          <div className="space-y-4">
            <EditSection title="Basic profile"><BasicProfileForm sectionIndex={1} onSaved={onSaved} /></EditSection>
            <EditSection title="Body metrics"><BodyMetricsForm sectionIndex={2} onSaved={onSaved} /></EditSection>
            <EditSection title="Health context"><HealthContextForm sectionIndex={3} onSaved={onSaved} /></EditSection>
            <EditSection title="Cycle information"><CycleInfoForm sectionIndex={4} onSaved={onSaved} /></EditSection>
            <EditSection title="Diet preferences"><DietPreferenceForm sectionIndex={5} onSaved={onSaved} /></EditSection>
            <EditSection title="Fasting preferences"><FastingPreferenceForm sectionIndex={6} onSaved={onSaved} /></EditSection>
            <EditSection title="Fitness preferences"><FitnessPreferenceForm sectionIndex={7} onSaved={onSaved} /></EditSection>
            <EditSection title="Goals"><GoalsForm sectionIndex={8} onSaved={onSaved} /></EditSection>
          </div>
        </>
      ) : null}
    </div>
  );
}
