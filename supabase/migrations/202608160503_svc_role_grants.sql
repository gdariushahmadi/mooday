-- Phase 1: grants for service_role.
--
-- The service_role key is used by server-side admin code (webhook
-- route, admin actions, smoke tests) to bypass RLS. Without these
-- grants the service_role client gets `permission denied` on every
-- table after a `supabase db reset`.
--
-- This migration is idempotent and runs at the end of the chain so
-- every other table created earlier is included.

begin;

grant usage on schema public to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

grant execute on all functions in schema public to service_role;

commit;
