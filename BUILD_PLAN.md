# Tubonge — MVP Build Plan

> A BetterHelp-style platform connecting licensed Kenyan therapists with clients online.
> Payments via **one aggregator (Pesapal): M-Pesa + debit card + bank transfer**. Sessions delivered over video/chat.
>
> **This document is written to be handed to Claude in VS Code (Claude Code) as the source of truth.** Build phase by phase, top to bottom. Do not skip the compliance and security notes.

---

## 1. Product summary

Tubonge lets a client in Kenya find a licensed therapist, book a session, pay with M-Pesa, and meet over secure video or chat. Therapists manage their availability, run sessions, and get paid out.

**Two user types:** `client` and `therapist`. Plus an internal `admin`.

**Core loop (client):** sign up → browse/match therapist → book slot → pay via M-Pesa → attend video session → rate.
**Core loop (therapist):** apply → get verified (license check) → set availability & rate → run sessions → view earnings → request payout.

---

## 2. MVP scope

### In scope (build this)
- Email/phone auth with client vs therapist roles.
- Therapist onboarding + admin verification (license number, upload of credentials).
- Therapist profiles: bio, specialties, languages, rate per session, photo.
- Search/browse therapists with basic filters (specialty, language, price).
- Booking against therapist availability slots.
- **Payments on booking via one aggregator** — M-Pesa, debit/credit card, and bank transfer (sandbox first, then production).
- Video sessions (embed a third-party video SDK — do **not** build WebRTC from scratch).
- In-session / async text chat between matched client and therapist.
- Session lifecycle: booked → paid → completed → (optional) cancelled/refunded.
- Client ratings/reviews after a completed session.
- Admin dashboard: verify therapists, view sessions/payments, handle refunds.
- Basic notifications (email + SMS on booking/reminder).

### Explicitly OUT of scope for MVP (do not build yet)
- Native iOS/Android apps (ship a responsive web app / PWA first).
- Insurance claims, couples/group therapy, subscriptions.
- AI matching, AI chatbots.
- Therapist-to-therapist supervision, in-app calling minutes/marketplace.
- Multi-currency. **KES only.**

---

## 3. Recommended tech stack

Chosen for: fast to build, one language end-to-end, strong Claude Code support, cheap to run, works on any Kenyan phone via the browser.

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14+ (App Router), TypeScript, Tailwind CSS** | Responsive web = works on every phone browser now; can be wrapped as a PWA/native later. |
| Backend | **Next.js API routes / Route Handlers** (Node) | One codebase, no separate server to start. |
| Database + Auth + Storage | **Supabase (Postgres, Auth, Storage, RLS)** | Auth, file uploads (license docs), and Postgres in one; row-level security for privacy. |
| Video sessions | **Daily.co** (or Twilio Video / 100ms) | HIPAA/GDPR-grade, drop-in React SDK, generous free tier. Do not hand-roll WebRTC. |
| Payments | **Pesapal aggregator** (swappable) | One integration for M-Pesa + card + bank transfer. Provider-agnostic interface; Flutterwave/DPO/Paystack drop-in alternatives. |
| SMS/Email | **Africa's Talking (SMS)** + **Resend/Postmark (email)** | Africa's Talking is Kenya-native for SMS reminders. |
| Hosting | **Vercel** (frontend/API) + Supabase cloud | Cheap, fast, Claude-friendly deploy. |
| Realtime chat | **Supabase Realtime** (Postgres changes) | No extra service for MVP chat. |

> If you already have a stack preference (React Native, Flutter, Django, etc.), tell Claude to swap it here — the rest of this plan is stack-agnostic in its data model and phases.

---

## 4. Data model (Postgres / Supabase)

Use `snake_case`, `uuid` primary keys, `created_at`/`updated_at` timestamps on every table. Enable **Row Level Security** on all tables.

```
profiles            (id=auth uid, role: client|therapist|admin, full_name, phone, email,
                     avatar_url, created_at)

therapists          (id, profile_id -> profiles, license_number, license_body,
                     verification_status: pending|approved|rejected, bio, specialties[],
                     languages[], years_experience, session_rate_kes,
                     credentials_url, approved_at)

availability_slots  (id, therapist_id -> therapists, starts_at, ends_at,
                     status: open|held|booked)

bookings            (id, client_id -> profiles, therapist_id -> therapists,
                     slot_id -> availability_slots, status: pending_payment|confirmed|
                     completed|cancelled|refunded, amount_kes, created_at)

payments            (id, booking_id -> bookings, provider: pesapal,
                     method: mpesa|card|bank, provider_ref (order tracking id),
                     receipt (mpesa code / card ref / bank ref), amount_kes,
                     status: pending|success|failed, raw_callback jsonb)

sessions            (id, booking_id -> bookings, video_room_url, started_at, ended_at,
                     notes_therapist)  -- notes visible to therapist only

messages            (id, booking_id -> bookings, sender_id -> profiles, body,
                     created_at)

reviews             (id, booking_id -> bookings, client_id, therapist_id, rating 1-5,
                     comment, created_at)

payouts             (id, therapist_id, amount_kes, status: requested|paid, requested_at,
                     paid_at)
```

