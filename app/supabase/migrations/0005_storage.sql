-- Private Storage bucket for therapist license/credential uploads (Phase 1 onboarding).
-- Objects are stored as "<profile_id>/<filename>" so folder-based RLS can scope access.

insert into storage.buckets (id, name, public)
values ('credentials', 'credentials', false)
on conflict (id) do nothing;

drop policy if exists "credentials: owner upload" on storage.objects;
create policy "credentials: owner upload"
on storage.objects for insert
with check (
  bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "credentials: owner or admin read" on storage.objects;
create policy "credentials: owner or admin read"
on storage.objects for select
using (
  bucket_id = 'credentials' and (
    (storage.foldername(name))[1] = auth.uid()::text or public.is_admin()
  )
);

drop policy if exists "credentials: owner update" on storage.objects;
create policy "credentials: owner update"
on storage.objects for update
using (
  bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "credentials: owner delete" on storage.objects;
create policy "credentials: owner delete"
on storage.objects for delete
using (
  bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text
);
