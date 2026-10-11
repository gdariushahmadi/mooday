begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated', 'authenticated', 'phase3-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase Three A"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated', 'authenticated', 'phase3-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase Three B"}', now(), now(), '', '', '', ''
  );

insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status
) values
  (
    'aaaaaaaa-3333-4333-8333-333333333331',
    '33333333-3333-4333-8333-333333333333',
    'A active', 'أ نشط', 12000, 'Excellent', 'ممتاز', 'Bags', 'active'
  ),
  (
    'aaaaaaaa-3333-4333-8333-333333333332',
    '33333333-3333-4333-8333-333333333333',
    'A draft', 'أ مسودة', 9000, 'Good', 'جيد', 'Bags', 'draft'
  ),
  (
    'bbbbbbbb-4444-4444-8444-444444444441',
    '44444444-4444-4444-8444-444444444444',
    'B active', 'ب نشط', 15000, 'Excellent', 'ممتاز', 'Shoes', 'active'
  ),
  (
    'bbbbbbbb-4444-4444-8444-444444444442',
    '44444444-4444-4444-8444-444444444444',
    'B draft', 'ب مسودة', 8000, 'Good', 'جيد', 'Shoes', 'draft'
  );

insert into public.listing_images (
  listing_id, storage_path, sort_order
) values
  ('aaaaaaaa-3333-4333-8333-333333333331', 'phase3/a-active.jpg', 0),
  ('aaaaaaaa-3333-4333-8333-333333333332', 'phase3/a-draft.jpg', 0),
  ('bbbbbbbb-4444-4444-8444-444444444442', 'phase3/b-draft.jpg', 0);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from public.listings),
  3::bigint,
  'user A sees own draft plus every active listing'
);

select is(
  (select count(*)::bigint from public.listings
    where id = 'bbbbbbbb-4444-4444-8444-444444444442'),
  0::bigint,
  'user A cannot read user B draft'
);

select throws_ok(
  $$insert into public.listings (
      seller_id, title_en, title_ar, price_minor,
      condition_en, condition_ar, category
    ) values (
      '44444444-4444-4444-8444-444444444444',
      'Spoofed', 'مزيف', 1000, 'Good', 'جيد', 'Bags'
    )$$,
  '42501', null,
  'user A cannot create a listing owned by user B'
);

select lives_ok(
  $$insert into public.listings (
      seller_id, title_en, title_ar, price_minor,
      condition_en, condition_ar, category
    ) values (
      '33333333-3333-4333-8333-333333333333',
      'A new draft', 'مسودة أ جديدة', 5000, 'Good', 'جيد', 'Bags'
    )$$,
  'user A can create an owned draft'
);

select is_empty(
  $$update public.listings set price_minor = 1
    where id = 'bbbbbbbb-4444-4444-8444-444444444441'
    returning 1$$,
  'user A cannot update user B active listing'
);

select lives_ok(
  $$update public.listings set price_minor = 11000
    where id = 'aaaaaaaa-3333-4333-8333-333333333331'$$,
  'user A can update an owned listing'
);

select is_empty(
  $$delete from public.listings
    where id = 'bbbbbbbb-4444-4444-8444-444444444441'
    returning 1$$,
  'user A cannot delete user B listing'
);

select lives_ok(
  $$insert into public.listing_images (listing_id, storage_path, sort_order)
    values (
      'aaaaaaaa-3333-4333-8333-333333333331',
      'phase3/a-active-second.jpg', 1
    )$$,
  'user A can add image metadata to an owned listing'
);

select throws_ok(
  $$insert into public.listing_images (listing_id, storage_path, sort_order)
    values (
      'bbbbbbbb-4444-4444-8444-444444444441',
      'phase3/b-active-spoof.jpg', 0
    )$$,
  '42501', null,
  'user A cannot add image metadata to user B listing'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::bigint from public.listings),
  2::bigint,
  'anonymous users can read active listings only'
);

select is(
  (select count(*)::bigint from public.listing_images),
  2::bigint,
  'anonymous users see images belonging to active listings only'
);

reset role;
select * from finish();
rollback;
