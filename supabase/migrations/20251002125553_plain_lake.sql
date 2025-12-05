-- Create storage buckets and policies for Coach2Coach

-- Create buckets
insert into storage.buckets (id, name, public)
values 
  ('resource-files', 'resource-files', false),
  ('resource-covers', 'resource-covers', true)
on conflict (id) do nothing;

-- COVERS (public read; only owner can write)
drop policy if exists "covers_public_read" on storage.objects;
create policy "covers_public_read"
on storage.objects for select
to public
using (bucket_id = 'resource-covers');

drop policy if exists "covers_owner_insert" on storage.objects;
create policy "covers_owner_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'resource-covers' and owner = auth.uid());

drop policy if exists "covers_owner_update" on storage.objects;
create policy "covers_owner_update"
on storage.objects for update
to authenticated
using (bucket_id = 'resource-covers' and owner = auth.uid());

drop policy if exists "covers_owner_delete" on storage.objects;
create policy "covers_owner_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'resource-covers' and owner = auth.uid());

-- FILES (private; no public read; only owner can write)
drop policy if exists "files_owner_insert" on storage.objects;
create policy "files_owner_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'resource-files' and owner = auth.uid());

drop policy if exists "files_owner_update" on storage.objects;
create policy "files_owner_update"
on storage.objects for update
to authenticated
using (bucket_id = 'resource-files' and owner = auth.uid());

drop policy if exists "files_owner_delete" on storage.objects;
create policy "files_owner_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'resource-files' and owner = auth.uid());

-- Intentionally NO general select policy on resource-files (downloads go via signed URLs)