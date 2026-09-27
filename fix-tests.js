// Wait! If the user can't select from public.profiles because `profiles_select_own` restricts it to `auth.uid() = id`, then `select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin` SHOULD work.
// But look at the `profiles` table select policy:
// `create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);`
// In Phase 3, this was actually UPDATED by `202607150004_phase_3_public_seller_profiles.sql` to:
// `create policy "profiles_select_public" on public.profiles for select to anon, authenticated using (true);`
// Ah!!! So ANY user can select ANY profile. That means `select is_admin` works perfectly fine.
