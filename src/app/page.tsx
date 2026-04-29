"use client";

import { AuthModal } from "@/components/features/auth/AuthModal";
import { Button, Card, Chip, Eyebrow, KarigaiLogo, SafetyBanner } from "@/components/ui";
import { useAuthModalStore } from "@/store/auth-modal.store";

const factorCards = [
  {
    title: "Cycle & hormones",
    chips: ["Menstrual", "Follicular", "Ovulation", "Luteal"],
  },
  {
    title: "Health context",
    chips: ["PCOS", "Thyroid", "Prediabetes", "Iron deficiency"],
  },
  {
    title: "Diet & nutrition",
    chips: ["Vegetarian", "Vegan", "Kosher", "Halal", "Jain"],
  },
  {
    title: "Fasting",
    chips: ["12:12", "14:10", "16:8", "No fasting"],
  },
  {
    title: "Fitness",
    chips: ["Gym", "Swimming", "Home workouts", "Walking"],
  },
  {
    title: "Goals",
    chips: ["Lose weight", "Build strength", "Improve energy"],
  },
];

const steps = [
  {
    title: "Tell us your context",
    body: "Share your cycle, health context, diet, movement preferences, and goals.",
  },
  {
    title: "Get your personalised plan",
    body: "Karigai adapts daily guidance around what may support your body today.",
  },
  {
    title: "Track and refine",
    body: "Check in over time so your plan can become more attuned to your patterns.",
  },
];

export default function Home() {
  const openModal = useAuthModalStore((state) => state.openModal);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="flex min-h-screen flex-col items-center justify-center border-b border-hairline px-6 text-center">
        <KarigaiLogo size={61} mark={false} />
        <p className="mt-7 font-body text-xl text-ink2">Wellness intelligence for women.</p>
        <p className="mt-4 max-w-xl font-body text-sm leading-6 text-muted">
          Fitness, nutrition, cycle tracking, and daily guidance that adapts to your cycle,
          conditions, diet, and goals.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="accent" size="lg" onClick={() => openModal("signup")}>
            Get started <span aria-hidden="true">→</span>
          </Button>
          <Button variant="ghost" size="lg" onClick={() => openModal("login")}>
            Sign in
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <Eyebrow>what karigai considers</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-ink">
          Built around how your body actually works.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {factorCards.map((factor) => (
            <Card key={factor.title} className="min-h-36">
              <h3 className="font-body text-sm font-semibold text-ink">{factor.title}</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {factor.chips.map((chip) => (
                  <Chip key={chip} tone="clay">
                    {chip}
                  </Chip>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Eyebrow>how it works</Eyebrow>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-clay">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-body text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 font-body text-sm leading-6 text-muted">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <SafetyBanner
          tone="info"
          title="Wellness guidance, not medical advice"
          body="Karigai is a wellness platform. We personalise your plan using self-reported context. We do not diagnose or treat medical conditions. Always consult a healthcare professional for medical advice."
        />
      </section>

      <section className="border-t border-hairline px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
          <p className="font-display text-3xl text-ink">Start for free — no credit card needed.</p>
          <Button variant="accent" size="lg" onClick={() => openModal("signup")}>
            Get started
          </Button>
        </div>
      </section>

      <AuthModal />
    </main>
  );
}
