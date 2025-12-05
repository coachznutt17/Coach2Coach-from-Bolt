-- Create downloads tracking table

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  resource uuid references public.resources(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.downloads enable row level security;

drop policy if exists "downloads_user_read_own" on public.downloads;
create policy "downloads_user_read_own" 
on public.downloads for select 
to authenticated 
using (user_id = auth.uid());

-- inserts done server-side (service role); no public insert policy