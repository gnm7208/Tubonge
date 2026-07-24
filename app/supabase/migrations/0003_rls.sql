-- Row Level Security, per BUILD_PLAN.md section 4:
--   * a client can read/write only their own bookings, payments, messages, reviews
--   * a therapist can read only bookings/messages where they are the therapist
--   * session notes and chat are visible only to the two parties on that booking
--   * admin bypasses via is_admin() (in place of a service-role-only server, since
--     this MVP has no dedicated backend yet -- revisit if/when Phase 1 admin actions
--     move server-side)

alter table profiles enable row level security;
alter table therapists enable row level security;
alter table availability_slots enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table payouts enable row level security;

-- profiles ------------------------------------------------------------
create policy "profiles: read own or admin" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles: update own" on profiles for update
  using (id = auth.uid());
create policy "profiles: insert own" on profiles for insert
  with check (id = auth.uid());

-- therapists ------------------------------------------------------------
-- public browsing needs approved therapists visible to anyone (incl. anon/logged-out)
create policy "therapists: public read approved" on therapists for select
  using (verification_status = 'approved' or profile_id = auth.uid() or is_admin());
create policy "therapists: owner insert" on therapists for insert
  with check (profile_id = auth.uid());
create policy "therapists: owner or admin update" on therapists for update
  using (profile_id = auth.uid() or is_admin());

-- availability_slots ------------------------------------------------------------
create policy "slots: public read" on availability_slots for select
  using (true);
create policy "slots: owner manage insert" on availability_slots for insert
  with check (is_therapist_owner(therapist_id));
create policy "slots: owner manage update" on availability_slots for update
  using (is_therapist_owner(therapist_id));
create policy "slots: owner manage delete" on availability_slots for delete
  using (is_therapist_owner(therapist_id));

-- bookings ------------------------------------------------------------
create policy "bookings: party read" on bookings for select
  using (client_id = auth.uid() or is_therapist_owner(therapist_id) or is_admin());
create policy "bookings: client create" on bookings for insert
  with check (client_id = auth.uid());
create policy "bookings: party update" on bookings for update
  using (client_id = auth.uid() or is_therapist_owner(therapist_id) or is_admin());

-- payments ------------------------------------------------------------
create policy "payments: party read" on payments for select
  using (is_booking_party(booking_id) or is_admin());
create policy "payments: client create" on payments for insert
  with check (is_booking_party(booking_id));

-- sessions ------------------------------------------------------------
-- NOTE: notes_therapist is column-level therapist-only by convention; the client
-- app must never select that column for a client-facing read. A security-definer
-- view that masks it for non-therapists should be introduced in Phase 4 when
-- session notes become a real feature.
create policy "sessions: party read" on sessions for select
  using (is_booking_party(booking_id) or is_admin());
create policy "sessions: party update" on sessions for update
  using (is_booking_party(booking_id));

-- messages ------------------------------------------------------------
create policy "messages: party read" on messages for select
  using (is_booking_party(booking_id) or is_admin());
create policy "messages: party send" on messages for insert
  with check (sender_id = auth.uid() and is_booking_party(booking_id));

-- reviews ------------------------------------------------------------
create policy "reviews: public read" on reviews for select
  using (true);
create policy "reviews: client create own" on reviews for insert
  with check (client_id = auth.uid());

-- payouts ------------------------------------------------------------
create policy "payouts: owner read" on payouts for select
  using (is_therapist_owner(therapist_id) or is_admin());
create policy "payouts: owner request" on payouts for insert
  with check (is_therapist_owner(therapist_id));
