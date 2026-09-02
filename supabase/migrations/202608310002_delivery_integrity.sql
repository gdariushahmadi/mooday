-- Public beta hardening.
--
-- This migration keeps the demo checkout local while making the future
-- order, payment, social, moderation, and saved-item boundaries safe.

begin;

-- ---------- public visibility ----------

alter table public.listings
  add column if not exists approved_at timestamptz;

drop policy if exists "listings_select_visible" on public.listings;
create policy "listings_select_visible" on public.listings
for select to anon, authenticated
using (
  (status = 'active' and approved_at is not null)
  or (select auth.uid()) = seller_id
);

drop policy if exists "listing_images_select_visible" on public.listing_images;
create policy "listing_images_select_visible" on public.listing_images
for select to anon, authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and (
        (l.status = 'active' and l.approved_at is not null)
        or l.seller_id = (select auth.uid())
      )
  )
);

drop policy if exists "listing_media_select_visible" on storage.objects;
create policy "listing_media_select_visible"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'listing-media'
  and exists (
    select 1
    from public.listings l
    where l.id::text = split_part(name, '/', 2)
      and (
        (l.status = 'active' and l.approved_at is not null)
        or l.seller_id = (select auth.uid())
      )
  )
);

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
left join public.profiles private_profile on private_profile.id = p.seller_id
left join (
  select seller_id, count(*)::bigint as listings_count
  from public.listings
  where status = 'active' and approved_at is not null
  group by seller_id
) lc on lc.seller_id = p.seller_id
where coalesce(private_profile.is_suspended, false) = false;

grant select on public.seller_card_view to anon, authenticated;

-- ---------- reusable moderation helpers ----------

create or replace function public.is_suspended(check_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_suspended from public.profiles where id = check_uid),
    false
  );
$$;

revoke all on function public.is_suspended(uuid) from public, anon;
grant execute on function public.is_suspended(uuid) to anon, authenticated;

create or replace function public.is_service_role()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

revoke all on function public.is_service_role() from public, anon, authenticated;

create or replace function public.users_blocked(first_user uuid, second_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (
    public.is_service_role()
    or (
      auth.uid() is not null
      and auth.uid() in (first_user, second_user)
    )
  )
    and first_user is not null
    and second_user is not null
    and exists (
      select 1
      from public.blocked_users b
      where (b.blocker_id = first_user and b.blocked_id = second_user)
         or (b.blocker_id = second_user and b.blocked_id = first_user)
    );
$$;

revoke all on function public.users_blocked(uuid, uuid) from public, anon;
grant execute on function public.users_blocked(uuid, uuid) to anon, authenticated;

-- Keep direct profile reads consistent with the public seller view. The view
-- is the application path, but the base table must also protect direct REST
-- reads. Owners can still read their own profile for account settings.
drop policy if exists "public_seller_profiles_select_all" on public.public_seller_profiles;
create policy "public_seller_profiles_select_visible" on public.public_seller_profiles
for select to anon, authenticated
using (
  (
    not public.is_suspended(seller_id)
    and not public.users_blocked((select auth.uid()), seller_id)
  )
  or seller_id = (select auth.uid())
);

-- Public reads exclude sellers who are suspended after their listing was
-- approved. Owners can still see their own records for account recovery.
drop policy if exists "listings_select_visible" on public.listings;
create policy "listings_select_visible" on public.listings
for select to anon, authenticated
using (
  (
    status = 'active'
    and approved_at is not null
    and not public.is_suspended(seller_id)
    and not public.users_blocked((select auth.uid()), seller_id)
  )
  or (select auth.uid()) = seller_id
);

drop policy if exists "listing_images_select_visible" on public.listing_images;
create policy "listing_images_select_visible" on public.listing_images
for select to anon, authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and (
        (
          l.status = 'active'
          and l.approved_at is not null
          and not public.is_suspended(l.seller_id)
          and not public.users_blocked((select auth.uid()), l.seller_id)
        )
        or l.seller_id = (select auth.uid())
      )
  )
);

drop policy if exists "listing_media_select_visible" on storage.objects;
create policy "listing_media_select_visible"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'listing-media'
  and exists (
    select 1
    from public.listings l
    where l.id::text = split_part(name, '/', 2)
      and (
        (
          l.status = 'active'
          and l.approved_at is not null
          and not public.is_suspended(l.seller_id)
          and not public.users_blocked((select auth.uid()), l.seller_id)
        )
        or l.seller_id = (select auth.uid())
      )
  )
);

-- A suspended seller may keep and remove old media, but cannot add new media
-- to a listing. The listing must still belong to the caller. The same rule
-- applies to listing metadata and Storage objects.
drop policy if exists "listing_images_insert_own" on public.listing_images;
create policy "listing_images_insert_own" on public.listing_images
for insert to authenticated
with check (
  not public.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and l.seller_id = (select auth.uid())
  )
);

drop policy if exists "listing_images_update_own" on public.listing_images;
create policy "listing_images_update_own" on public.listing_images
for update to authenticated
using (exists (
  select 1
  from public.listings l
  where l.id = listing_images.listing_id
    and l.seller_id = (select auth.uid())
))
with check (
  not public.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and l.seller_id = (select auth.uid())
  )
);