**RLS rules (critical for privacy):**
- A client can read/write only their own `bookings`, `payments`, `messages`, `reviews`.
- A therapist can read only bookings/messages where they are the therapist.
- Session notes and chat are visible **only** to the two parties on that booking.
- Admin role bypasses via a service-role key used server-side only.

---

## 5. Payments — single aggregator (M-Pesa + card + bank transfer)

**Decision:** use **one payment aggregator** (Pesapal) that bundles **M-Pesa, debit/credit cards (Visa/Mastercard), and bank transfers** behind a single integration and one settlement account — instead of wiring Daraja, a card processor, and a bank rail separately. Provider is kept swappable (Flutterwave, DPO, and Paystack expose the same shape) via a `PaymentProvider` interface so you can change vendors without touching the UI or booking logic.

> Recommended: **Pesapal** for a Kenya-local MVP; **Flutterwave** if you plan to expand across Africa. Both give M-Pesa + cards + bank in one checkout.

**Reality check (verified July 2026):** an aggregator account needs business registration + KRA PIN and (for card acceptance) a bit more KYC than M-Pesa alone. M-Pesa settles instantly; **bank transfers are pay-then-confirm** (reconcile by reference, may take minutes to hours); card fees are higher than M-Pesa. All fine for an MVP. Develop against the provider's **sandbox** first.

**Unified checkout sequence (works for all three methods):**
1. Client picks a slot + method → server creates `booking` with `status = pending_payment` and a `payment` row (`status = pending`).
2. Server calls the aggregator's **submit-order / create-payment** endpoint with amount (KES), booking ref, customer details, and a **callback + IPN URL**. Store the returned `provider_ref` (order tracking id).
3. Client completes payment in the provider's hosted checkout / SDK: **M-Pesa** → STK push PIN prompt; **card** → 3-D Secure; **bank** → transfer to displayed account using the reference.
4. Aggregator hits your **IPN/callback** with the result → server **verifies via the provider's status query** (never trust the redirect alone), records the `receipt`, sets `payment.status`, and on success flips `booking.status = confirmed` and marks the slot `booked`.
5. Provide a **status poll** fallback for delayed callbacks (important for bank transfers).

**Must-dos:** verify every payment server-side via the status query; treat the IPN as untrusted and idempotent (providers retry); store `raw_callback` for auditing; HTTPS callback URLs (Vercel or an ngrok tunnel in dev); keep all keys in env vars, never in the repo. The UI already presents the three methods (`src/screens/Booking.tsx`) — wire each to the same `POST /api/payments/create` endpoint with a `method` field; the confirmation state must be driven by the verified callback, not the client timer used in the prototype.

Env vars: `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`, `PESAPAL_ENV=sandbox|production`, `PESAPAL_IPN_URL`, `PESAPAL_CALLBACK_URL`. (Swap the prefix if you choose another provider.)

---

## 6. Compliance & trust (do not skip)

- **Therapist licensing:** Kenya requires registration with the **Counsellors and Psychologists Board (CPB)** under the Counsellors and Psychologists Act No. 14 of 2014, renewed annually. MVP must capture a **license number + license body** and gate a therapist as `pending` until an admin manually verifies it. Show a "Verified" badge only after approval.
- **Data protection:** Kenya's **Data Protection Act (2019)** applies — health data is sensitive. Minimize data collected, encrypt in transit (HTTPS) and at rest (Supabase default), restrict access via RLS, and add a privacy policy + consent checkbox at signup. Session notes and chat must never be readable by other users.
- **Not medical advice / crisis handling:** Add a visible disclaimer and a crisis resource (e.g. Kenya emergency + a mental-health helpline) on booking and in-session, since therapy platforms carry duty-of-care expectations.
- **Payments:** M-Pesa handles PCI; you store only receipts/metadata, never PINs.

---

## 7. Build phases (hand to Claude Code one at a time)

Each phase should end with something runnable. Ask Claude to write tests where noted.

