// Wait! `auth.uid()` vs `(select auth.uid())` inside `using` and `with check`.
// In PostgreSQL RLS, if a policy uses a subquery it might be bypassed by superusers? No, we are authenticated.
// Could it be that the table `audit_log` does not have RLS enabled correctly, or that it is ignored?
// `alter table public.audit_log enable row level security;` is present.
// Could it be that `authenticated` role doesn't need to pass RLS? No, it does.
// Oh wait.
// `revoke all on table public.audit_log from anon, authenticated;`
// `grant select, insert on table public.audit_log to authenticated;`
// Did something change the owner of the table? The creator is `postgres` (superuser), `authenticated` is just a role.
