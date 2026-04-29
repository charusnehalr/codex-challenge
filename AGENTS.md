# Karigai — AGENTS.md
## Project context for Codex

### What this is
Karigai is a condition-aware wellness intelligence platform for women. It is a
desktop-first Next.js web app with sidebar dashboard layout.

### Tech stack
- Framework: Next.js 14+ App Router
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS with custom tokens
- Database: Supabase (PostgreSQL + Auth)
- State: TanStack Query (server data) + Zustand (UI state only)
- Forms: React Hook Form + Zod
- Charts: Recharts
- AI: Anthropic Claude API (model: claude-sonnet-4-5)
- Icons: Lucide React
- Animation: Framer Motion (modals/transitions only)
- Deployment: Vercel

### Folder structure
src/app/             - Next.js App Router pages
src/app/(app)/       - Protected route group (requires auth)
src/app/api/         - API route handlers
src/components/ui/   - Primitive reusable components
src/components/features/ - Page-specific components
src/components/layout/   - Sidebar, header, nav
src/lib/             - Engines, helpers, Supabase clients
src/types/           - TypeScript type definitions
src/hooks/           - Custom React hooks
src/store/           - Zustand stores

### Brand colours (Tailwind tokens)
cream: #F5EFE6  paper: #FAF6EF  card: #FFFFFF  shell: #EFE7DA
bone: #E8DCC8   hairline: #E5DCCB  ink: #1F1B16  ink2: #3A332B
muted: #7A7066  clay: #B8704F  claySoft: #E9C8B5  sage: #7A8B6F
sageSoft: #CFD4C3  blush: #E8B4A8  amber: #C99356  alert: #C25450

### Typography
display: 'Instrument Serif' (serif, italic for display)
body:    'Geist' (sans-serif)
mono:    'Geist Mono' (monospace)
Classes: font-display, font-body, font-mono

### Core rules
1. Never hardcode hex colours — always use Tailwind tokens
2. Never duplicate styling per page — build components first
3. All user data is scoped by auth.uid() with Supabase RLS
4. The AI (Claude) must never diagnose, prescribe, or give supplement dosages
5. All wellness language uses "may", "might", "based on what you've shared"
6. Safety banners must appear for: pain >= 8, heavy bleeding + dizziness,
   eating disorder history + fasting, pregnancy + fasting
7. Setup is always skippable — never block the dashboard
8. TypeScript strict mode — no `any` types

### Test commands
npm run dev         - Start development server
npm run build       - Production build
npm run type-check  - TypeScript check only
npm test            - Run unit tests

### Environment variables needed
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL