-- Phase 5 (Monetization): per-listing affiliate links.
-- Each row is one partner-side URL attached to one mooday listing.
-- short_id is the public-facing 8-char base62 path segment used by
-- /go/[shortId]. ON DELETE CASCADE drops a listing's links when the
-- listing itself is removed (defense in depth: a partner's
-- RESTRICTed code keeps orphan partners from being deleted while
-- links reference them).
begin;
create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique,
  listing_id uuid not null references public.listings(id) on delete cascade,
  partner_code text not null references public.partners(code) on delete restrict,
  affiliate_url text not null check (length(affiliate_url) between 8 and 2048),
  display_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);
create index affiliate_links_listing_active_idx
  on public.affiliate_links(listing_id, is_active, display_order);
create unique index affiliate_links_short_id_unique
  on public.affiliate_links(short_id);
alter table public.affiliate_links enable row level security;
grant select on table public.affiliate_links to anon, authenticated;
revoke insert, update, delete on table public.affiliate_links from anon, authenticated;
create policy "affiliate_links_select_all" on public.affiliate_links for select to anon, authenticated using (true);
create policy "affiliate_links_insert_admin" on public.affiliate_links for insert to authenticated with check ((select is_admin from public.profiles p where p.id = auth.uid()));
create policy "affiliate_links_update_admin" on public.affiliate_links for update to authenticated using ((select is_admin from public.profiles p where p.id = auth.uid())) with check ((select is_admin from public.profiles p where p.id = auth.uid()));
create policy "affiliate_links_delete_admin" on public.affiliate_links for delete to authenticated using ((select is_admin from public.profiles p where p.id = auth.uid()));
commit;
grant insert, update, delete on table public.affiliate_links to authenticated;