**Phase 0 — Scaffold**
- Init Next.js + TypeScript + Tailwind. Set up Supabase project, env vars, `.env.example`.
- Create the Postgres schema (section 4) as SQL migrations. Enable RLS with the rules above.
- Add auth (email + phone) with role selection at signup.
- Deliverable: user can sign up, log in, and see a role-appropriate empty dashboard.

**Phase 1 — Therapist onboarding & admin verification**
- Therapist profile form + credential upload to Supabase Storage.
- Admin dashboard to list `pending` therapists, view docs, approve/reject.
- Deliverable: a therapist can apply; an admin can approve; approved profile goes public.

**Phase 2 — Discovery & profiles**
- Public therapist listing with filters (specialty, language, price) and profile pages.
- Availability management for therapists (create/remove slots).
- Deliverable: client can browse verified therapists and see open slots.

**Phase 3 — Booking + M-Pesa (the core)**
- Booking flow that holds a slot and creates `pending_payment` booking.
- Implement the aggregator checkout for all three methods + IPN/callback + status query (section 5) on **sandbox**.
- On success: confirm booking, book slot, send confirmation (email/SMS).
- Deliverable: end-to-end paid booking using the M-Pesa sandbox. **Write tests for the callback handler (success, failure, retry/idempotency).**

**Phase 4 — Sessions: video + chat**
- Integrate Daily.co (create a room per confirmed booking; join button appears at session time).
- Supabase Realtime chat scoped to the booking.
- Therapist-only private session notes.
- Deliverable: both parties can join a video room and chat for a booked session.

**Phase 5 — Post-session & payouts**
- Mark session completed; prompt client for rating/review.
- Therapist earnings view; simple payout **request** (manual settlement for MVP — no auto-disbursement yet).
- Deliverable: reviews show on profiles; therapist can see earnings and request payout.

**Phase 6 — Polish & launch prep**
- Notifications (booking, reminder 1h before, cancellation), empty/error states, mobile QA.
- Privacy policy, consent, crisis disclaimer, terms.
- Swap M-Pesa to production shortcode once Safaricom approves; smoke-test with a small real payment.
- Expire stale `pending_payment` bookings/`held` slots (background job) -- abandoned checkouts
  (closed tab, payment never completed and no IPN ever arrives) currently leave a slot held
  forever. A scheduled job (e.g. `pg_cron` calling a function, or a Supabase Edge Function on a
  cron trigger) should release slots/cancel bookings stuck in that state past some timeout
  (e.g. 30 min).
- Deliverable: production-ready responsive web app.

---

## 8. Key decisions to confirm before Phase 3

- **Payment timing:** charge full session fee at booking (recommended for MVP) vs. hold/deposit.
- **Cancellation/refund policy:** who can cancel, how late, and whether M-Pesa reversal is manual (recommended: manual admin refund for MVP).
- **Commission:** does Tubonge take a % per session? If yes, store platform fee on `bookings` and compute therapist earnings net of it.
- **Payout method:** M-Pesa B2C disbursement (Daraja supports it) vs. manual bank transfer for MVP.

---

## 9. First message to give Claude in VS Code

> "Read `BUILD_PLAN.md`. Start with **Phase 0**: scaffold a Next.js 14 + TypeScript + Tailwind app, set up Supabase, create the SQL migrations for the data model in section 4 with Row Level Security, and implement email/phone auth with client/therapist/admin roles. Stop after Phase 0 so I can test before we continue."

Then proceed phase by phase. Keep secrets in `.env` (never commit), develop M-Pesa on the sandbox, and treat sections 5 and 6 as hard requirements.

---

### Sources
- M-Pesa Daraja / STK Push 2026: [VE.KE guide](https://ve.ke/blog/mpesa-integration-2026-guide), [cnbcode requirements](https://cnbcode.com/blog/m-pesa-daraja-api-integration-requirements-complete-2026-guide), [Nairobi Web Experts](https://nairobiwebexperts.com/mpesa-stk-push-integration-kenya/)
- Kenya aggregators (M-Pesa + card + bank): [Payment gateways Kenya 2026](https://cnbcode.com/blog/payment-gateways-kenya-complete-guide), [Pesapal vs Flutterwave vs DPO](https://www.transfer.co.ke/blog/best-payment-gateways-kenyan-ecommerce), [M-Pesa, Pesapal, DPO & Flutterwave compared](https://neliumsystems.com/ecommerce-payment-gateways-kenya-2026/)
- Kenya therapist licensing: [Counsellors and Psychologists Board](https://cpb.health.go.ke/), [TherapyRoute 2025 guide](https://www.therapyroute.com/article/mental-health-licensing-regulation-in-kenya-2025-guide-by-therapyroute)
