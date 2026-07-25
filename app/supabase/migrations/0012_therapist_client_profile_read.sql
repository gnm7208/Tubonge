-- Bugfix found via live-testing Phase 7's "My clients" panel: a therapist has never been able
-- to read their client's `profiles` row (name, etc.) -- there was no RLS policy for it, so every
-- `profiles(full_name)` embed on a therapist's own booking queries silently returned null and fell
-- back to a generic "Client" placeholder in the UI (TherapistDashboard's UpcomingSessions had this
-- bug since Phase 4 too; nobody had noticed). Reuses the is_client_of() helper from 0011.

drop policy if exists "profiles: therapist reads own clients" on profiles;
create policy "profiles: therapist reads own clients" on profiles for select
  using (is_client_of(profiles.id));
