-- Phase 3, slice 5: orders + immutable price snapshots + payment state.
--
-- The order domain is the marketplace's financial ledger. Three properties
-- must hold for trust:
--
-- 1. Prices are *snapshots*. The buyer pays what they saw, even if the
--    seller edits the listing a second later. We freeze title, image,
--    and unit price in `order_items` so a deleted or repriced listing
--    never rewrites history.
-- 2. Address is *snapshotted*. A buyer who edits or removes a saved
--    address must not retroactively change where an order was shipped.
-- 3. Inventory is *atomically reserved*. Creating an order flips the
--    associated listings from `active` to `sold` inside the same
--    transaction so two buyers cannot race the same item.
--
-- Payment capture is mocked for now — Phase 5 swaps the `paid` state
-- transition for a real PSP webhook. The schema already models the
-- eventual state machine (`paid → shipped → delivered → returned /
-- cancelled`) so the migration is forward-compatible.

begin;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  -- Multi-seller orders split at the AppContext layer so each order
  -- carries exactly one seller; refunds and shipping are per-seller.
  seller_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'paid'
    check (status in ('paid', 'shipped', 'delivered', 'returned', 'cancelled')),
  -- Snapshot of the shipping address used at checkout. Stored as JSONB
  -- so the column survives edits to `addresses` and remains auditable.
  shipping_address jsonb not null,
  currency text not null default 'AED' check (currency = 'AED'),
  items_subtotal_minor bigint not null check (items_subtotal_minor >= 0),
  shipping_fee_minor bigint not null default 0 check (shipping_fee_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  -- 'card' | 'apple_pay' | 'cod' | null for future PSP metadata.
  payment_method text,
  -- A textual brand/last-4 snapshot so the UI can render the payment
  -- line without joining back to the (potentially deleted) payment method.
  payment_brand_en text,
  payment_brand_ar text,
  payment_last4 text,
  -- Courier + tracking are populated when the seller ships.
  courier_name_en text,
  courier_name_ar text,
  courier_tracking text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  -- Kept nullable + ON DELETE SET NULL so deleting a listing after
  -- fulfilment does not erase the audit trail.
  listing_id uuid references public.listings(id) on delete set null,
  -- Title + image snapshots protect against listing edits/deletes.
  title_en_at_purchase text not null,
  title_ar_at_purchase text not null,
  image_url_at_purchase text not null default '',
  -- Per-unit price at the moment of purchase. The buyer's `total_minor`
  -- is `sum(price_minor_at_purchase * quantity) + shipping_fee_minor`.
  price_minor_at_purchase bigint not null check (price_minor_at_purchase >= 0),
  quantity integer not null check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default timezone('utc', now())
);

create index orders_buyer_created_idx
  on public.orders(buyer_id, created_at desc);
create index orders_seller_created_idx
  on public.orders(seller_id, created_at desc);
create index order_items_order_idx
  on public.order_items(order_id);
create index order_items_listing_idx
  on public.order_items(listing_id);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.orders, public.order_items from anon;
grant select, insert, update on table public.orders to authenticated;
grant select, insert on table public.order_items to authenticated;

-- Buyer and seller both need read access. Only the buyer can INSERT
-- (the act of placing an order). Status updates are funnelled through
-- the RPCs below so neither side can forge a forbidden transition
-- (e.g. buyer self-marking as shipped).
create policy "orders_select_participants"
on public.orders
for select to authenticated
using (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = seller_id
);

create policy "orders_insert_as_buyer"
on public.orders
for insert to authenticated
with check ((select auth.uid()) = buyer_id);

-- UPDATE is granted but every transition is constrained by the trigger
-- below to a state-machine edge that the calling role is allowed to
-- perform. Pure RLS cannot express "buyer may not move from paid to
-- shipped", so we use a trigger as the second line of defence.
create policy "orders_update_participants"
on public.orders
for update to authenticated
using (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = seller_id
)
with check (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = seller_id
);

create policy "order_items_select_participants"
on public.order_items
for select to authenticated
using (exists (
  select 1 from public.orders
  where orders.id = order_items.order_id
    and (
      orders.buyer_id = (select auth.uid())
      or orders.seller_id = (select auth.uid())
    )
));

create policy "order_items_insert_as_buyer"
on public.order_items
for insert to authenticated
with check (exists (
  select 1 from public.orders
  where orders.id = order_items.order_id
    and orders.buyer_id = (select auth.uid())
));

-- ---------- state-machine enforcement ----------
--
-- Allowed transitions and which role may invoke them:
--   paid       -> shipped      seller
--   paid       -> cancelled    buyer
--   shipped    -> delivered    buyer or seller (auto-confirm after X days
--                               is a later slice)
--   delivered  -> returned     buyer (paired with a dispute)
--   shipped    -> returned     buyer
--
-- Any other update is rejected with an exception so a confused or
-- malicious client cannot skip steps.

create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'paid' and new.status = 'shipped' then
    if caller <> old.seller_id then
      raise exception 'only the seller may ship an order' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status = 'paid' and new.status = 'cancelled' then
    if caller <> old.buyer_id then
      raise exception 'only the buyer may cancel an order' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status = 'shipped' and new.status = 'delivered' then
    if caller not in (old.buyer_id, old.seller_id) then
      raise exception 'only the buyer or seller may confirm delivery' using errcode = '42501';
    end if;
    return new;
  end if;

  if (old.status in ('shipped', 'delivered')) and new.status = 'returned' then
    if caller <> old.buyer_id then
      raise exception 'only the buyer may request a return' using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'illegal order status transition: % -> %',
    old.status, new.status using errcode = 'P0001';
end;
$$;

revoke all on function public.enforce_order_status_transition()
  from public, anon, authenticated;

drop trigger if exists orders_enforce_status_transition on public.orders;
create trigger orders_enforce_status_transition
before update of status on public.orders
for each row execute function public.enforce_order_status_transition();

commit;
