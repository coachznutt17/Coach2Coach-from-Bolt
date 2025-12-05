-- Create core tables for Coach2Coach platform

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'coach',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create resources table
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  sport text,
  level text,
  price_cents int not null default 0,
  is_free boolean not null default false,
  file_path text,        -- will store private path in storage
  cover_image text,      -- optional public image path
  tags text[] default '{}',
  is_published boolean not null default false,
  avg_rating numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create purchases table
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  buyer uuid not null references public.profiles(id) on delete cascade,
  resource uuid not null references public.resources(id) on delete cascade,
  amount_cents int not null,
  stripe_payment_intent text,  -- will be set in Stripe step
  created_at timestamptz not null default now(),
  unique (buyer, resource)     -- one license per buyer per resource
);

-- Update timestamps function
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Add trigger for resources
drop trigger if exists trg_resources_touch on public.resources;
create trigger trg_resources_touch
before update on public.resources
for each row execute function public.touch_updated_at();

-- Add trigger for profiles
drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

-- Convenience function for current user id
create or replace function public.current_user_id()
returns uuid language sql stable as $$
  select auth.uid();
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.purchases enable row level security;

-- RLS policies: profiles
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, null, 'coach')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS policies: resources
drop policy if exists "resources_read_published_or_owner" on public.resources;
create policy "resources_read_published_or_owner"
on public.resources for select
to authenticated
using (is_published = true or owner = auth.uid());

drop policy if exists "resources_insert_owner_only" on public.resources;
create policy "resources_insert_owner_only"
on public.resources for insert
to authenticated
with check (owner = auth.uid());

drop policy if exists "resources_update_owner_only" on public.resources;
create policy "resources_update_owner_only"
on public.resources for update
to authenticated
using (owner = auth.uid());

drop policy if exists "resources_delete_owner_only" on public.resources;
create policy "resources_delete_owner_only"
on public.resources for delete
to authenticated
using (owner = auth.uid());

-- RLS policies: purchases
drop policy if exists "purchases_read_buyer_or_owner" on public.purchases;
create policy "purchases_read_buyer_or_owner"
on public.purchases for select
to authenticated
using (
  buyer = auth.uid()
  or exists (
    select 1 from public.resources r
    where r.id = public.purchases.resource and r.owner = auth.uid()
  )
);

drop policy if exists "purchases_insert_service_only" on public.purchases;
create policy "purchases_insert_service_only"
on public.purchases for insert
to service_role
with check (true);

-- OPTIONAL DEV POLICY (comment out in prod):
-- drop policy if exists "purchases_insert_self_dev" on public.purchases;
-- create policy "purchases_insert_self_dev"
-- on public.purchases for insert
-- to authenticated
-- with check (buyer = auth.uid());

-- Helpful view for user's purchases
create or replace view public.v_my_purchases as
select p.*, r.title, r.owner
from public.purchases p
join public.resources r on r.id = p.resource
where p.buyer = auth.uid();

-- Grant access to view
grant select on public.v_my_purchases to authenticated;