<div align="center">

<img src="https://img.shields.io/badge/Built%20for-Women%27s%20Health-E8B4A8?style=for-the-badge&logoColor=white" />
<img src="https://img.shields.io/badge/Powered%20by-LLM%20API-C99356?style=for-the-badge&logoColor=white" />
<img src="https://img.shields.io/badge/Next.js-14-1F1B16?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Deployed%20on-Vercel-7A8B6F?style=for-the-badge&logo=vercel&logoColor=white" />

<br /><br />

# 🌸 Karigai

### *Condition-Aware Wellness Intelligence for Women*

> **Health apps were built for the average person.**
> **There is no average woman.**

<br />

[✨ Live Demo](#) &nbsp;·&nbsp; [📅 Book a Demo](#) &nbsp;·&nbsp; [🐛 Report Bug](https://github.com/charusnehalr/karigai/issues)

</div>

<br />

---

## 🔴 The Problem

Women's health is not a niche. It's **half the planet.**

Yet every mainstream fitness app treats a 28-year-old woman with PCOS and iron deficiency the same as a 28-year-old man training for a marathon. The result? Advice that doesn't just fail-it **actively harms.**

> 🚫 A woman with an eating disorder history gets recommended a 500-calorie deficit.
>
> 🚫 A pregnant woman is served an intermittent fasting plan.
>
> 🚫 A woman on her period at a pain score of 9 is told to hit the gym.

**Generic wellness is not wellness. It's noise.**

Women navigate a fundamentally different biological landscape-hormonal cycles that shift metabolism week to week, conditions like PCOS affecting 1 in 10, thyroid disorders 5–8× more common in women, and silent nutritional deficiencies that cascade through energy, mood, and performance.

No existing app connects all of this. They silo your period tracker from your nutrition app from your workout planner-**and none of them know you have PCOS.**

<br />

---

## 💡 What Karigai Does

Karigai is a **condition-aware wellness intelligence platform** that understands who you are *before* it tells you what to do.

It weaves together your menstrual cycle, health conditions, nutritional needs, fitness capacity, and personal goals into a single living context-then uses AI to generate guidance that is genuinely safe and relevant for *you.*

<div align="center">

> 💬 *Not "women in general." **You.***

</div>

<br />

---

## ⚡ How It's Different

| 😐 Generic Wellness App | 🌸 Karigai |
|---|---|
| Same plan for everyone | Personalized to your conditions, cycle phase, and energy level |
| Nutrition targets based on gender/age | Targets adjusted for PCOS, thyroid, pregnancy, deficiencies |
| Workout plans ignore your cycle | Workout intensity adapts to where you are in your cycle |
| No safety guardrails | Hard safety banners for pain ≥8, bleeding + dizziness, fasting + pregnancy |
| AI gives supplement dosages | AI never diagnoses, prescribes, or doses-ever |
| Siloed trackers | One unified context: cycle + food + movement + mood + health |

<br />

---

## 🌿 Core Features

### 🔴 Cycle Intelligence
Real-time cycle phase estimation-**Menstrual → Follicular → Ovulation → Luteal → Late Luteal**-with confidence scoring. Your workout suggestions, energy benchmarks, and hydration targets shift with your phase.

### 🟠 Condition-Aware Personalization
18 health conditions mapped into a rules engine that silently shapes every recommendation.
- **PCOS?** Protein targets go up, refined carb guidance changes.
- **Eating disorder history?** Deficit-based framing is disabled entirely.
- **Pregnancy?** Fasting is off the table-with a visible safety banner.

### 🟡 AI Meal Suggestions *(LLM API)*
Powered by an **LLM API**, meal suggestions are built from your full context: diet type, restrictions (gluten-free, halal, jain, nut-free and more), health conditions, remaining daily macros, and your active fasting window. The AI doesn't just suggest food-it explains *why* this meal works for you today.

### 🟢 AI Workout Generation
**LLM-powered** workout plans generated from your fitness level, available equipment, cycle phase, and today's energy score. Every workout includes warm-up, cooldown, exercise progressions, and injury-aware modifications.

### 🔵 AI Wellness Chat
A context-aware wellness chatbot that knows your profile before you type a word. Ask about energy crashes, cycle symptoms, what to eat before a workout-and get responses grounded in your actual health data. Safety triggers route high-risk messages to appropriate guidance.

### 🟣 Health Analytics Engine
**BMI, WHR, BRI, BMR, TDEE**-calculated from your actual measurements. Calorie, protein, and water targets derived from your specific conditions and goals. A dashboard that shows you the *why* behind every number.

<br />

---

## 🛡️ Safety First-Always

Karigai operates with a **non-negotiable safety layer** baked into every AI response:

- 🚨 **Hard banners** surface immediately for: pain ≥ 8/10 · heavy bleeding + dizziness · eating disorder history + fasting · pregnancy + fasting
- 🩺 **AI never diagnoses**, prescribes, or gives supplement dosages
- 💬 **All wellness language** uses *"may"*, *"might"*, *"based on what you've shared"*
- 🔓 **Setup is always skippable**-the dashboard never blocks a user who isn't ready to share

<br />

---

## 🤖 The AI Architecture

```
User Context  (profile + conditions + cycle + diet + fitness + goals)
         │
         ▼
  ┌─────────────────────────────────────────────────┐
  │           Prompt Engine                         │
  │  ├── buildChatSystemPrompt()                    │  ← Full context per message
  │  ├── buildMealSuggestionPrompt()                │  ← Macros + restrictions + fasting
  │  └── buildWorkoutGenerationPrompt()             │  ← Phase + energy + equipment
  └─────────────────────────────────────────────────┘
         │
         ├── 🟠 LLM API (primary)   →  Meal Suggestions
         └── 🟢 LLM API (secondary) →  Chat + Workout Generation
                                        (rules-based fallback for both)

  ┌─────────────────────────────────────────────────┐
  │              Safety Layer                        │
  │  ├── runPersonalizationRules()  → 18 flags      │
  │  └── getSafetyBanners()         → hard overrides│
  └─────────────────────────────────────────────────┘
```

<br />

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| 🧱 Framework | Next.js 14 App Router |
| 🔷 Language | TypeScript (strict mode) |
| 🎨 Styling | Tailwind CSS with custom design tokens |
| 🗄️ Database | Supabase (PostgreSQL + Auth + RLS) |
| 🤖 AI-Meals | LLM API |
| 🤖 AI-Chat & Workouts | LLM API |
| ⚡ State | TanStack Query + Zustand |
| 📝 Forms | React Hook Form + Zod |
| 📊 Charts | Recharts |
| 🎬 Animation | Framer Motion |
| 🚀 Deployment | Vercel |

<br />

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- LLM API key (primary-for meal suggestions)
- LLM API key (secondary-for chat & workouts)

### Installation

```bash
git clone https://github.com/charusnehalr/karigai.git
cd karigai
npm install
```

### Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_primary_llm_api_key
GROQ_API_KEY=your_secondary_llm_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Open your Supabase project → **SQL Editor**
2. Paste and run `supabase/fix_missing_tables.sql`
3. All tables, RLS policies, and schema cache will be initialized ✅

### Run

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run type-check # TypeScript check
npm test           # Run unit tests
```

Open [http://localhost:3000](http://localhost:3000) 🎉

<br />

---

## 🌱 The Onboarding Philosophy

Karigai's 8-step setup is **not a form.** It's the intake that makes everything downstream smarter:

| Step | Section | What It Unlocks |
|------|---------|----------------|
| 1️⃣ | **Basic Profile** | Age, height, weight, country |
| 2️⃣ | **Body Metrics** | Waist, hip, body fat → clinical WHR & BRI |
| 3️⃣ | **Health Context** | 16 conditions: PCOS, thyroid, deficiencies, pregnancy |
| 4️⃣ | **Cycle Info** | Last period, length, regularity → phase tracking |
| 5️⃣ | **Diet Preferences** | Diet type + 8 restriction flags |
| 6️⃣ | **Fasting Preferences** | Intent + contraindication screening |
| 7️⃣ | **Fitness Preferences** | Level, equipment, days per week |
| 8️⃣ | **Goals** | Weight loss, strength, energy, cycle awareness |

Every step is independently saveable. None are required to use the app.

> **We earn trust. We don't demand it.**

<br />

---

## 📈 The Market Opportunity

<div align="center">

| Stat | Number |
|---|---|
| 🩺 Women globally with PCOS | **190 million+** |
| 🔬 Thyroid disorders-women vs men | **5–8× more common** |
| 🩸 Women with iron deficiency anaemia | **~30% of reproductive age** |
| 💰 Women's health app market by 2030 | **$3.5B+** |
| 😔 Women unserved by current health apps | **72%** |

</div>

The gap between what women need and what currently exists is not a *feature gap.* It's a **category gap.** Karigai builds the category.

<br />

---

## 🗺️ Roadmap

- [ ] ⌚ Wearable integration (Apple Health, Fitbit, Garmin)
- [ ] 🧪 Lab results import (connect bloodwork to deficiency tracking)
- [ ] 🥗 Cycle-synced meal plans (week-by-week phase nutrition)
- [ ] 👭 Community support groups (condition-specific)
- [ ] 👩‍⚕️ Practitioner dashboard (share context with your doctor or dietitian)
- [ ] 🌍 Multilingual support (Hindi, Tamil, Spanish-starting with South Asia)
- [ ] 📱 Mobile app (React Native)

<br />

---

## 🤝 Contributing

Karigai is early. If you're a developer, designer, clinician, or a woman who has been failed by generic health advice-**we want to hear from you.**

Open an issue. Start a discussion. Build something that matters.

<br />

---

## 📄 License

MIT-see [LICENSE](LICENSE)

---

<div align="center">

<br />

*Built for the women who were told their labs are "normal" when nothing felt normal.*

### 🌸 **Karigai**-your body is not average, your wellness intelligence shouldn't be either.

<br />

</div>
