-- Phase 4, slice M4: payment methods (saved cards).
--
-- Tokenised cards live with the PSP in production; this table stores only
-- the metadata the UI needs (brand, last 4, expiry, holder). No PAN ever
-- reaches the database.

begin;

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label_en text not null default '',
  label_ar text not null default '',
  brand_en text not null check (brand_en in ('Visa', 'Mastercard', 'Amex', 'Apple Pay')),
  brand_ar text not null default '',
  last4 text not null check (length(last4) = 4),
  holder_en text not null default '',
  holder_ar text not null default '',
  expiry text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index payment_methods_owner_recent_idx
  on public.payment_methods(owner_id, created_at desc);

create unique index payment_methods_owner_default_idx
  on public.payment_methods(owner_id) where is_default;

alter table public.payment_methods enable row level security;

revoke all on table public.payment_methods from anon;
grant select, insert, update, delete on table public.payment_methods to authenticated;

create policy "payment_methods_select_own"
on public.payment_methods
for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "payment_methods_insert_own"
on public.payment_methods
for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "payment_methods_update_own"
on public.payment_methods
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "payment_methods_delete_own"
on public.payment_methods
for delete to authenticated
using ((select auth.uid()) = owner_id);

commit;
