# Karigai

Karigai is a condition-aware wellness intelligence platform for women.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Anthropic Claude API, Framer Motion, and Lucide React.

See AGENTS.md for full spec.

## Deployment

Deploy on Vercel with the included `vercel.json`. In the Vercel dashboard, add these environment variables for Production, Preview, and Development as needed:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `NEXT_PUBLIC_APP_URL`

Use `.env.production.local` as the local placeholder template only. Fill real values in Vercel, then deploy with Vercel's Next.js build command: `npm run build`.
