-- Phase 3, slice 2: public seller-card projection.
--
-- Goal: expose a *public* seller card (name, avatar, type, bio, city,
-- style tags, verification, response stats, joined-at) that anyone can
-- browse — without leaking the private `profiles` row, which carries the
-- owner's full address book, language preference, and any future private
-- settings.
--
-- Approach: a dedicated owner-writable table + a read-only view that
-- aggregates active-listing counts. The view is the only object anon
-- callers need to read; they never touch the underlying listings table
-- directly.

begin;

create table public.public_seller_profiles (
  seller_id uuid primary key references auth.users(id) on delete cascade,
  display_name_en text not null default '',
  display_name_ar text not null default '',
  handle text unique,
  avatar_url text,
  type_en text not null default 'Seller',
  type_ar text not null default 'بائع',
  bio_en text not null default '',
  bio_ar text not null default '',
  city_en text not null default '',
  city_ar text not null default '',
  style_tags_en text[] not null default '{}',
  style_tags_ar text[] not null default '{}',
  is_verified boolean not null default false,
  response_rate real
    check (response_rate is null or (response_rate >= 0 and response_rate <= 1)),
  response_time_hours integer
    check (response_time_hours is null or response_time_hours >= 0),
  joined_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index public_seller_profiles_handle_idx
  on public.public_seller_profiles(handle)
  where handle is not null;

create trigger public_seller_profiles_set_updated_at
before update on public.public_seller_profiles
for each row execute function public.set_updated_at();

alter table public.public_seller_profiles enable row level security;

revoke all on table public.public_seller_profiles from anon;
grant select on table public.public_seller_profiles to anon;
grant select, insert, update, delete
  on table public.public_seller_profiles to authenticated;

create policy "public_seller_profiles_select_all"
on public.public_seller_profiles
for select to anon, authenticated
using (true);

create policy "public_seller_profiles_insert_own"
on public.public_seller_profiles
for insert to authenticated
with check ((select auth.uid()) = seller_id);

create policy "public_seller_profiles_update_own"
on public.public_seller_profiles
for update to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id);

create policy "public_seller_profiles_delete_own"
on public.public_seller_profiles
for delete to authenticated
using ((select auth.uid()) = seller_id);

-- Seed a public seller card whenever a new auth user is created.
-- Mirrors the existing `handle_new_auth_user` trigger that seeds the
-- private `profiles` row; the public projection starts blank so the
-- seller fills it in via Edit Profile (G-33). The two triggers are
-- independent — neither depends on the other's row existing.
create or replace function public.seed_public_seller_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_name text;
begin
  safe_name := left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120);
  insert into public.public_seller_profiles (seller_id, display_name_en, display_name_ar)
  values (new.id, safe_name, safe_name)
  on conflict (seller_id) do nothing;
  return new;
end;
$$;

revoke all on function public.seed_public_seller_profile()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created_public_profile on auth.users;
create trigger on_auth_user_created_public_profile
after insert on auth.users
for each row execute function public.seed_public_seller_profile();

-- Public read-only projection. Adds the seller's active-listings count
-- without exposing the underlying listings table to anonymous callers.
-- Drafts, reserved, sold, and archived listings never contribute.
create or replace view public.seller_card_view as
select
  p.seller_id,
  p.display_name_en,
  p.display_name_ar,
  p.handle,
  p.avatar_url,
  p.type_en,
  p.type_ar,
  p.bio_en,
  p.bio_ar,
  p.city_en,
  p.city_ar,
  p.style_tags_en,
  p.style_tags_ar,
  p.is_verified,
  p.response_rate,
  p.response_time_hours,
  p.joined_at,
  p.updated_at,
  coalesce(lc.listings_count, 0)::integer as listings_count
from public.public_seller_profiles p
left join (
  select seller_id, count(*)::bigint as listings_count
  from public.listings
  where listings.status = 'active'
  group by listings.seller_id
) lc on lc.seller_id = p.seller_id;

grant select on public.seller_card_view to anon, authenticated;

commit;
