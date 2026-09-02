-- Anonymous-safe click log for the outbound redirect.
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

create index affiliate_clicks_clicked_at_idx
  on public.affiliate_clicks(clicked_at desc);
create index affiliate_clicks_partner_time_idx
  on public.affiliate_clicks(partner_code, clicked_at desc);
create index affiliate_clicks_listing_time_idx
  on public.affiliate_clicks(listing_id, clicked_at desc);
create index affiliate_clicks_user_idx
  on public.affiliate_clicks(user_id)
  where user_id is not null;

alter table public.affiliate_clicks enable row level security;
grant insert on table public.affiliate_clicks to anon, authenticated;
grant select on table public.affiliate_clicks to authenticated;
revoke update, delete on table public.affiliate_clicks from anon, authenticated;

create policy "affiliate_clicks_insert_anyone"
  on public.affiliate_clicks for insert to anon, authenticated
  with check (true);

create policy "affiliate_clicks_select_admin"
  on public.affiliate_clicks for select to authenticated
  using ((select is_admin from public.profiles p where p.id = auth.uid()));

commit;