drop policy if exists "listing_media_insert_own" on storage.objects;
create policy "listing_media_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-media'
  and not public.is_suspended((select auth.uid()))
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1
    from public.listings l
    where l.id::text = split_part(name, '/', 2)
      and l.seller_id = (select auth.uid())
  )
);

drop policy if exists "listing_media_update_own" on storage.objects;
create policy "listing_media_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'listing-media'
  and not public.is_suspended((select auth.uid()))
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1
    from public.listings l
    where l.id::text = split_part(name, '/', 2)
      and l.seller_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'listing-media'
  and not public.is_suspended((select auth.uid()))
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1
    from public.listings l
    where l.id::text = split_part(name, '/', 2)
      and l.seller_id = (select auth.uid())
  )
);

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
  where status = 'active'
    and approved_at is not null
    and not public.is_suspended(seller_id)
  group by seller_id
) lc on lc.seller_id = p.seller_id
where not public.is_suspended(p.seller_id)
  and not public.users_blocked((select auth.uid()), p.seller_id);

alter view public.seller_card_view set (security_invoker = on);
grant select on public.seller_card_view to anon, authenticated;

create or replace function public.reject_suspended_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_service_role()
     and public.is_suspended(auth.uid()) then
    raise exception 'suspended accounts cannot create new records' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_suspended_write() from public, anon, authenticated;

drop trigger if exists listings_reject_suspended on public.listings;
create trigger listings_reject_suspended
before insert on public.listings
for each row execute function public.reject_suspended_write();

drop trigger if exists chat_threads_reject_suspended on public.chat_threads;
create trigger chat_threads_reject_suspended
before insert on public.chat_threads
for each row execute function public.reject_suspended_write();

drop trigger if exists chat_messages_reject_suspended on public.chat_messages;
create trigger chat_messages_reject_suspended
before insert on public.chat_messages
for each row execute function public.reject_suspended_write();

drop trigger if exists reviews_reject_suspended on public.seller_reviews;
create trigger reviews_reject_suspended
before insert on public.seller_reviews
for each row execute function public.reject_suspended_write();

drop trigger if exists orders_reject_suspended on public.orders;
create trigger orders_reject_suspended
before insert on public.orders
for each row execute function public.reject_suspended_write();

drop trigger if exists disputes_reject_suspended on public.disputes;
create trigger disputes_reject_suspended
before insert on public.disputes
for each row execute function public.reject_suspended_write();

drop trigger if exists reports_reject_suspended on public.reports;
create trigger reports_reject_suspended
before insert on public.reports
for each row execute function public.reject_suspended_write();

-- Seller trust values are moderation/server values. Profile editing may
-- update display fields, but never these three columns.
create or replace function public.protect_seller_trust_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_service_role()
     and not public.is_admin(auth.uid())
     and (
       new.is_verified is distinct from old.is_verified
       or new.response_rate is distinct from old.response_rate
       or new.response_time_hours is distinct from old.response_time_hours
     ) then
    raise exception 'seller trust fields are server controlled' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_seller_trust_fields() from public, anon, authenticated;
drop trigger if exists public_seller_profiles_protect_trust on public.public_seller_profiles;
create trigger public_seller_profiles_protect_trust
before update on public.public_seller_profiles
for each row execute function public.protect_seller_trust_fields();

drop policy if exists "public_seller_profiles_insert_own" on public.public_seller_profiles;
create policy "public_seller_profiles_insert_own"
on public.public_seller_profiles
for insert to authenticated
with check (
  (select auth.uid()) = seller_id
  and is_verified = false
  and response_rate is null
  and response_time_hours is null
);

-- Owners may not approve their own listing or change approval metadata.
create or replace function public.protect_listing_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_service_role()
     and not public.is_admin(auth.uid())
     and new.approved_at is distinct from old.approved_at then
    raise exception 'listing approval is moderator controlled' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_listing_approval() from public, anon, authenticated;
drop trigger if exists listings_protect_approval on public.listings;
create trigger listings_protect_approval
before update on public.listings
for each row execute function public.protect_listing_approval();

drop policy if exists "listings_insert_own" on public.listings;
create policy "listings_insert_own" on public.listings
for insert to authenticated
with check (
  (select auth.uid()) = seller_id
  and approved_at is null
  and not public.is_suspended((select auth.uid()))
);

-- ---------- saved items ----------

create table if not exists public.saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, listing_id)
);

create index if not exists saved_items_user_recent_idx
  on public.saved_items(user_id, created_at desc);

alter table public.saved_items enable row level security;
revoke all on table public.saved_items from anon;
grant select, insert, delete on table public.saved_items to authenticated;

drop policy if exists "saved_items_select_own" on public.saved_items;
create policy "saved_items_select_own" on public.saved_items
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "saved_items_insert_own" on public.saved_items;
create policy "saved_items_insert_own" on public.saved_items
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and not public.is_suspended((select auth.uid()))
  and exists (
    select 1 from public.listings l
    where l.id = saved_items.listing_id
      and l.status = 'active'
      and l.approved_at is not null
      and not public.is_suspended(l.seller_id)
      and not public.users_blocked((select auth.uid()), l.seller_id)
  )
);

