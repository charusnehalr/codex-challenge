<div align="center">

# Karigai

### Condition-Aware Wellness Intelligence for Women

**Health apps were built for the average person. There is no average woman.**

[Live Demo](#) · [Book a Demo](#) · [Report Bug](https://github.com/charusnehalr/karigai/issues)

</div>

---

## The Problem

Women's health is not a niche. It's half the planet.

Yet every mainstream fitness app treats a 28-year-old woman with PCOS and iron deficiency the same as a 28-year-old man training for a marathon. The result? Advice that doesn't just fail — it actively harms.

- A woman with an eating disorder history is recommended a 500-calorie deficit.
- A pregnant woman is served an intermittent fasting plan.
- A woman on her period at a pain score of 9 is told to hit the gym.

**Generic wellness is not wellness. It's noise.**

Women navigate a fundamentally different biological landscape: hormonal cycles that shift metabolism week to week, conditions like PCOS affecting 1 in 10, thyroid disorders disproportionately skewing female, and nutritional deficiencies (iron, B12, Vitamin D) that cascade silently through energy, mood, and fitness performance.

No existing app connects all of this. They silo your period tracker from your nutrition app from your workout planner — and none of them know you have PCOS.

---

## What Karigai Does

Karigai is a **condition-aware wellness intelligence platform** that understands who you are before it tells you what to do.

It connects your menstrual cycle, health conditions, nutritional needs, fitness capacity, and personal goals into a single living context — and uses AI to generate guidance that is actually safe and relevant for *you*.

> Not "women in general." You.

---

## How It's Different

| Generic Wellness App | Karigai |
|---|---|
| Same plan for everyone | Personalized to your conditions, cycle phase, and energy level |
| Nutrition targets based on gender/age | Targets adjusted for PCOS, thyroid, pregnancy, deficiencies |
| Workout plans ignore your cycle | Workout intensity adapts to where you are in your cycle |
| No safety guardrails | Hard safety banners for pain ≥8, bleeding + dizziness, fasting + pregnancy |
| AI gives supplement dosages | AI never diagnoses, prescribes, or doses — ever |
| Siloed trackers | One unified context: cycle + food + movement + mood + health |

---

## Core Features

### Cycle Intelligence
Real-time cycle phase estimation — Menstrual, Follicular, Ovulation, Luteal, Late Luteal — with confidence scoring. Your workout suggestions, energy benchmarks, and hydration targets shift with your phase.

### Condition-Aware Personalization
18 health conditions mapped into a rules engine that silently shapes every recommendation. PCOS? Protein targets go up and refined carb guidance changes. Eating disorder history? Deficit-based framing is disabled entirely. Pregnancy? Fasting is off the table — with a visible safety banner.

### AI Meal Suggestions (Claude Sonnet)
Powered by Anthropic's Claude, meal suggestions are built from your full context: diet type, restrictions (gluten-free, halal, jain, nut-free and more), health conditions, remaining daily macros, and your active fasting window. The AI doesn't just suggest food — it explains *why* this meal works for you today.

### AI Workout Generation
Groq-powered workout plans generated from your fitness level, available equipment, cycle phase, and today's energy score. Every workout includes warm-up, cooldown, exercise progressions, and injury-aware modifications.

### AI Wellness Chat
A context-aware wellness chatbot that knows your profile before you type a word. Ask about energy crashes, cycle symptoms, what to eat before a workout — and get responses grounded in your actual health data. Safety triggers route high-risk messages (severe pain, mental health, medication) to appropriate guidance.

### Health Analytics Engine
BMI, WHR, BRI, BMR, TDEE — calculated from your actual measurements. Calorie, protein, and water targets derived from your specific conditions and goals. A dashboard that shows you the *why* behind every number.

---

## Safety First, Always

Karigai operates with a non-negotiable safety layer:

- **Hard banners** surface immediately for: pain ≥ 8/10, heavy bleeding + dizziness, eating disorder history + any fasting plan, pregnancy + fasting
- **AI never diagnoses**, prescribes, or gives supplement dosages
- **All wellness language** uses "may", "might", "based on what you've shared"
- **Setup is always skippable** — the dashboard never blocks a user who isn't ready to share

---

## The AI Architecture

```
User Context (profile + conditions + cycle + diet + fitness + goals)
         │
         ▼
  Prompt Engine (ai-prompt-engine.ts)
    ├── buildChatSystemPrompt()         ← Full context injected per message
    ├── buildMealSuggestionPrompt()     ← Macros + restrictions + fasting window
    └── buildWorkoutGenerationPrompt() ← Phase + energy + equipment
         │
         ├── Anthropic Claude Sonnet → Meal Suggestions
         └── Groq Llama 70B          → Chat + Workout Generation
                                        (rules-based fallback for both)

Safety Layer (safety-rules.ts)
    ├── runPersonalizationRules()  → 18 boolean flags shaping all AI output
    └── getSafetyBanners()         → Hard warnings that override AI output
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS with custom design tokens |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI — Meals | Anthropic Claude Sonnet |
| AI — Chat & Workouts | Groq (Llama 3.3 70B) |
| State | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animation | Framer Motion |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Anthropic API key
- Groq API key

### Installation

```bash
git clone https://github.com/charusnehalr/karigai.git
cd karigai
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Open your Supabase project → SQL Editor
2. Paste and run `supabase/fix_missing_tables.sql`
3. All tables, RLS policies, and schema cache will be initialized

### Run

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run type-check # TypeScript check
npm test           # Run unit tests
```

Open [http://localhost:3000](http://localhost:3000).

---

## The Onboarding Philosophy

Karigai's 8-step setup is not a form. It's the intake that makes everything downstream smarter:

1. **Basic Profile** — Age, height, weight, country
2. **Body Metrics** — Waist, hip, body fat for clinical-grade WHR and BRI
3. **Health Context** — 16 conditions including PCOS, diabetes, thyroid, deficiencies, eating disorder history, pregnancy
4. **Cycle Info** — Last period, average length, regularity — the foundation of phase-aware recommendations
5. **Diet Preferences** — Type + 8 restriction flags (halal, jain, gluten-free, dairy-free and more)
6. **Fasting Preferences** — Safely captures intent and screens for contraindications
7. **Fitness Preferences** — Level, available equipment, days per week
8. **Goals** — Weight loss, maintenance, strength, energy, cycle awareness

Every step is independently saveable. None are required to use the app. **We earn trust; we don't demand it.**

---

## The Market

- 1 in 10 women globally has PCOS — over 190 million people
- Thyroid disorders are 5–8× more common in women than men
- Iron deficiency anaemia affects ~30% of women of reproductive age
- The global women's health app market is projected to exceed $3.5B by 2030
- 72% of women report that existing health apps don't account for hormonal changes

The gap between what women need and what currently exists is not a feature gap. It's a category gap. Karigai builds the category.

---

## Roadmap

- [ ] Wearable integration (Apple Health, Fitbit, Garmin)
- [ ] Lab results import (connect bloodwork to deficiency tracking)
- [ ] Cycle-synced meal plans (week-by-week phase nutrition)
- [ ] Community support groups (condition-specific)
- [ ] Practitioner dashboard (share context with your doctor or dietitian)
- [ ] Multilingual support (Hindi, Tamil, Spanish — starting with South Asia)
- [ ] Mobile app (React Native)

---

## Contributing

Karigai is early. If you're a developer, designer, clinician, or a woman who has been failed by generic health advice — we want to hear from you.

Open an issue. Start a discussion. Build something that matters.

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built for the women who were told their labs are "normal" when nothing felt normal.**

*Karigai — your body is not average, your wellness intelligence shouldn't be either.*

</div>
