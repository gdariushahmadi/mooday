begin;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title_en text not null check (char_length(title_en) between 1 and 160),
  title_ar text not null check (char_length(title_ar) between 1 and 160),
  description_en text not null default '' check (char_length(description_en) <= 5000),
  description_ar text not null default '' check (char_length(description_ar) <= 5000),
  price_minor bigint not null check (price_minor >= 0),
  original_price_minor bigint check (
    original_price_minor is null or original_price_minor >= price_minor
  ),
  currency text not null default 'AED' check (currency = 'AED'),
  condition_en text not null,
  condition_ar text not null,
  category text not null,
  size text,
  color_en text,
  color_ar text,
  mode text not null default 'resell' check (mode in ('resell', 'rent')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'reserved', 'sold', 'archived')),
  is_authentic boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique check (storage_path <> ''),
  sort_order smallint not null default 0 check (sort_order >= 0),
  alt_en text not null default '',
  alt_ar text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  unique (listing_id, sort_order)
);

create index listings_seller_created_idx
  on public.listings(seller_id, created_at desc);
create index listings_active_created_idx
  on public.listings(created_at desc) where status = 'active';
create index listings_active_category_idx
  on public.listings(category, created_at desc) where status = 'active';
create index listing_images_listing_idx
  on public.listing_images(listing_id, sort_order);

create trigger listings_set_updated_at before update on public.listings
for each row execute function public.set_updated_at();

alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

grant select on table public.listings, public.listing_images to anon;
grant select, insert, update, delete
  on table public.listings, public.listing_images to authenticated;

create policy "listings_select_visible" on public.listings
for select to anon, authenticated
using (status = 'active' or (select auth.uid()) = seller_id);

create policy "listings_insert_own" on public.listings
for insert to authenticated
with check ((select auth.uid()) = seller_id);

create policy "listings_update_own" on public.listings
for update to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id);

create policy "listings_delete_own" on public.listings
for delete to authenticated
using ((select auth.uid()) = seller_id);

create policy "listing_images_select_visible" on public.listing_images
for select to anon, authenticated
using (exists (
  select 1 from public.listings
  where listings.id = listing_images.listing_id
));

create policy "listing_images_insert_own" on public.listing_images
for insert to authenticated
with check (exists (
  select 1 from public.listings
  where listings.id = listing_images.listing_id
    and listings.seller_id = (select auth.uid())
));

create policy "listing_images_update_own" on public.listing_images
for update to authenticated
using (exists (
  select 1 from public.listings
  where listings.id = listing_images.listing_id
    and listings.seller_id = (select auth.uid())
))
with check (exists (
  select 1 from public.listings
  where listings.id = listing_images.listing_id
    and listings.seller_id = (select auth.uid())
));

create policy "listing_images_delete_own" on public.listing_images
for delete to authenticated
using (exists (
  select 1 from public.listings
  where listings.id = listing_images.listing_id
    and listings.seller_id = (select auth.uid())
));

commit;