drop policy if exists "saved_items_delete_own" on public.saved_items;
create policy "saved_items_delete_own" on public.saved_items
for delete to authenticated
using ((select auth.uid()) = user_id);

-- Personal lists must not reveal a listing from a blocked or suspended
-- seller. The owner can still remove stale rows through the delete policy.
drop policy if exists "user_listing_likes_select_own" on public.user_listing_likes;
create policy "user_listing_likes_select_own"
on public.user_listing_likes
for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.listings l
    where l.id = user_listing_likes.listing_id
      and l.status = 'active'
      and l.approved_at is not null
      and not public.is_suspended(l.seller_id)
      and not public.users_blocked((select auth.uid()), l.seller_id)
  )
);

drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own"
on public.cart_items
for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.listings l
    where l.id = cart_items.listing_id
      and l.status = 'active'
      and l.approved_at is not null
      and not public.is_suspended(l.seller_id)
      and not public.users_blocked((select auth.uid()), l.seller_id)
  )
);

drop policy if exists "saved_items_select_own" on public.saved_items;
create policy "saved_items_select_own"
on public.saved_items
for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.listings l
    where l.id = saved_items.listing_id
      and l.status = 'active'
      and l.approved_at is not null
      and not public.is_suspended(l.seller_id)
      and not public.users_blocked((select auth.uid()), l.seller_id)
  )
);

-- ---------- single-listing cart boundary ----------

-- The public beta has one listing and quantity one per checkout. Keep this
-- invariant in the database as well as in the UI. Existing rows are reduced
-- before the stricter check is added.
update public.cart_items
set quantity = 1
where quantity <> 1;

-- Remove stale duplicate listings before enforcing one cart row per user.
-- Cart contents are not orders and have no financial history. Keep the most
-- recently updated row so the public beta starts from one deterministic item.
with ranked_cart_items as (
  select
    id,
    row_number() over (
      partition by user_id
      order by updated_at desc, added_at desc, id desc
    ) as row_number
  from public.cart_items
)
delete from public.cart_items c
using ranked_cart_items r
where c.id = r.id
  and r.row_number > 1;

create unique index if not exists cart_items_one_listing_per_user_idx
  on public.cart_items(user_id);

alter table public.cart_items
  drop constraint if exists cart_items_quantity_check;
alter table public.cart_items
  add constraint cart_items_quantity_one_check check (quantity = 1);

drop policy if exists "user_listing_likes_insert_own" on public.user_listing_likes;
create policy "user_listing_likes_insert_own"
on public.user_listing_likes
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and not public.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.listings l
    where l.id = user_listing_likes.listing_id
      and l.status = 'active'
      and l.approved_at is not null
      and not public.is_suspended(l.seller_id)
      and not public.users_blocked((select auth.uid()), l.seller_id)
  )
);

revoke insert, update on table public.cart_items from authenticated;

create or replace function public.cart_items_increment(
  target_listing_id uuid,
  delta integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  -- Serialize concurrent cart operations for this user. This prevents two
  -- simultaneous requests from both passing the one-listing check.
  perform pg_advisory_xact_lock(
    hashtextextended(caller_id::text, 0)
  );
  if delta <> 1 then
    raise exception 'the public beta cart accepts quantity one only' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.cart_items c
    where c.user_id = caller_id
      and c.listing_id <> target_listing_id
  ) then
    raise exception 'only one listing can be in the cart' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
    from public.listings l
    where l.id = target_listing_id
      and l.status = 'active'
      and l.approved_at is not null
      and not public.is_suspended(l.seller_id)
      and not public.is_suspended(caller_id)
      and not public.users_blocked(caller_id, l.seller_id)
  ) then
    raise exception 'listing is not available' using errcode = 'P0002';
  end if;

  insert into public.cart_items (user_id, listing_id, quantity)
  values (caller_id, target_listing_id, 1)
  on conflict (user_id, listing_id) do update
    set quantity = 1,
        updated_at = timezone('utc', now());
end;
$$;

revoke all on function public.cart_items_increment(uuid, integer)
  from public, anon;
grant execute on function public.cart_items_increment(uuid, integer)
  to authenticated;

-- ---------- order ledger and atomic single-listing order ----------

alter table public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_intent_id text,
  add column if not exists paid_at timestamptz;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default timezone('utc', now())
);

revoke all on table public.stripe_webhook_events from anon, authenticated;
grant insert on table public.stripe_webhook_events to service_role;

update public.orders
set payment_status = case
  when status in ('paid', 'shipped', 'delivered', 'returned') then 'succeeded'
  when status = 'cancelled' then 'failed'
  else 'pending'
end
where payment_status = 'pending';

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending', 'succeeded', 'failed', 'refunded'));

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending_payment', 'paid', 'shipped', 'delivered', 'returned', 'cancelled'));

