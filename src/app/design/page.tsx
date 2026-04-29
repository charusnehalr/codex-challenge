"use client";

import { useState } from "react";
import { CalendarHeart, Leaf, MessageCircle, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  Eyebrow,
  Input,
  KarigaiLogo,
  Modal,
  PageHeader,
  ProgressRing,
  SafetyBanner,
  Select,
  Skeleton,
  SkeletonCard,
  StatDisplay,
  Toggle,
} from "@/components/ui";

const swatches = [
  { name: "cream", className: "bg-cream" },
  { name: "paper", className: "bg-paper" },
  { name: "card", className: "bg-card" },
  { name: "shell", className: "bg-shell" },
  { name: "bone", className: "bg-bone" },
  { name: "hairline", className: "bg-hairline" },
  { name: "ink", className: "bg-ink" },
  { name: "ink2", className: "bg-ink2" },
  { name: "muted", className: "bg-muted" },
  { name: "clay", className: "bg-clay" },
  { name: "claySoft", className: "bg-claySoft" },
  { name: "sage", className: "bg-sage" },
  { name: "sageSoft", className: "bg-sageSoft" },
  { name: "blush", className: "bg-blush" },
  { name: "amber", className: "bg-amber" },
  { name: "alert", className: "bg-alert" },
];

const buttonVariants = ["primary", "accent", "ghost", "danger"] as const;
const buttonSizes = ["sm", "md", "lg"] as const;
const chipTones = ["neutral", "sage", "clay", "blush", "bone", "alert", "ink"] as const;
const badgeVariants = ["default", "success", "warning", "error"] as const;

function Section({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-4">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </section>
  );
}

export default function DesignPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleChecked, setToggleChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <main className="min-h-screen bg-paper px-10 py-8 text-ink">
      <div className="mx-auto max-w-6xl space-y-12">
        <PageHeader
          eyebrow="Design system"
          title="Karigai primitives"
          subtitle="A compact preview of the reusable UI foundation."
          action={<KarigaiLogo tagline />}
        />

        <Section title="Typography">
          <Card className="grid gap-4 md:grid-cols-3">
            <div>
              <Eyebrow>Display</Eyebrow>
              <p className="mt-2 font-display text-4xl italic text-ink">karigai</p>
            </div>
            <div>
              <Eyebrow>Body</Eyebrow>
              <p className="mt-2 font-body text-sm text-ink2">
                Based on what you have shared, your plan may adjust gently.
              </p>
            </div>
            <div>
              <Eyebrow>Mono</Eyebrow>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
                cycle aware
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Colours">
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {swatches.map((swatch) => (
              <div key={swatch.name} className="space-y-2">
                <div className={`h-14 rounded-xl border border-hairline ${swatch.className}`} />
                <p className="font-mono text-[10px] text-muted">{swatch.name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buttons">
          <Card className="space-y-4">
            {buttonVariants.map((variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-3">
                {buttonSizes.map((size) => (
                  <Button key={`${variant}-${size}`} variant={variant} size={size}>
                    {variant}
                  </Button>
                ))}
                <Button variant={variant} loading>
                  Loading
                </Button>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Cards">
          <div className="grid gap-4 md:grid-cols-3">
            <Card padding="sm">Small padding card</Card>
            <Card padding="md">Medium padding card</Card>
            <Card padding="lg" dark>
              Dark surface card
            </Card>
          </div>
        </Section>

        <Section title="Chips">
          <Card className="flex flex-wrap gap-2">
            {chipTones.map((tone) => (
              <Chip key={tone} tone={tone}>
                {tone}
              </Chip>
            ))}
          </Card>
        </Section>

        <Section title="ProgressRings">
          <Card className="flex flex-wrap items-center gap-8">
            <ProgressRing value={0.28} label="28" sublabel="sync" />
            <ProgressRing value={0.64} size={72} stroke={6} label="64" sublabel="water" />
            <ProgressRing value={0.9} size={88} stroke={7} label="90" sublabel="ready" />
          </Card>
        </Section>

        <Section title="SafetyBanners">
          <div className="grid gap-3 md:grid-cols-3">
            <SafetyBanner tone="info" title="Gentle note" body="This may be worth tracking today." />
            <SafetyBanner tone="warn" title="Check in" body="This pattern might need extra care." />
            <SafetyBanner tone="alert" title="Safety first" body="Severe symptoms may need timely support." />
          </div>
        </Section>

        <Section title="Inputs">
          <Card className="grid gap-4 md:grid-cols-3">
            <Input label="Name" placeholder="Your name" hint="Shown in your profile." />
            <Input label="Pain level" placeholder="0-10" error="Use a number from 0 to 10." />
            <Select
              label="Cycle phase"
              options={[
                { value: "unknown", label: "Unknown" },
                { value: "menstrual", label: "Menstrual" },
                { value: "follicular", label: "Follicular" },
              ]}
            />
            <Toggle label="Cycle-aware plans" checked={toggleChecked} onChange={setToggleChecked} />
            <Checkbox
              label="Include recovery prompts"
              checked={checkboxChecked}
              onChange={setCheckboxChecked}
              tone="clay"
            />
          </Card>
        </Section>

        <Section title="Modals">
          <Card className="flex items-center justify-between gap-4">
            <p className="font-body text-sm text-muted">Open the animated dialog and tab through it.</p>
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
          </Card>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Evening check-in">
            <div className="space-y-4">
              <p className="font-body text-sm text-muted">
                Based on what you have shared, a lighter evening routine may support recovery.
              </p>
              <Button onClick={() => setModalOpen(false)}>Done</Button>
            </div>
          </Modal>
        </Section>

        <Section title="Skeleton">
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <Card className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
            </Card>
          </div>
        </Section>

        <Section title="More primitives">
          <Card className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              {badgeVariants.map((variant) => (
                <Badge key={variant} variant={variant}>
                  {variant}
                </Badge>
              ))}
            </div>
            <StatDisplay value="7.5" unit="hrs" label="Sleep" sub="last night" />
            <EmptyState
              icon={<CalendarHeart className="size-8" />}
              title="No logs yet"
              body="Your next check-in will appear here."
              action={{ label: "Add log", onClick: () => setModalOpen(true) }}
            />
            <div className="flex items-center gap-4">
              <Leaf className="size-5 text-sage" />
              <Sparkles className="size-5 text-clay" />
              <MessageCircle className="size-5 text-muted" />
            </div>
          </Card>
        </Section>
      </div>
    </main>
  );
}
