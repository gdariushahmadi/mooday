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
    '11111111-1111-4111-9111-111111111111',
    'authenticated', 'authenticated', 'order-buyer@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-9222-222222222222',
    'authenticated', 'authenticated', 'order-seller@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-9333-333333333333',
    'authenticated', 'authenticated', 'order-bystander@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );

insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status
) values
  (
    'aaaaaaaa-1111-4111-9111-111111111111',
    '22222222-2222-4222-9222-222222222222',
    'Bag', 'حقيبة', 5000, 'Good', 'جيد', 'Bags', 'active'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.orders (
      id, buyer_id, seller_id, shipping_address,
      items_subtotal_minor, shipping_fee_minor, total_minor
    ) values (
      'bbbbbbbb-1111-4111-9111-111111111111',
      '11111111-1111-4111-9111-111111111111',
      '22222222-2222-4222-9222-222222222222',
      '{"city_en":"Dubai","street_en":"123 Road"}'::jsonb,
      5000, 0, 5000
    )$$,
  'buyer can create an order with their own buyer_id'
);

select lives_ok(
  $$insert into public.order_items (
      order_id, listing_id,
      title_en_at_purchase, title_ar_at_purchase, image_url_at_purchase,
      price_minor_at_purchase, quantity
    ) values (
      'bbbbbbbb-1111-4111-9111-111111111111',
      'aaaaaaaa-1111-4111-9111-111111111111',
      'Bag', 'حقيبة', 'https://cdn.example/bag.jpg',
      5000, 1
    )$$,
  'buyer can attach a line item snapshot to their own order'
);

select is(
  (
    select count(*)::bigint from public.order_items
    where order_id = 'bbbbbbbb-1111-4111-9111-111111111111'
  ),
  1::bigint,
  'order item is visible to the buyer'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-9222-222222222222","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::bigint from public.orders
    where seller_id = '22222222-2222-4222-9222-222222222222'
  ),
  1::bigint,
  'seller can see orders where they are the seller'
);

select lives_ok(
  $$update public.orders set status = 'shipped'
    where id = 'bbbbbbbb-1111-4111-9111-111111111111'$$,
  'seller can transition paid -> shipped'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-9222-222222222222","role":"authenticated"}',
  true
);

select throws_ok(
  $$update public.orders set status = 'cancelled'
    where id = 'bbbbbbbb-1111-4111-9111-111111111111'$$,
  'P0001', null,
  'seller cannot cancel an already-shipped order (illegal transition)'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$update public.orders set status = 'delivered'
    where id = 'bbbbbbbb-1111-4111-9111-111111111111'$$,
  'buyer can transition shipped -> delivered'
);

select lives_ok(
  $$update public.orders set status = 'returned'
    where id = 'bbbbbbbb-1111-4111-9111-111111111111'$$,
  'buyer can request a return after delivery'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-9333-333333333333","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::bigint from public.orders
    where buyer_id = '11111111-1111-4111-9111-111111111111'
  ),
  0::bigint,
  'bystander cannot read another user''s orders'
);

select is_empty(
  $$update public.orders set status = 'cancelled'
    where id = 'bbbbbbbb-1111-4111-9111-111111111111'
    returning 1$$,
  'bystander cannot mutate an order they do not own'
);

reset role;
select * from finish();
rollback;