revoke insert, update on table public.orders from authenticated;
revoke insert on table public.order_items from authenticated;

drop policy if exists "orders_insert_as_buyer" on public.orders;
drop policy if exists "orders_update_participants" on public.orders;
drop policy if exists "order_items_insert_as_buyer" on public.order_items;

drop policy if exists "orders_select_participants" on public.orders;
create policy "orders_select_participants" on public.orders
for select to authenticated
using (
  (
    ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id)
    and not public.users_blocked(buyer_id, seller_id)
  )
);

-- The public RPC is the only client entry point for a financial order. The
-- search function is also forced to return public, approved listings even
-- when an authenticated caller submits a different status filter.
create or replace function public.search_listings(
  query text,
  filters jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  seller_id uuid,
  title_en text,
  title_ar text,
  description_en text,
  description_ar text,
  price_minor bigint,
  original_price_minor bigint,
  currency text,
  condition_en text,
  condition_ar text,
  category text,
  size text,
  color_en text,
  color_ar text,
  mode text,
  status text,
  is_authentic boolean,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_category text := nullif(filters ->> 'category', '');
  v_price_min bigint := nullif(filters ->> 'price_min', '')::bigint;
  v_price_max bigint := nullif(filters ->> 'price_max', '')::bigint;
  v_limit_count int := least(greatest(coalesce(nullif(filters ->> 'limit', '')::int, 50), 1), 100);
  v_offset_count int := greatest(coalesce(nullif(filters ->> 'offset', '')::int, 0), 0);
  v_tsquery tsquery := websearch_to_tsquery('simple', coalesce(query, ''));
  v_has_query boolean := v_tsquery::text <> '';
begin
  return query
    select
      l.id,
      l.seller_id,
      l.title_en,
      l.title_ar,
      l.description_en,
      l.description_ar,
      l.price_minor,
      l.original_price_minor,
      l.currency,
      l.condition_en,
      l.condition_ar,
      l.category,
      l.size,
      l.color_en,
      l.color_ar,
      l.mode,
      l.status,
      l.is_authentic,
      l.published_at,
      l.created_at,
      l.updated_at,
      case
        when not v_has_query then 0.0::real
        else ts_rank(
          to_tsvector(
            'simple',
            coalesce(l.title_en, '') || ' ' ||
            coalesce(l.title_ar, '') || ' ' ||
            coalesce(l.description_en, '') || ' ' ||
            coalesce(l.description_ar, '')
          ),
          v_tsquery
        )::real
      end as rank
    from public.listings l
    where l.status = 'active'
      and l.approved_at is not null
      and not public.is_suspended(l.seller_id)
      and not public.users_blocked((select auth.uid()), l.seller_id)
      and (v_category is null or l.category = v_category)
      and (v_price_min is null or l.price_minor >= v_price_min)
      and (v_price_max is null or l.price_minor <= v_price_max)
      and (
        not v_has_query
        or to_tsvector(
          'simple',
          coalesce(l.title_en, '') || ' ' ||
          coalesce(l.title_ar, '') || ' ' ||
          coalesce(l.description_en, '') || ' ' ||
          coalesce(l.description_ar, '')
        ) @@ v_tsquery
      )
    order by
      case when not v_has_query then 0.0::real
        else ts_rank(
          to_tsvector(
            'simple',
            coalesce(l.title_en, '') || ' ' ||
            coalesce(l.title_ar, '') || ' ' ||
            coalesce(l.description_en, '') || ' ' ||
            coalesce(l.description_ar, '')
          ),
          v_tsquery
        )::real
      end desc,
      l.created_at desc
    limit v_limit_count offset v_offset_count;
end;
$$;

grant execute on function public.search_listings(text, jsonb) to anon, authenticated;

drop policy if exists "order_items_select_participants" on public.order_items;
create policy "order_items_select_participants" on public.order_items
for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_items.order_id
    and (
      o.buyer_id = (select auth.uid())
      or o.seller_id = (select auth.uid())
    )
    and not public.users_blocked(o.buyer_id, o.seller_id)
  ));

create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'pending_payment' and new.status = 'paid' then
    if not public.is_service_role() then
      raise exception 'only the payment server may confirm payment' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status = 'pending_payment' and new.status = 'cancelled' then
    if caller <> old.buyer_id and not public.is_service_role() then
      raise exception 'only the buyer may cancel an unpaid order' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status = 'paid' and new.status = 'shipped' then
    if caller <> old.seller_id and not public.is_service_role() then
      raise exception 'only the seller may ship an order' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status = 'paid' and new.status = 'cancelled' then
    if caller <> old.buyer_id and not public.is_service_role() then
      raise exception 'only the buyer may cancel an order' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status = 'shipped' and new.status = 'delivered' then
    if caller not in (old.buyer_id, old.seller_id)
       and not public.is_service_role() then
      raise exception 'only a participant may confirm delivery' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status in ('shipped', 'delivered') and new.status = 'returned' then
    if caller <> old.buyer_id and not public.is_service_role() then
      raise exception 'only the buyer may request a return' using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'illegal order status transition: % -> %', old.status, new.status
    using errcode = 'P0001';
