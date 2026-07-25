-- Phase 4: video sessions + chat.
--
-- Session notes were a plain column on `sessions` (0001_schema.sql), which Postgres RLS can't
-- restrict at column granularity -- both booking parties could read it. Move notes to their own
-- table so RLS can actually make them therapist-only.

alter table sessions drop column if exists notes_therapist;

create table session_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references sessions (id) on delete cascade,
  therapist_id uuid not null references therapists (id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now()
);
create trigger session_notes_set_updated_at before update on session_notes
  for each row execute function set_updated_at();

alter table session_notes enable row level security;

drop policy if exists "session_notes: therapist only" on session_notes;
create policy "session_notes: therapist only" on session_notes for all
  using (is_therapist_owner(therapist_id))
  with check (is_therapist_owner(therapist_id));

-- Realtime chat: add `messages` to the realtime publication so Supabase Realtime can broadcast
-- postgres_changes on it (existing RLS on messages already scopes reads to booking parties).
do $$
begin
  alter publication supabase_realtime add table messages;
exception
  when others then null; -- already a member; fine
end $$;
