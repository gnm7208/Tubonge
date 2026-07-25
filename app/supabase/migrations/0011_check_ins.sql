-- Phase 7: mood/symptom check-ins (PHQ-9 / GAD-7).

create or replace function is_client_of(c_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bookings b
    join therapists t on t.id = b.therapist_id
    where b.client_id = c_id
      and t.profile_id = auth.uid()
      and b.status in ('confirmed', 'completed')
  );
$$;

create type check_in_type as enum ('phq9', 'gad7');

create table check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  type check_in_type not null,
  answers int[] not null,
  score int not null,
  created_at timestamptz not null default now()
);
create index on check_ins (client_id, created_at);

alter table check_ins enable row level security;

create policy "check_ins: client owns" on check_ins for select
  using (client_id = auth.uid() or is_client_of(client_id) or is_admin());
create policy "check_ins: client insert own" on check_ins for insert
  with check (client_id = auth.uid());
