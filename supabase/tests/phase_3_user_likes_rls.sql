begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'likes-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Likes A"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated', 'likes-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Likes B"}', now(), now(), '', '', '', ''
  );

insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status
) values
  (
    'cccccccc-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'A likeable', 'أ تستحق', 5000, 'Good', 'جيد', 'Bags', 'active'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.user_listing_likes (user_id, listing_id)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'cccccccc-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )$$,
  'user A can like their own listing'
);

select is(
  (
    select count(*)::bigint from public.user_listing_likes
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0::bigint,
  'like row is recorded with the right owner'
);

-- A repeat "like" is a no-op at the app layer; the schema must allow
-- INSERT ... ON CONFLICT DO NOTHING without raising.
select lives_ok(
  $$insert into public.user_listing_likes (user_id, listing_id)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'cccccccc-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )
    on conflict do nothing$$,
  're-liking the same listing does not error'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::bigint from public.user_listing_likes
    where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  0::bigint,
  'user B reads only their own like (user A''s row is invisible)'
);

select throws_ok(
  $$insert into public.user_listing_likes (user_id, listing_id)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'cccccccc-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )$$,
  '42501', null,
  'user B cannot create a like owned by user A'
);

select is_empty(
  $$delete from public.user_listing_likes where listing_id = 'cccccccc-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning 1$$,
  'user B cannot delete user A likes'
);

reset role;

-- Cascade: removing the listing removes dependent like rows.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

delete from public.listings
  where id = 'cccccccc-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (
    select count(*)::bigint from public.user_listing_likes
    where listing_id = 'cccccccc-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0::bigint,
  'deleting the liked listing cascades and drops the like row'
);

reset role;
select * from finish();
rollback;
