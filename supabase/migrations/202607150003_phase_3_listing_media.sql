begin;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'listing-media',
  'listing-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "listing_media_select_visible"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'listing-media'
  and exists (
    select 1 from public.listings
    where listings.id::text = (storage.foldername(name))[2]
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
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.listings
    where listings.id::text = (storage.foldername(name))[2]
      and listings.seller_id = (select auth.uid())
  )
);

create policy "listing_media_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.listings
    where listings.id::text = (storage.foldername(name))[2]
      and listings.seller_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.listings
    where listings.id::text = (storage.foldername(name))[2]
      and listings.seller_id = (select auth.uid())
  )
);

create policy "listing_media_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.listings
    where listings.id::text = (storage.foldername(name))[2]
      and listings.seller_id = (select auth.uid())
  )
);

commit;
