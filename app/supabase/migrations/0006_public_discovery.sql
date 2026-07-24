-- Phase 2 (discovery): therapists need a professional title, and clients browsing
-- approved therapists need to read the therapist's name off `profiles`, which the
-- existing "profiles: read own or admin" policy doesn't allow.

alter table therapists add column if not exists title text not null default '';

drop policy if exists "profiles: public read for approved therapists" on profiles;
create policy "profiles: public read for approved therapists" on profiles for select
  using (
    exists (
      select 1 from therapists t
      where t.profile_id = profiles.id and t.verification_status = 'approved'
    )
  );
