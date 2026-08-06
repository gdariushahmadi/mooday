-- Phase 4, slice M4: enrich seller_reviews with reviewer snapshot fields.
--
-- The UI's `Review` type carries reviewer name + avatar at render time.
-- Reading from `auth.users` would need a public projection (the buyer's
-- profile is private). Instead, we capture a snapshot at submission time
-- so the public profile screen can render the reviewer's display name
-- and avatar without a per-row join or a separate table.

begin;

alter table public.seller_reviews
  add column if not exists reviewer_name_en text not null default '',
  add column if not exists reviewer_name_ar text not null default '',
  add column if not exists reviewer_avatar text not null default '';

commit;
