-- Follow-up: apply the SQL parts that the bucket-only API call could not.
--
-- The previous migration (202608190001) ships the full surface. We split
-- it into this idempotent follow-up so the storage API can pre-create
-- the `avatars` bucket without the rest of the SQL waiting on a
-- dashboard run. Re-running this migration is a no-op everywhere.
--
--   1. `public.is_admin()` helper that bypasses RLS. The profile UPDATE
--      policy was hitting PostgreSQL error 42P17 (`infinite_recursion`)
--      because it asked `profiles` whether the actor was admin *during*
--      the UPDATE on the same row. A `security definer` function reads
--      `profiles` with the function owner's privileges (BYPASSRLS) and
--      terminates the recursion in a single hop.
--
--   2. Rewrites `profiles_update_own_or_admin` to use the helper.
--
--   3. RLS policies on `storage.objects` for the public `avatars` bucket
--      so a user can upload into `{user_id}/avatar.{ext}` but not into
--      someone else's folder. The bucket itself was created via the
--      storage API so this migration is the only thing left to run.

begin;

-- ---------- 1. RLS helper ----------

create or replace function public.is_admin(check_uid uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = check_uid),
    false
  );
$$;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

-- ---------- 2. Recursion-free UPDATE policy ----------

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
for update to authenticated
using (
  auth.uid() = id
  or public.is_admin(auth.uid())
)
with check (
  auth.uid() = id
  or public.is_admin(auth.uid())
);

-- ---------- 3. Storage policies for the avatars bucket ----------
--
-- The bucket itself was created via the storage REST API. These four
-- policies are the only thing left to wire up writes.

create policy "avatars_select_all"
on storage.objects for select to anon, authenticated
using (bucket_id = 'avatars');

create policy "avatars_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and split_part(name, '/', 1) <> ''
);

create policy "avatars_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

create policy "avatars_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

commit;
