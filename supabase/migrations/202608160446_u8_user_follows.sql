-- Phase 1, slice U8: user follow graph.
--
-- A `user_follows` table that records follower -> followee relationships.
-- (follower_id, followee_id) is unique. RLS: anyone can see the entire
-- graph (public follower counts); only the follower can insert or delete
-- their own follow row.

begin;

create table public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followee_id),
  constraint user_follows_no_self_follow check (follower_id <> followee_id)
);

create index user_follows_followee_idx
  on public.user_follows(followee_id, created_at desc);
create index user_follows_follower_idx
  on public.user_follows(follower_id, created_at desc);

alter table public.user_follows enable row level security;

grant select on table public.user_follows to anon, authenticated;
grant insert, delete on table public.user_follows to authenticated;

create policy "user_follows_select_all"
on public.user_follows
for select to anon, authenticated
using (true);

create policy "user_follows_insert_own"
on public.user_follows
for insert to authenticated
with check ((select auth.uid()) = follower_id);

create policy "user_follows_delete_own"
on public.user_follows
for delete to authenticated
using ((select auth.uid()) = follower_id);

commit;
