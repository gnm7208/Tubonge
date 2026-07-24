-- Helper functions used by RLS policies (0003_rls.sql).
-- security definer + stable so they can be called from policies without recursive RLS checks.

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_therapist_owner(t_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from therapists where id = t_id and profile_id = auth.uid()
  );
$$;

create or replace function is_booking_party(b_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bookings b
    join therapists t on t.id = b.therapist_id
    where b.id = b_id and (b.client_id = auth.uid() or t.profile_id = auth.uid())
  );
$$;
