begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name_en text not null default '',
  full_name_ar text not null default '',
  handle text unique,
  avatar_url text,
  bio_en text not null default '',
  bio_ar text not null default '',
  location_en text not null default '',
  location_ar text not null default '',
  style_tags_en text[] not null default '{}',
  style_tags_ar text[] not null default '{}',
  preferred_language text not null default 'en' check (preferred_language in ('en', 'ar')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label_en text not null check (label_en in ('Home', 'Work', 'Other')),
  label_ar text not null check (label_ar in ('المنزل', 'العمل', 'أخرى')),
  full_name_en text not null,
  full_name_ar text not null,
  phone text not null,
  city_en text not null,
  city_ar text not null,
  district_en text,
  district_ar text,
  street_en text not null,
  street_ar text not null,
  notes_en text,
  notes_ar text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists addresses_user_id_idx on public.addresses(user_id);
create unique index if not exists addresses_one_default_per_user_idx
  on public.addresses(user_id) where is_default;

create or replace function public.ensure_address_default()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.addresses
    where user_id = new.user_id and is_default
  ) then
    new.is_default := true;
  end if;
  return new;
end;
$$;

drop trigger if exists addresses_ensure_default on public.addresses;
create trigger addresses_ensure_default
before insert on public.addresses
for each row execute function public.ensure_address_default();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at before update on public.addresses
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_name text;
begin
  safe_name := left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120);
  insert into public.profiles (id, full_name_en, full_name_ar)
  values (new.id, safe_name, safe_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own" on public.addresses
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own" on public.addresses
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own" on public.addresses
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own" on public.addresses
for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_default_address(target_address_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.addresses
    where id = target_address_id and user_id = current_user_id
  ) then
    raise exception 'address not found' using errcode = 'P0002';
  end if;
  update public.addresses set is_default = false
  where user_id = current_user_id and is_default;
  update public.addresses set is_default = true
  where id = target_address_id and user_id = current_user_id;
end;
$$;

revoke all on function public.set_default_address(uuid) from public, anon;
grant execute on function public.set_default_address(uuid) to authenticated;

commit;
