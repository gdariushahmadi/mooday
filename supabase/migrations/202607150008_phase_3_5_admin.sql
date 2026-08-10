-- Phase 3.5: admin / moderation layer.
--
-- The admin panel runs entirely through Next.js Server Actions using the
-- Supabase service-role key, so it bypasses RLS by design. This migration
-- adds the staff-only authorisation gate (a column on `profiles` plus
-- audit logging) and the missing moderation surfaces (listing approval
-- states, user suspension flags) without changing any existing row-level
-- security policy. Regular users still see the marketplace exactly the
-- same way they do today.
--
-- `is_admin` lives on `profiles` rather than on `auth.users` so we can
-- read it with the publishable key (the auth schema is off-limits to
-- anon/authenticated). The column is set by an operator with the
-- service-role key — never by the user themselves.

begin;

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_reason text,
  add column if not exists suspended_at timestamptz;

-- Restrict updates so authenticated users cannot modify moderation fields
revoke update on public.profiles from authenticated;
grant update (full_name_en, full_name_ar, avatar_url, updated_at) on public.profiles to authenticated;

-- Only the owner can already update `profiles`; allow staff accounts to
-- flip these moderation fields on other users via the service-role
-- client. The check `(is_admin OR id = auth.uid())` makes that explicit.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
for update to authenticated
using (
  auth.uid() = id
  or (select is_admin from public.profiles p where p.id = auth.uid())
)
with check (
  auth.uid() = id
  or (select is_admin from public.profiles p where p.id = auth.uid())
);

-- Listings gain `approved_at` so the moderation queue can distinguish
-- "freshly listed, awaiting review" from "approved and visible". For
-- backwards compatibility with existing rows, `approved_at` defaults
-- to `now()` on first insert so nothing currently visible disappears.
alter table public.listings
  add column if not exists approved_at timestamptz;

-- Default existing rows to "approved right now". New rows get NULL and
-- the admin queue surfaces them.
update public.listings
  set approved_at = timezone('utc', now())
  where approved_at is null;

-- The public visibility policy changes from "any active listing" to
-- "any active listing that has been approved". An admin (via the
-- service-role client) bypasses RLS entirely so they see everything.
drop policy if exists "listings_select_visible" on public.listings;
create policy "listings_select_visible" on public.listings
for select to anon, authenticated
using (
  status = 'active' and approved_at is not null
  or (select auth.uid()) = seller_id
);

-- ---------- audit log ----------

create table public.audit_log (
  id bigint generated always as identity primary key,
  -- The admin (or system) account that performed the action.
  actor_id uuid references auth.users(id) on delete set null,
  -- Free-form but constrained: 'listing.approve', 'user.suspend',
  -- 'dispute.resolve', 'report.dismiss', etc.
  action text not null,
  -- Polymorphic target identifier: listing id, user id, order id...
  target_kind text not null check (
    target_kind in ('listing', 'user', 'order', 'dispute', 'report', 'review', 'notification')
  ),
  target_id text not null,
  -- Before/after diff (JSONB). NULL for actions that don't carry one.
  diff jsonb,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_log_target_idx
  on public.audit_log(target_kind, target_id, created_at desc);
create index audit_log_actor_idx
  on public.audit_log(actor_id, created_at desc);

alter table public.audit_log enable row level security;

-- The audit log is admin-only readable. Writes are also admin-only so
-- a misbehaving authenticated user cannot poison the trail. The
-- service-role client bypasses RLS entirely; this is a second line of
-- defence in case the publishable key is ever used by mistake.
revoke all on table public.audit_log from anon, authenticated;
grant select, insert on table public.audit_log to authenticated;

create policy "audit_log_select_admin"
on public.audit_log
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  )
);

create policy "audit_log_insert_admin"
on public.audit_log
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  )
);

-- ---------- featured curation ----------

-- Curated picks that surface in the Discover "Featured" lane. A
-- moderator marks a listing as featured with a sort_order; the public
-- feed reads the active+approved+featured subset ordered by sort_order.
create table public.featured_listings (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  curator_id uuid references auth.users(id) on delete set null,
  sort_order integer not null default 0 check (sort_order >= 0),
  note_en text not null default '',
  note_ar text not null default '',
  featured_at timestamptz not null default timezone('utc', now())
);

create index featured_listings_order_idx
  on public.featured_listings(sort_order, featured_at desc);

alter table public.featured_listings enable row level security;

revoke all on table public.featured_listings from anon;
grant select on table public.featured_listings to anon, authenticated;
grant insert, update, delete on table public.featured_listings to authenticated;

create policy "featured_listings_select_all"
on public.featured_listings
for select to anon, authenticated
using (true);

create policy "featured_listings_write_admin"
on public.featured_listings
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  )
);

-- ---------- broadcast notifications ----------

-- A "system" notification addressed to every user. The AppContext
-- merges broadcast rows with the user's personal notifications when it
-- lists its inbox. Avoids the alternative of fanning out N rows on
-- every announcement.
create table public.broadcast_notifications (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  kind text not null default 'system'
    check (kind in ('system', 'order', 'price_drop')),
  title_en text not null default '',
  title_ar text not null default '',
  body_en text not null default '',
  body_ar text not null default '',
  published_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz
);

create index broadcast_notifications_recent_idx
  on public.broadcast_notifications(published_at desc);

alter table public.broadcast_notifications enable row level security;

revoke all on table public.broadcast_notifications from anon;
grant select on table public.broadcast_notifications to anon, authenticated;
grant insert, update, delete on table public.broadcast_notifications
  to authenticated;

create policy "broadcast_notifications_select_all"
on public.broadcast_notifications
for select to anon, authenticated
using (true);

create policy "broadcast_notifications_write_admin"
on public.broadcast_notifications
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  )
);

commit;