end;
$$;

drop trigger if exists orders_enforce_status_transition on public.orders;
create trigger orders_enforce_status_transition
before update of status on public.orders
for each row execute function public.enforce_order_status_transition();

create or replace function public.protect_order_financial_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_service_role()
     and (
       new.buyer_id is distinct from old.buyer_id
       or new.seller_id is distinct from old.seller_id
       or new.shipping_address is distinct from old.shipping_address
       or new.currency is distinct from old.currency
       or new.items_subtotal_minor is distinct from old.items_subtotal_minor
       or new.shipping_fee_minor is distinct from old.shipping_fee_minor
       or new.total_minor is distinct from old.total_minor
       or new.payment_method is distinct from old.payment_method
       or new.payment_brand_en is distinct from old.payment_brand_en
       or new.payment_brand_ar is distinct from old.payment_brand_ar
       or new.payment_last4 is distinct from old.payment_last4
       or (
         new.payment_status is distinct from old.payment_status
         and not (
           new.status = 'cancelled'
           and old.status in ('pending_payment', 'paid')
           and old.buyer_id = auth.uid()
           and new.payment_status = case
             when old.payment_status = 'succeeded' then 'succeeded'
             else 'failed'
           end
         )
       )
       or new.payment_intent_id is distinct from old.payment_intent_id
       or new.paid_at is distinct from old.paid_at
     ) then
    raise exception 'order financial fields are server controlled' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_order_financial_fields() from public, anon, authenticated;
drop trigger if exists orders_protect_financial_fields on public.orders;
create trigger orders_protect_financial_fields
before update on public.orders
for each row execute function public.protect_order_financial_fields();

