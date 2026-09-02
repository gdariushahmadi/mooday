-- Server-side redirect and admin services use the service_role key.
-- Keep grants explicit for tables added after the global grant migration.
begin;

grant usage on schema public to service_role;
grant select, insert, update, delete
  on table public.partners, public.affiliate_links, public.affiliate_clicks
  to service_role;

commit;
