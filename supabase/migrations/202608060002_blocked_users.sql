-- Phase 4, slice M4: blocked users (privacy list).
--
-- RLS is blocker-scoped on both reads and writes. We deliberately do not
-- store the blocked user's full auth profile — only the fields the UI
-- renders in the Blocked Users list, captured at the moment of blocking.

begin;

create table public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  blocked_name_en text not null default '',
  blocked_name_ar text not null default '',
  blocked_avatar text not null default '',
  reason_en text,
  reason_ar text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (blocker_id, blocked_id)
);

create index blocked_users_blocker_recent_idx
  on public.blocked_users(blocker_id, created_at desc);

alter table public.blocked_users enable row level security;

revoke all on table public.blocked_users from anon;
grant select, insert, delete on table public.blocked_users to authenticated;

create policy "blocked_users_select_own"
on public.blocked_users
for select to authenticated
using ((select auth.uid()) = blocker_id);

create policy "blocked_users_insert_own"
on public.blocked_users
for insert to authenticated
with check ((select auth.uid()) = blocker_id);

create policy "blocked_users_delete_own"
on public.blocked_users
for delete to authenticated
using ((select auth.uid()) = blocker_id);

commit;
