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
    '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'cart-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cart A"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'cart-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cart B"}', now(), now(), '', '', '', ''
  );

insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status
) values
  (
    '33333333-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Bag', 'حقيبة', 5000, 'Good', 'جيد', 'Bags', 'active'
  ),
  (
    '44444444-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Hat', 'قبعة', 3000, 'Good', 'جيد', 'Accessories', 'active'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.cart_items_increment(
    '33333333-1111-4111-8111-111111111111'::uuid, 1
  )$$,
  'cart_items_increment inserts a row when one is missing'
);

select is(
  (
    select quantity from public.cart_items
    where user_id = '11111111-1111-4111-8111-111111111111'
      and listing_id = '33333333-1111-4111-8111-111111111111'
  ),
  1,
  'first increment creates the row at quantity 1'
);

select lives_ok(
  $$select public.cart_items_increment(
    '33333333-1111-4111-8111-111111111111'::uuid, 1
  )$$,
  'cart_items_increment is idempotent across calls'
);

select is(
  (
    select quantity from public.cart_items
    where user_id = '11111111-1111-4111-8111-111111111111'
      and listing_id = '33333333-1111-4111-8111-111111111111'
  ),
  2,
  'a second increment accumulates to quantity 2'
);

select lives_ok(
  $$select public.cart_items_increment(
    '33333333-1111-4111-8111-111111111111'::uuid, 98
  )$$,
  'cart_items_increment clamps overflow at the 99 ceiling'
);

select is(
  (
    select quantity from public.cart_items
    where user_id = '11111111-1111-4111-8111-111111111111'
      and listing_id = '33333333-1111-4111-8111-111111111111'
  ),
  99,
  'clamp lands exactly on the 99 ceiling (no check violation)'
);

select throws_ok(
  $$select public.cart_items_increment(
    '44444444-1111-4111-8111-111111111111'::uuid, 200
  )$$,
  '23514', null,
  'cart_items_increment fresh-row insert rejects quantity > 99 at the schema check'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::bigint from public.cart_items
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  0::bigint,
  'user B does not see user A cart items'
);

select throws_ok(
  $$select public.cart_items_increment(
    '33333333-1111-4111-8111-111111111111'::uuid, 1
  )$$,
  '42501', null,
  'cart_items_increment is auth-gated'
);

select throws_ok(
  $$update public.cart_items set quantity = 99
    where user_id = '11111111-1111-4111-8111-111111111111'
    returning 1$$,
  '42501', null,
  'user B cannot update user A cart rows'
);

select is_empty(
  $$delete from public.cart_items
    where user_id = '11111111-1111-4111-8111-111111111111'
    returning 1$$,
  'user B cannot delete user A cart rows'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

delete from public.listings
  where id = '33333333-1111-4111-8111-111111111111';

select is(
  (
    select count(*)::bigint from public.cart_items
    where listing_id = '33333333-1111-4111-8111-111111111111'
  ),
  0::bigint,
  'deleting the listing cascades and drops the cart row'
);

reset role;
select * from finish();
rollback;
