-- Security fix: "profiles: update own" (0003_rls.sql) only checks `id = auth.uid()`, which
-- restricts *which row* a client can touch but says nothing about *which columns* -- so any
-- logged-in client could PATCH their own profiles.role straight to 'admin' via a raw REST call.
-- Discovered while using that exact trick as a (previously legitimate-feeling) testing shortcut.
--
-- RLS can't cleanly express "this row, but only these columns" -- Postgres's column-level GRANT
-- system is the right tool for that, and it's enforced independently of (underneath) RLS.
-- No app code currently self-updates profiles at all, so this doesn't remove any real
-- functionality -- it closes a gap nothing legitimate was relying on.

revoke update on public.profiles from authenticated;
grant update (full_name, phone, avatar_url, is_youth) on public.profiles to authenticated;
