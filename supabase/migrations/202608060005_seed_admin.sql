-- Phase 4, slice M4: seed an admin user.
--
-- The admin panel's Server Actions in `src/services/admin/actions.ts`
-- verify the caller's session against `profiles.is_admin`. This
-- migration promotes the pre-existing seed admin (`sarah.m@example.com`,
-- the same identity the mock service used) so the live admin panel
-- works once that user signs up via the app.
--
-- Production environments should grant admin via the Supabase dashboard
-- or a separate ops script; we don't ship the seed in `db reset`.

begin;

update public.profiles
set is_admin = true
where id in (
  select id from auth.users
  where email = 'sarah.m@example.com'
);

commit;
