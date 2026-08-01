-- Phase 3, slice 4: user-scoped likes and cart.
--
-- Lives behind the same `marketplaceMode=supabase` flag as listings. In
-- mock mode the existing localStorage stories keep working; in supabase
-- mode these tables become the sole source of truth and the AppContext
-- reads and writes through them.
--
-- Both tables enforce owner-only RLS, idempotent mutations, and cascade
-- cleanup when a listing disappears. The cart quantity has a hard ceiling
-- because a real PDP must reject pathological "add 1000" inputs at the
-- schema level instead of waiting for the checkout step.

begin;

create table public.user_listing_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, listing_id)
);

create index user_listing_likes_user_recent_idx
  on public.user_listing_likes(user_id, created_at desc);
create index user_listing_likes_listing_idx
  on public.user_listing_likes(listing_id);

alter table public.user_listing_likes enable row level security;

revoke all on table public.user_listing_likes from anon;
grant select, insert, update, delete
  on table public.user_listing_likes to authenticated;

create policy "user_listing_likes_select_own"
on public.user_listing_likes
for select to authenticated
using ((select auth.uid()) = user_id);

-- `INSERT … ON CONFLICT DO NOTHING` is the natural idempotent "like".
-- We still enforce the owner check on insert so cross-user spoofing is
-- impossible even when the row already exists.
create policy "user_listing_likes_insert_own"
on public.user_listing_likes
for insert to authenticated
with check ((select auth.uid()) = user_id);

-- Liking never updates, but we revoke UPDATE to make the read-only-after-
-- insert intent explicit.
revoke update on table public.user_listing_likes from authenticated;

create policy "user_listing_likes_delete_own"
on public.user_listing_likes
for delete to authenticated
using ((select auth.uid()) = user_id);

-- ---------- cart ----------

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  quantity integer not null default 1
    check (quantity > 0 and quantity <= 99),
  added_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, listing_id)
);

create index cart_items_user_recent_idx
  on public.cart_items(user_id, added_at desc);

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;

revoke all on table public.cart_items from anon;
grant select, insert, update, delete on table public.cart_items to authenticated;

create policy "cart_items_select_own"
on public.cart_items
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "cart_items_insert_own"
on public.cart_items
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "cart_items_update_own"
on public.cart_items
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "cart_items_delete_own"
on public.cart_items
for delete to authenticated
using ((select auth.uid()) = user_id);

-- The cart quantises through a function so the adapter can issue a single
-- INSERT … ON CONFLICT and ask the database to increment atomically.
-- This avoids the classic read-modify-write race where two tabs both
-- add the same product at quantity 1 and the server ends up with two rows
-- (or a single row with quantity 1 because both rolled each other back).
create or replace function public.cart_items_increment(
  target_listing_id uuid,
  delta integer default 1
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if delta = 0 then
    return;
  end if;
  insert into public.cart_items (user_id, listing_id, quantity)
  values (current_user_id, target_listing_id, delta)
  on conflict (user_id, listing_id) do update
    set quantity = least(
      99,
      public.cart_items.quantity + excluded.quantity
    ),
    updated_at = timezone('utc', now());
end;
$$;

revoke all on function public.cart_items_increment(uuid, integer)
  from public, anon;
grant execute on function public.cart_items_increment(uuid, integer)
  to authenticated;

commit;
