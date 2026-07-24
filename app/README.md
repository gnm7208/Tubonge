# Tubonge — App

Tubonge online-therapy MVP (see `../BUILD_PLAN.md`).
Built with **React + TypeScript + Vite + Tailwind + shadcn/ui**, styled with the Anthropic brand palette (orange `#d97757`, blue `#6a9bcc`, green `#788c5d`) and Poppins/Lora typography.

**Phase 0 status:** real Supabase auth (email/password, client vs therapist vs admin roles) and the full section-4 schema/RLS are wired up. Browsing, booking, and payments still use the mock data / simulated payment flow from the original UI prototype — those become real in later build phases.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run the files in `supabase/migrations/` **in order** (`0001` → `0004`).
3. In Project Settings → API, copy the Project URL and `anon` public key.
4. `cp .env.example .env.local` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
5. By default Supabase requires email confirmation on signup — for local testing you can turn this off under Authentication → Providers → Email → "Confirm email", or just click the confirmation link Supabase emails to you.

```bash
pnpm install      # or npm install
pnpm dev          # start dev server
pnpm build        # produce a single-file dist/index.html
```

A pre-built, self-contained preview is at `../tubonge-ui-preview.html` — open it in any browser (this predates the auth wiring, so it still shows the mock-only flow).

## Screens (in `src/screens/`)

- `Landing.tsx` — hero, how-it-works, featured therapists, trust/compliance strip
- `Browse.tsx` — search + filter therapists (specialty, language, price, sort)
- `TherapistProfile.tsx` — bio, reviews, availability, booking sidebar
- `Booking.tsx` — slot select + **M-Pesa STK-push payment flow** (simulated: prompt → confirmation)
- `ClientDashboard.tsx` — upcoming/past sessions, join button
- `SessionRoom.tsx` — video call layout with in-session chat and controls
- `SignUp.tsx` / `Login.tsx` — real Supabase auth with client/therapist role selection
- `TherapistDashboard.tsx` / `AdminDashboard.tsx` — minimal role-gated placeholders (built out in later phases)

Mock data lives in `src/data/mock.ts`. Navigation is state-based in `src/App.tsx`. Auth state lives in `src/lib/auth.tsx`.

## Handing to Claude Code

1. Open this folder in VS Code.
2. Point Claude at `../BUILD_PLAN.md` (the full spec) and this UI.
3. Suggested first step: "Wire these screens to Supabase auth + data per BUILD_PLAN Phase 0–2, keeping the existing components and styling."
4. Then implement the real M-Pesa STK Push (Phase 3) behind the existing `Booking.tsx` payment UI.

## Notes for the real build

- Replace mock payment in `Booking.tsx` with a call to your server's STK-push endpoint; drive the success state from the Daraja callback, not the client.
- Swap `SessionRoom.tsx`'s placeholder video area for the Daily.co (or Twilio) React SDK.
- Keep therapist `verified` badges gated on admin approval.
