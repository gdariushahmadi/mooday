-- Fix listing-media RLS to use portable path parsing.
--
-- The original policy used `storage.foldername(name)[2]`, which works in
-- direct SQL but is not exposed through the PostgREST API (the
-- `storage` schema is not in `api.extra_search_path`). Path parsing via
-- `split_part` is portable and works through the RPC path. The
-- semantics are identical: `{seller_id}/{listing_id}/{filename}`.

begin;

drop policy if exists "listing_media_select_visible" on storage.objects;
drop policy if exists "listing_media_insert_own" on storage.objects;
drop policy if exists "listing_media_update_own" on storage.objects;
drop policy if exists "listing_media_delete_own" on storage.objects;

create policy "listing_media_select_visible"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'listing-media'
  and exists (
    select 1 from public.listings
    where listings.id::text = split_part(name, '/', 2)
      and (
        listings.status = 'active'
        or listings.seller_id = (select auth.uid())
      )
  )
);

create policy "listing_media_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1 from public.listings
    where listings.id::text = split_part(name, '/', 2)
      and listings.seller_id = (select auth.uid())
  )
);

create policy "listing_media_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'listing-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1 from public.listings
    where listings.id::text = split_part(name, '/', 2)
      and listings.seller_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'listing-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

create policy "listing_media_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

commit;
