// Ah! `profiles_select_own` on `public.profiles` ONLY allows you to select YOUR OWN profile!
// So: `select is_admin from public.profiles where p.id = (select auth.uid())` should work for yourself, because it's YOUR profile!
// But wait! Is there a problem?
// What if `auth.uid()` isn't typed correctly or something?
// Actually, `where p.id = (select auth.uid())` - `auth.uid()` returns `uuid`. `id` is `uuid`.
// What about `a non-admin user cannot write to the audit log`?
// The non-admin user has `is_admin = false`.
// So `exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)` should return FALSE.
// If it returns FALSE, the INSERT policy fails, and it should THROW 42501 (RLS violation).
// But the test reported `caught: no exception` !!
// This means the INSERT SUCCEEDED for the non-admin user!
// Why did the INSERT succeed?