create or replace function public.create_single_listing_order(
  target_listing_id uuid,
  target_address_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  buyer uuid := auth.uid();
  listing_row public.listings;
  address_row public.addresses;
  order_row public.orders;
  shipping_minor bigint;
begin
  if buyer is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if public.is_suspended(buyer) then
    raise exception 'suspended accounts cannot place orders' using errcode = '42501';
  end if;

  select * into address_row
  from public.addresses
  where id = target_address_id and user_id = buyer;
  if not found then
    raise exception 'address not found' using errcode = 'P0002';
  end if;

  select * into listing_row
  from public.listings
  where id = target_listing_id
    and status = 'active'
    and approved_at is not null
    and not public.is_suspended(seller_id)
  for update;
  if not found then
    raise exception 'listing is not available' using errcode = 'P0002';
  end if;
  if listing_row.seller_id = buyer then
    raise exception 'you cannot buy your own listing' using errcode = '42501';
  end if;
  if public.users_blocked(buyer, listing_row.seller_id) then
    raise exception 'this user is blocked' using errcode = '42501';
  end if;

  shipping_minor := case when listing_row.price_minor > 100000 then 0 else 2500 end;

  insert into public.orders (
    buyer_id,
    seller_id,
    status,
    payment_status,
    shipping_address,
    currency,
    items_subtotal_minor,
    shipping_fee_minor,
    total_minor,
    payment_method,
    payment_brand_en,
    payment_brand_ar,
    payment_last4
  ) values (
    buyer,
    listing_row.seller_id,
    'pending_payment',
    'pending',
    jsonb_build_object(
      'labelEn', address_row.label_en,
      'labelAr', address_row.label_ar,
      'fullNameEn', address_row.full_name_en,
      'fullNameAr', address_row.full_name_ar,
      'phone', address_row.phone,
      'cityEn', address_row.city_en,
      'cityAr', address_row.city_ar,
      'districtEn', address_row.district_en,
      'districtAr', address_row.district_ar,
      'streetEn', address_row.street_en,
      'streetAr', address_row.street_ar,
      'notesEn', address_row.notes_en,
      'notesAr', address_row.notes_ar
    ),
    'AED',
    listing_row.price_minor,
    shipping_minor,
    listing_row.price_minor + shipping_minor,
    null,
    null,
    null,
    null
  ) returning * into order_row;

  insert into public.order_items (
    order_id,
    listing_id,
    title_en_at_purchase,
    title_ar_at_purchase,
    image_url_at_purchase,
    price_minor_at_purchase,
    quantity
  ) values (
    order_row.id,
    listing_row.id,
    listing_row.title_en,
    listing_row.title_ar,
    coalesce((
      select 'listing-media/' || li.storage_path
      from public.listing_images li
      where li.listing_id = listing_row.id
      order by li.sort_order
      limit 1
    ), ''),
    listing_row.price_minor,
    1
  );

  update public.listings
  set status = 'reserved'
  where id = listing_row.id and status = 'active';

  return order_row;
end;
$$;

revoke all on function public.create_single_listing_order(uuid, uuid) from public, anon;
grant execute on function public.create_single_listing_order(uuid, uuid) to authenticated, service_role;

create or replace function public.mark_order_shipped(
  target_order_id uuid,
  courier_name_en_input text,
  courier_name_ar_input text,
  courier_tracking_input text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'shipped',
      courier_name_en = left(courier_name_en_input, 120),
      courier_name_ar = left(courier_name_ar_input, 120),
      courier_tracking = left(courier_tracking_input, 120)
  where id = target_order_id
    and seller_id = auth.uid()
    and status = 'paid';
  if not found then raise exception 'order cannot be shipped' using errcode = '42501'; end if;
end;
$$;

create or replace function public.mark_order_delivered(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'delivered'
  where id = target_order_id
    and (buyer_id = auth.uid() or seller_id = auth.uid())
    and status = 'shipped';
  if not found then raise exception 'order cannot be marked delivered' using errcode = '42501'; end if;
end;
$$;

create or replace function public.cancel_order(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'cancelled', payment_status = case when payment_status = 'succeeded' then payment_status else 'failed' end
  where id = target_order_id
    and buyer_id = auth.uid()
    and status in ('pending_payment', 'paid');
  if not found then raise exception 'order cannot be cancelled' using errcode = '42501'; end if;
  update public.listings l
  set status = 'active'
  where l.status = 'reserved'
    and exists (select 1 from public.order_items oi where oi.order_id = target_order_id and oi.listing_id = l.id);
end;
$$;

create or replace function public.request_order_return(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.disputes d
    where d.order_id = target_order_id and d.buyer_id = auth.uid()
  ) then
    raise exception 'a dispute is required before requesting a return' using errcode = '42501';
  end if;
  update public.orders
  set status = 'returned'
  where id = target_order_id
    and buyer_id = auth.uid()
    and status in ('shipped', 'delivered');
  if not found then raise exception 'order cannot be returned' using errcode = '42501'; end if;
end;
$$;

revoke all on function public.mark_order_shipped(uuid, text, text, text) from public, anon;
revoke all on function public.mark_order_delivered(uuid) from public, anon;
revoke all on function public.cancel_order(uuid) from public, anon;
revoke all on function public.request_order_return(uuid) from public, anon;
grant execute on function public.mark_order_shipped(uuid, text, text, text) to authenticated;
grant execute on function public.mark_order_delivered(uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.request_order_return(uuid) to authenticated;

-- ---------- chat and social integrity ----------

create or replace function public.validate_chat_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_seller uuid;
begin
  if new.buyer_id = new.seller_id or new.listing_id is null then
    raise exception 'a chat must reference one real listing and two users' using errcode = '22023';
  end if;
  if auth.uid() is not null
     and not public.is_service_role()
     and auth.uid() <> new.buyer_id then
    raise exception 'only the buyer may start a chat' using errcode = '42501';
  end if;
  if auth.uid() is not null and auth.uid() not in (new.buyer_id, new.seller_id) then
    raise exception 'chat participant mismatch' using errcode = '42501';
  end if;
  select seller_id into listing_seller
  from public.listings
  where id = new.listing_id
    and status = 'active'
    and approved_at is not null
    and not public.is_suspended(seller_id);
  if listing_seller is null or listing_seller <> new.seller_id then
    raise exception 'listing and seller do not match' using errcode = '23514';
  end if;
  if public.users_blocked(new.buyer_id, new.seller_id) then
    raise exception 'this user is blocked' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_chat_thread() from public, anon, authenticated;
drop trigger if exists chat_threads_validate on public.chat_threads;
create trigger chat_threads_validate
before insert on public.chat_threads
for each row execute function public.validate_chat_thread();

drop policy if exists "chat_threads_select_participants" on public.chat_threads;
create policy "chat_threads_select_participants" on public.chat_threads
for select to authenticated
using (
  (auth.uid() = buyer_id or auth.uid() = seller_id)
  and not public.users_blocked(buyer_id, seller_id)
);

drop policy if exists "chat_threads_insert_as_participant" on public.chat_threads;
create policy "chat_threads_insert_as_participant" on public.chat_threads
for insert to authenticated
with check (
  auth.uid() = buyer_id
  and not public.is_suspended(auth.uid())
  and not public.users_blocked(buyer_id, seller_id)
);

drop policy if exists "chat_threads_update_as_participant" on public.chat_threads;
revoke update on public.chat_threads from authenticated;
grant update (last_message_body, last_message_at)
  on public.chat_threads to authenticated;
create policy "chat_threads_update_as_participant" on public.chat_threads
for update to authenticated
using (
  (auth.uid() = buyer_id or auth.uid() = seller_id)
  and not public.users_blocked(buyer_id, seller_id)
)
with check (
  (auth.uid() = buyer_id or auth.uid() = seller_id)
  and not public.users_blocked(buyer_id, seller_id)
);

drop policy if exists "chat_messages_select_participants" on public.chat_messages;
create policy "chat_messages_select_participants" on public.chat_messages
for select to authenticated
using (exists (
  select 1 from public.chat_threads t
  where t.id = chat_messages.thread_id
    and (auth.uid() = t.buyer_id or auth.uid() = t.seller_id)
    and not public.users_blocked(t.buyer_id, t.seller_id)
));

drop policy if exists "chat_messages_insert_as_participant" on public.chat_messages;
create policy "chat_messages_insert_as_participant" on public.chat_messages
for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.chat_threads t
    where t.id = chat_messages.thread_id
      and auth.uid() in (t.buyer_id, t.seller_id)
      and not public.users_blocked(t.buyer_id, t.seller_id)
  )
);

create or replace function public.validate_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  thread_row public.chat_threads;
begin
  select * into thread_row
  from public.chat_threads
  where id = new.thread_id;
  if not found then
    raise exception 'chat thread not found' using errcode = 'P0002';
  end if;
  if auth.uid() is not null and not public.is_service_role()
     and (new.sender_id <> auth.uid()
       or auth.uid() not in (thread_row.buyer_id, thread_row.seller_id)) then
    raise exception 'chat sender mismatch' using errcode = '42501';
  end if;
  if public.users_blocked(thread_row.buyer_id, thread_row.seller_id) then
    raise exception 'this user is blocked' using errcode = '42501';
  end if;
  if char_length(coalesce(new.body, '')) > 5000 then
    raise exception 'chat message is too long' using errcode = '22001';
  end if;
  if new.type = 'offer' and (new.offer_minor is null or new.offer_minor < 0) then
    raise exception 'an offer requires a valid amount' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_chat_message() from public, anon, authenticated;
drop trigger if exists chat_messages_validate on public.chat_messages;
create trigger chat_messages_validate
before insert on public.chat_messages
for each row execute function public.validate_chat_message();

create or replace function public.protect_chat_message_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  recipient_ok boolean;
begin
  select caller in (t.buyer_id, t.seller_id) and caller <> old.sender_id
  into recipient_ok
  from public.chat_threads t
  where t.id = old.thread_id;
  if not coalesce(recipient_ok, false)
     or old.type <> 'offer'
     or old.offer_status <> 'pending'
     or new.thread_id is distinct from old.thread_id
     or new.sender_id is distinct from old.sender_id
     or new.type is distinct from old.type
     or new.body is distinct from old.body
     or new.image_url is distinct from old.image_url
     or new.offer_minor is distinct from old.offer_minor
     or new.id is distinct from old.id
     or new.thread_id is distinct from old.thread_id
     or new.created_at is distinct from old.created_at
     or new.offer_status is null
     or new.offer_status not in ('accepted', 'declined') then
    raise exception 'only the offer recipient may change offer status' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_chat_message_update() from public, anon, authenticated;
drop policy if exists "chat_messages_update_own_offer" on public.chat_messages;
revoke update on public.chat_messages from authenticated;
grant update (offer_status) on public.chat_messages to authenticated;
create policy "chat_messages_update_own_offer" on public.chat_messages
for update to authenticated
using (
  exists (
    select 1 from public.chat_threads t
    where t.id = chat_messages.thread_id
      and auth.uid() in (t.buyer_id, t.seller_id)
      and auth.uid() <> chat_messages.sender_id
      and not public.users_blocked(t.buyer_id, t.seller_id)
  )
)
with check (true);

drop trigger if exists chat_messages_protect_offer on public.chat_messages;
create trigger chat_messages_protect_offer
before update on public.chat_messages
for each row execute function public.protect_chat_message_update();

alter table public.seller_reviews
  add column if not exists listing_id uuid references public.listings(id) on delete set null;

drop policy if exists "seller_reviews_select_all" on public.seller_reviews;
drop policy if exists "seller_reviews_select_public" on public.seller_reviews;
create policy "seller_reviews_select_public" on public.seller_reviews
for select to anon
using (not public.is_suspended(seller_id));

drop policy if exists "seller_reviews_select_authenticated" on public.seller_reviews;
create policy "seller_reviews_select_authenticated" on public.seller_reviews
for select to authenticated
using (
  not public.is_suspended(seller_id)
  and not public.users_blocked(auth.uid(), seller_id)
);

drop policy if exists "seller_reviews_insert_as_buyer" on public.seller_reviews;
create policy "seller_reviews_insert_as_buyer" on public.seller_reviews
for insert to authenticated
with check (
  auth.uid() = buyer_id
  and order_id is not null
  and listing_id is not null
  and exists (
    select 1 from public.orders o
    where o.id = seller_reviews.order_id
      and o.buyer_id = auth.uid()
      and o.status in ('delivered', 'returned')
      and o.seller_id = seller_reviews.seller_id
      and not public.is_suspended(o.seller_id)
  )
);

create or replace function public.validate_seller_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() then
    return new;
  end if;
  if new.order_id is null or new.listing_id is null then
    raise exception 'a review requires an order and listing' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.id = new.order_id
      and o.buyer_id = auth.uid()
      and o.seller_id = new.seller_id
      and o.status in ('delivered', 'returned')
      and oi.listing_id = new.listing_id
      and not public.is_suspended(o.seller_id)
  ) then
    raise exception 'review does not match a delivered order' using errcode = '42501';
  end if;
  if public.users_blocked(auth.uid(), new.seller_id) then
    raise exception 'this user is blocked' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_seller_review() from public, anon, authenticated;
drop trigger if exists seller_reviews_validate on public.seller_reviews;
create trigger seller_reviews_validate
before insert on public.seller_reviews
for each row execute function public.validate_seller_review();

drop policy if exists "disputes_update_as_participant" on public.disputes;
revoke update on table public.disputes from authenticated;

drop policy if exists "reports_update_as_reporter" on public.reports;
revoke update on table public.reports from authenticated;

drop policy if exists "disputes_insert_as_buyer" on public.disputes;
create policy "disputes_insert_as_buyer" on public.disputes
for insert to authenticated
with check (
  auth.uid() = buyer_id
  and status = 'open'
  and char_length(reason) between 1 and 120
  and char_length(body) <= 5000
  and exists (
      select 1 from public.orders o
      where o.id = disputes.order_id
        and o.buyer_id = auth.uid()
        and o.status in ('shipped', 'delivered')
        and not public.users_blocked(o.buyer_id, o.seller_id)
  )
);

create or replace function public.validate_dispute_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_service_role() then
    if new.buyer_id <> auth.uid()
       or new.status <> 'open'
       or char_length(new.reason) not between 1 and 120
       or char_length(coalesce(new.body, '')) > 5000
       or not exists (
         select 1
         from public.orders o
         where o.id = new.order_id
           and o.buyer_id = auth.uid()
           and o.status in ('shipped', 'delivered')
           and not public.users_blocked(o.buyer_id, o.seller_id)
       ) then
      raise exception 'invalid dispute for this order' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_dispute_insert() from public, anon, authenticated;
drop trigger if exists disputes_validate_insert on public.disputes;
create trigger disputes_validate_insert
before insert on public.disputes
for each row execute function public.validate_dispute_insert();

drop policy if exists "disputes_select_participants" on public.disputes;
create policy "disputes_select_participants" on public.disputes
for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = disputes.order_id
    and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    and not public.users_blocked(o.buyer_id, o.seller_id)
));

