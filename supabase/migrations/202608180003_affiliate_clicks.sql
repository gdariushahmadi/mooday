-- Phase 5 (Monetization): click log for the /go/[shortId] redirect.
-- Inserts come from anon + authenticated (the redirect must work for
-- logged-out visitors). SELECT is admin-only because click logs can
-- fingerprint a visitor when joined with anon_id over time. user_id
-- is nullable and SET NULL on user delete (we keep the click history
-- for analytics; the user reference is informational).
begin;
create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  short_id text not null,
  listing_id uuid not null,
  partner_code text not null,
  user_id uuid references auth.users(id) on delete set null,
  anon_id text,
  user_agent text,
  referer text,
  clicked_at timestamptz not null default timezone('utc', now())
);
create index affiliate_clicks_clicked_at_idx on public.affiliate_clicks(clicked_at desc);
create index affiliate_clicks_partner_time_idx on public.affiliate_clicks(partner_code, clicked_at desc);
create index affiliate_clicks_listing_time_idx on public.affiliate_clicks(listing_id, clicked_at desc);
create index affiliate_clicks_user_idx on public.affiliate_clicks(user_id) where user_id is not null;
alter table public.affiliate_clicks enable row level security;
grant insert on table public.affiliate_clicks to anon, authenticated;
grant select on table public.affiliate_clicks to authenticated;
revoke update, delete on table public.affiliate_clicks from anon, authenticated;
create policy "affiliate_clicks_insert_anyone" on public.affiliate_clicks for insert to anon, authenticated with check (true);
create policy "affiliate_clicks_select_admin" on public.affiliate_clicks for select to authenticated using ((select is_admin from public.profiles p where p.id = auth.uid()));
commit;
