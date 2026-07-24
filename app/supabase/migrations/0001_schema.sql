-- Tubonge MVP schema (BUILD_PLAN.md section 4)
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

create type user_role as enum ('client', 'therapist', 'admin');
create type verification_status as enum ('pending', 'approved', 'rejected');
create type slot_status as enum ('open', 'held', 'booked');
create type booking_status as enum ('pending_payment', 'confirmed', 'completed', 'cancelled', 'refunded');
create type payment_provider as enum ('pesapal');
create type payment_method as enum ('mpesa', 'card', 'bank');
create type payment_status as enum ('pending', 'success', 'failed');
create type payout_status as enum ('requested', 'paid');

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles: one row per auth user, id matches auth.users.id
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

create table therapists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  license_number text not null,
  license_body text not null default 'Counsellors and Psychologists Board (CPB)',
  verification_status verification_status not null default 'pending',
  bio text,
  specialties text[] not null default '{}',
  languages text[] not null default '{}',
  years_experience int not null default 0,
  session_rate_kes int not null,
  credentials_url text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger therapists_set_updated_at before update on therapists
  for each row execute function set_updated_at();

create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references therapists (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status slot_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint slot_time_order check (ends_at > starts_at)
);
create trigger availability_slots_set_updated_at before update on availability_slots
  for each row execute function set_updated_at();

create table bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  therapist_id uuid not null references therapists (id) on delete cascade,
  slot_id uuid not null references availability_slots (id) on delete restrict,
  status booking_status not null default 'pending_payment',
  amount_kes int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bookings_set_updated_at before update on bookings
  for each row execute function set_updated_at();

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  provider payment_provider not null default 'pesapal',
  method payment_method not null,
  provider_ref text,
  receipt text,
  amount_kes int not null,
  status payment_status not null default 'pending',
  raw_callback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger payments_set_updated_at before update on payments
  for each row execute function set_updated_at();

create table sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  video_room_url text,
  started_at timestamptz,
  ended_at timestamptz,
  notes_therapist text, -- visible to the therapist only, see 0003_rls.sql
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger sessions_set_updated_at before update on sessions
  for each row execute function set_updated_at();

create table messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade,
  therapist_id uuid not null references therapists (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references therapists (id) on delete cascade,
  amount_kes int not null,
  status payout_status not null default 'requested',
  requested_at timestamptz not null default now(),
  paid_at timestamptz
);

create index on therapists (verification_status);
create index on availability_slots (therapist_id, status);
create index on bookings (client_id);
create index on bookings (therapist_id);
create index on payments (booking_id);
create index on messages (booking_id);
create index on reviews (therapist_id);
create index on payouts (therapist_id);
