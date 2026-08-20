begin;

-- Repair: profile UPDATE policy + avatar upload pipeline.
--
-- Two long-standing issues shipped together because they share the same
-- row (`public.profiles.avatar_url`) and the same RLS surface:
--
--  1. `profiles_update_own_or_admin` (added by Phase 3.5) called
--     `(select is_admin from public.profiles p where p.id = auth.uid())`
--     inline. During an UPDATE on `public.profiles` Postgres re-evaluates
--     the policy on the row being modified, which means the subquery
--     reads from `public.profiles` *during the UPDATE itself*. The
--     subquery triggers the SELECT policy on `profiles`, which in turn
--     needs to verify the row visibility, and the only way to satisfy
--     that is to re-evaluate the policy that asked the question. The
--     recursion detector fires with PostgreSQL error 42P17
--     (`infinite_recursion`) and the user cannot save any profile edit.
--
--     The fix is to read `is_admin` through a `security definer`
--     function. Such functions execute with the privileges of the
--     function owner, bypassing RLS on the table they read; they
--     become a single, non-recursive subroutine the policy can call.
--
--  2. There was no upload pipeline for avatars. The edit-profile UI
--     could only pick from three preset URLs, and the storage bucket
--     for listing media is private and keyed by `{seller_id}/{listing_id}`
--     so it does not double as a profile-photo surface. This migration
--     adds a public-but-per-user `avatars` bucket keyed by
--     `{user_id}/avatar.{ext}` plus the matching RLS policies.

-- ---------- 1. RLS helper: public.is_admin() ----------

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

-- The function is invoked by RLS policies on behalf of `authenticated`
-- callers. Lock it down so only the role that needs it can execute it,
-- and revoke public access so the helper never leaks through the API.
revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

-- Replace the recursive UPDATE policy. The `auth.uid() = id` branch
-- keeps the original "owner can edit themselves" guarantee; the
-- `public.is_admin(auth.uid())` branch lets admins flip moderation
-- fields without spawning a recursive SELECT on `profiles`.
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

-- ---------- 2. Avatar storage bucket ----------

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read avatars (the bucket is public; the policy is here
-- for explicitness and to mirror the rest of the storage surface).
create policy "avatars_select_all"
on storage.objects for select to anon, authenticated
using (bucket_id = 'avatars');

-- A user may upload or replace their own avatar at the canonical
-- path `{user_id}/avatar.{ext}`. The leading path component is
-- compared to `auth.uid()` so users cannot impersonate each other by
-- writing into a foreign folder.
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
