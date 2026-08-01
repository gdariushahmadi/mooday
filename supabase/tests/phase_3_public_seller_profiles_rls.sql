begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '77777777-7777-4777-8777-777777777777',
    'authenticated', 'authenticated', 'card-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Card A"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '88888888-8888-4888-9888-888888888888',
    'authenticated', 'authenticated', 'card-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Card B"}', now(), now(), '', '', '', ''
  );

-- The on_auth_user_created_public_profile trigger fires on real sign-ups.
-- Here we insert directly so the seed function runs against the test rows.
insert into public.public_seller_profiles (
  seller_id, display_name_en, display_name_ar, handle, type_en, type_ar
) values
  (
    '77777777-7777-4777-8777-777777777777',
    'Card A', 'بطاقة أ', 'card-a', 'Verified Collector', 'جامع معتمد'
  ),
  (
    '88888888-8888-4888-9888-888888888888',
    'Card B', 'بطاقة ب', 'card-b', 'Boutique', 'بوتيك'
  );

insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status
) values
  (
    'cccccccc-7777-4777-8777-777777777771',
    '77777777-7777-4777-8777-777777777777',
    'A active 1', 'أ نشط ١', 1000, 'Good', 'جيد', 'Bags', 'active'
  ),
  (
    'cccccccc-7777-4777-8777-777777777772',
    '77777777-7777-4777-8777-777777777777',
    'A active 2', 'أ نشط ٢', 1000, 'Good', 'جيد', 'Bags', 'active'
  ),
  (
    'cccccccc-7777-4777-8777-777777777773',
    '77777777-7777-4777-8777-777777777777',
    'A draft', 'أ مسودة', 1000, 'Good', 'جيد', 'Bags', 'draft'
  ),
  (
    'dddddddd-8888-4888-9888-888888888881',
    '88888888-8888-4888-9888-888888888888',
    'B active', 'ب نشط', 1000, 'Good', 'جيد', 'Shoes', 'active'
  );

-- Anonymous read of the public projection.

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::bigint from public.public_seller_profiles),
  2::bigint,
  'anonymous users can read every public seller card'
);

select is(
  (select listings_count from public.seller_card_view
    where seller_id = '77777777-7777-4777-8777-777777777777'),
  2,
  'seller_card_view counts only active listings (drafts excluded)'
);

select is(
  (select listings_count from public.seller_card_view
    where seller_id = '88888888-8888-4888-9888-888888888888'),
  1,
  'seller_card_view counts a single active listing correctly'
);

reset role;

-- Authenticated cross-user isolation.

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from public.public_seller_profiles),
  2::bigint,
  'authenticated user A can read every public seller card'
);

select is(
  (
    select count(*)::bigint from public.public_seller_profiles
    where handle = 'card-b'
  ),
  1::bigint,
  'authenticated user A can read user B public card by handle'
);

select is_empty(
  $$update public.public_seller_profiles set display_name_en = 'Hijacked'
    where seller_id = '88888888-8888-4888-9888-888888888888'
    returning 1$$,
  'user A cannot edit user B public card'
);

select throws_ok(
  $$insert into public.public_seller_profiles (
      seller_id, display_name_en, display_name_ar
    ) values (
      '88888888-8888-4888-9888-888888888888',
      'Spoofed', 'مزيف'
    )$$,
  '42501', null,
  'user A cannot create a public card for user B'
);

select lives_ok(
  $$update public.public_seller_profiles
     set bio_en = 'updated by owner'
     where seller_id = '77777777-7777-4777-8777-777777777777'$$,
  'user A can edit their own public card'
);

reset role;

-- Auth-user creation seeds the public card row via trigger.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '99999999-9999-4999-9999-999999999999',
    'authenticated', 'authenticated', 'card-seed@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Seeded Through Trigger"}', now(), now(), '', '', '', ''
  );

select is(
  (
    select count(*)::bigint from public.public_seller_profiles
    where seller_id = '99999999-9999-4999-9999-999999999999'
  ),
  1::bigint,
  'on_auth_user_created_public_profile trigger seeds a public card row'
);

select is(
  (
    select display_name_en from public.public_seller_profiles
    where seller_id = '99999999-9999-4999-9999-999999999999'
  ),
  'Seeded Through Trigger',
  'seeded public card copies the sign-up full_name from raw_user_meta_data'
);

reset role;

select * from finish();
rollback;
