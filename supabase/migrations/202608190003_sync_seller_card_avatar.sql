-- Sync profile avatar into the public seller card.
--
-- `uploadAvatar` and `updateMine` only ever write to `profiles.avatar_url`,
-- but the public marketplace surfaces (product page, chat list, chat
-- overlay, public seller card) read `seller_card_view`, which is backed
-- by `public_seller_profiles.avatar_url`. The two columns diverged the
-- moment a user picked a new photo: their own profile header refreshed,
-- every other surface still rendered the old (or empty) URL.
--
-- The trigger below keeps the public projection in lock-step with the
-- private profile row. Any future write path that touches
-- `profiles.avatar_url` automatically propagates here, so we don't have
-- to remember to call both tables from the app.

begin;

create or replace function public.sync_seller_card_avatar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.public_seller_profiles
  set avatar_url = new.avatar_url
  where seller_id = new.id;
  return new;
end;
$$;

revoke all on function public.sync_seller_card_avatar() from public, anon, authenticated;

drop trigger if exists profiles_sync_seller_card_avatar on public.profiles;
create trigger profiles_sync_seller_card_avatar
after update of avatar_url on public.profiles
for each row execute function public.sync_seller_card_avatar();

-- Backfill: existing users whose public card is stale get the current
-- profile avatar on this migration. Without this, anyone who uploaded
-- a new avatar before the trigger landed still sees the old one in
-- marketplace surfaces until they re-save the profile.
update public.public_seller_profiles psp
set avatar_url = pr.avatar_url
from public.profiles pr
where pr.id = psp.seller_id
  and psp.avatar_url is distinct from pr.avatar_url;

commit;
