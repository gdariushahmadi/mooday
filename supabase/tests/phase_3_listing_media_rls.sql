begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated', 'authenticated', 'media-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666666',
    'authenticated', 'authenticated', 'media-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  );

insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status
) values
  (
    'aaaaaaaa-5555-4555-8555-555555555551',
    '55555555-5555-4555-8555-555555555555',
    'A active', 'أ نشط', 1000, 'Good', 'جيد', 'Bags', 'active'
  ),
  (
    'aaaaaaaa-5555-4555-8555-555555555552',
    '55555555-5555-4555-8555-555555555555',
    'A draft', 'أ مسودة', 1000, 'Good', 'جيد', 'Bags', 'draft'
  ),
  (
    'bbbbbbbb-6666-4666-8666-666666666661',
    '66666666-6666-4666-8666-666666666666',
    'B active', 'ب نشط', 1000, 'Good', 'جيد', 'Bags', 'active'
  ),
  (
    'bbbbbbbb-6666-4666-8666-666666666662',
    '66666666-6666-4666-8666-666666666666',
    'B draft', 'ب مسودة', 1000, 'Good', 'جيد', 'Bags', 'draft'
  );

insert into storage.objects (bucket_id, name, owner_id) values
  (
    'listing-media',
    '55555555-5555-4555-8555-555555555555/aaaaaaaa-5555-4555-8555-555555555551/active.jpg',
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    'listing-media',
    '55555555-5555-4555-8555-555555555555/aaaaaaaa-5555-4555-8555-555555555552/draft.jpg',
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    'listing-media',
    '66666666-6666-4666-8666-666666666666/bbbbbbbb-6666-4666-8666-666666666662/draft.jpg',
    '66666666-6666-4666-8666-666666666666'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from storage.objects
    where bucket_id = 'listing-media'),
  2::bigint,
  'user A sees own draft media and active media'
);

select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values (
      'listing-media',
      '55555555-5555-4555-8555-555555555555/aaaaaaaa-5555-4555-8555-555555555552/second.webp',
      '55555555-5555-4555-8555-555555555555'
    )$$,
  'user A can upload to an owned listing path'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values (
      'listing-media',
      '55555555-5555-4555-8555-555555555555/bbbbbbbb-6666-4666-8666-666666666661/spoof.jpg',
      '55555555-5555-4555-8555-555555555555'
    )$$,
  '42501', null,
  'user A cannot upload to user B listing path'
);

select is_empty(
  $$update storage.objects set user_metadata = '{"spoofed":true}'
    where name = '66666666-6666-4666-8666-666666666666/bbbbbbbb-6666-4666-8666-666666666662/draft.jpg'
    returning 1$$,
  'user A cannot update user B draft media'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::bigint from storage.objects
    where bucket_id = 'listing-media'),
  1::bigint,
  'anonymous users see active listing media only'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values (
      'listing-media',
      'anonymous/aaaaaaaa-5555-4555-8555-555555555551/nope.jpg'
    )$$,
  '42501', null,
  'anonymous users cannot upload listing media'
);

reset role;
select * from finish();
rollback;
