-- Phase 12: youth pricing. Self-declared rather than DOB-verified (matches how student/youth
-- discounts commonly work elsewhere, avoids collecting an extra sensitive field at signup).
-- 50% discount applied in create-payment/index.ts, not enforced in the DB -- same trust
-- boundary as session_rate_kes itself, which the client already fully controls via therapists.

alter table profiles add column is_youth boolean not null default false;

-- Redefine (not edit 0004's already-applied migration) to also read is_youth off signup metadata.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, phone, email, is_youth)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.email,
    coalesce((new.raw_user_meta_data ->> 'is_youth')::boolean, false)
  );
  return new;
end;
$$;
