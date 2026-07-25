-- Phase 8: free group sessions ("groupinars"). Confirmed free for clients -- best unit
-- economics given limited therapist supply (one therapist serves many clients per hour).
-- Therapist compensation for running groups is a separate business decision, not this schema's
-- problem.

create type group_session_status as enum ('scheduled', 'completed', 'cancelled');

create table group_sessions (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references therapists (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null default 10,
  video_room_url text,
  status group_session_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  constraint group_session_time_order check (ends_at > starts_at)
);

create table group_session_attendees (
  id uuid primary key default gen_random_uuid(),
  group_session_id uuid not null references group_sessions (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_session_id, client_id)
);

create index on group_sessions (therapist_id);
create index on group_sessions (starts_at);
create index on group_session_attendees (client_id);

-- messages: group chat alongside existing 1:1 booking chat. Exactly one parent is set.
alter table messages add column group_session_id uuid references group_sessions (id) on delete cascade;
alter table messages alter column booking_id drop not null;
alter table messages add constraint messages_one_parent check (
  (booking_id is not null and group_session_id is null) or
  (booking_id is null and group_session_id is not null)
);
create index on messages (group_session_id);

-- Helpers for RLS (mirrors is_booking_party/is_therapist_owner in 0002_functions.sql) ------

create or replace function is_group_attendee(g_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_session_attendees where group_session_id = g_id and client_id = auth.uid()
  );
$$;

create or replace function is_group_session_owner(g_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_sessions g where g.id = g_id and is_therapist_owner(g.therapist_id)
  );
$$;

-- Atomic RSVP: checks capacity and inserts the attendee row in one call so two clients can't
-- both squeeze into the last spot (mirrors the atomic slot-hold in create-payment). Called from
-- the join-group-session Edge Function with the caller's own JWT so auth.uid() resolves here.
-- Idempotent: re-joining an already-joined session just returns the room url instead of erroring.
create or replace function join_group_session(g_id uuid)
returns table (video_room_url text) language plpgsql security definer set search_path = public as $$
declare
  cap int;
  cnt int;
  already boolean;
begin
  select exists (
    select 1 from group_session_attendees where group_session_id = g_id and client_id = auth.uid()
  ) into already;
  if already then
    return query select gs.video_room_url from group_sessions gs where gs.id = g_id;
    return;
  end if;

  select capacity into cap from group_sessions where id = g_id and status = 'scheduled';
  if cap is null then
    raise exception 'This group session is not open for RSVPs.';
  end if;

  select count(*) into cnt from group_session_attendees where group_session_id = g_id;
  if cnt >= cap then
    raise exception 'This group session is full.';
  end if;

  insert into group_session_attendees (group_session_id, client_id) values (g_id, auth.uid());

  return query select gs.video_room_url from group_sessions gs where gs.id = g_id;
end;
$$;

-- RLS ------------------------------------------------------------------------------------

alter table group_sessions enable row level security;
alter table group_session_attendees enable row level security;

create policy "group_sessions: public read" on group_sessions for select
  using (true);
create policy "group_sessions: owner manage insert" on group_sessions for insert
  with check (is_therapist_owner(therapist_id));
create policy "group_sessions: owner manage update" on group_sessions for update
  using (is_therapist_owner(therapist_id));

create policy "group_session_attendees: self or owner read" on group_session_attendees for select
  using (client_id = auth.uid() or is_group_session_owner(group_session_id) or is_admin());
create policy "group_session_attendees: client join" on group_session_attendees for insert
  with check (client_id = auth.uid());

create policy "messages: group party read" on messages for select
  using (group_session_id is not null and (is_group_attendee(group_session_id) or is_group_session_owner(group_session_id) or is_admin()));
create policy "messages: group party send" on messages for insert
  with check (group_session_id is not null and sender_id = auth.uid() and (is_group_attendee(group_session_id) or is_group_session_owner(group_session_id)));
