// If profiles_select_own is ONLY for your own profile...
// Then an admin trying to query `select is_admin from profiles where id = ...` for ANOTHER user will get NOTHING.
// Because RLS prevents them from seeing the other user's profile.
// BUT the admin panel uses the **service-role** key.
// The service-role key BYPASSES RLS.
// Wait! The policies on audit_log and featured_listings and broadcast_notifications check:
//   `select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin`
// Since `p.id = auth.uid()` is querying YOUR OWN profile, `profiles_select_own` ALLOWS IT.
// So the RLS check SHOULD WORK.

// BUT wait... what if `auth.uid()` is null during the tests for some reason?
// No, the tests set `request.jwt.claims`.

// If it all works, then WHY did `insert into audit_log` SUCCEED for a non-admin user?
// Let's re-read the audit_log policy:
/*
create policy "audit_log_insert_admin"
on public.audit_log
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  )
);
*/

// If `is_admin` is false, `exists` is false.
// Therefore the policy evaluates to FALSE.
// If the policy evaluates to FALSE, the insert should fail with 42501.
// BUT the test says: `caught: no exception`
// Is there ANOTHER policy on `public.audit_log` that allows insert?