create or replace function public.validate_report_target()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(coalesce(new.body, '')) > 2000 then
    raise exception 'report body is too long' using errcode = '22001';
  end if;
  if new.target_id is null or char_length(trim(coalesce(new.body, ''))) = 0 then
    raise exception 'report target and body are required' using errcode = '22023';
  end if;
  if auth.uid() is not null and not public.is_service_role()
     and exists (
       select 1
       from public.reports r
       where r.reporter_id = auth.uid()
         and r.created_at > timezone('utc', now()) - interval '10 minutes'
       group by r.reporter_id
       having count(*) >= 10
     ) then
    raise exception 'report rate limit exceeded' using errcode = '42900';
  end if;
  if new.target = 'listing' and not exists (select 1 from public.listings where id = new.target_id) then
    raise exception 'listing target not found' using errcode = 'P0002';
  end if;
  if new.target = 'user' and not exists (select 1 from auth.users where id = new.target_id) then
    raise exception 'user target not found' using errcode = 'P0002';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_report_target() from public, anon, authenticated;
drop trigger if exists reports_validate_target on public.reports;
create trigger reports_validate_target
before insert on public.reports
for each row execute function public.validate_report_target();

-- ---------- affiliate input validation and rate limit ----------

create or replace function public.validate_affiliate_click()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_service_role() then
    if new.user_id is distinct from auth.uid() then
      raise exception 'affiliate user does not match the session' using errcode = '42501';
    end if;
  elsif auth.uid() is null
        and not public.is_service_role()
        and new.user_id is not null then
    raise exception 'anonymous clicks cannot set a user id' using errcode = '42501';
  end if;
  new.clicked_at := timezone('utc', now());
  if new.short_id !~ '^[A-Za-z0-9]{4,16}$'
     or new.partner_code !~ '^[A-Za-z0-9_-]{1,64}$'
     or (new.anon_id is not null and new.anon_id !~ '^[A-Za-z0-9_-]{8,64}$')
     or char_length(coalesce(new.user_agent, '')) > 1000
     or char_length(coalesce(new.referer, '')) > 2048 then
    raise exception 'invalid affiliate click input' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.affiliate_links l
    where l.short_id = new.short_id
      and l.listing_id = new.listing_id
      and l.partner_code = new.partner_code
      and l.is_active
      and exists (
        select 1
        from public.listings listing
        where listing.id = l.listing_id
          and listing.status = 'active'
          and listing.approved_at is not null
          and not public.is_suspended(listing.seller_id)
          and not public.users_blocked((select auth.uid()), listing.seller_id)
      )
  ) then
    raise exception 'affiliate link is not active' using errcode = '22023';
  end if;
  if new.anon_id is not null and exists (
    select 1 from public.affiliate_clicks c
    where c.anon_id = new.anon_id
      and c.clicked_at > timezone('utc', now()) - interval '1 minute'
    group by c.anon_id
    having count(*) >= 20
  ) then
    raise exception 'affiliate click rate limit exceeded' using errcode = '42900';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_affiliate_click() from public, anon, authenticated;
drop trigger if exists affiliate_clicks_validate on public.affiliate_clicks;
create trigger affiliate_clicks_validate
before insert on public.affiliate_clicks
for each row execute function public.validate_affiliate_click();

commit;
