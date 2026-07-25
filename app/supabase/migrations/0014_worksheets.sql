-- Phase 9: therapist-assigned worksheets. Tied to the client-therapist relationship (not one
-- booking) -- worksheets persist across the ongoing relationship, same scope as check_ins.
--
-- Column-scoped update (client may only ever change client_response/completed_at) isn't
-- something a `with check` clause can express cleanly, so that boundary is enforced by app-level
-- discipline in ClientDashboard.tsx's respond form, the same documented tradeoff sessions.notes
-- already makes in 0003_rls.sql.

create table worksheets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  therapist_id uuid not null references therapists (id) on delete cascade,
  title text not null,
  prompt text not null,
  client_response text,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

create index on worksheets (client_id);
create index on worksheets (therapist_id);

alter table worksheets enable row level security;

create policy "worksheets: party read" on worksheets for select
  using (client_id = auth.uid() or is_therapist_owner(therapist_id) or is_admin());
create policy "worksheets: therapist assign" on worksheets for insert
  with check (is_therapist_owner(therapist_id));
create policy "worksheets: party update" on worksheets for update
  using (client_id = auth.uid() or is_therapist_owner(therapist_id) or is_admin());
