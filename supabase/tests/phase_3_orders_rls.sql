-- Public beta order/RLS coverage.
--
-- A browser client must not insert an order or an order item directly. The
-- only client order entry point is the single-listing RPC, which reads the
-- current price, snapshots the address and item, and reserves the listing.

begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

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
  condition_en, condition_ar, category, status, approved_at
) values
  (
    'aaaaaaaa-1111-4111-9111-111111111111',
    '22222222-2222-4222-9222-222222222222',
    'Bag', 'حقيبة', 5000, 'Good', 'جيد', 'Bags', 'active', timezone('utc', now())
  ),
  (
    'aaaaaaaa-1111-4111-9111-111111111112',
    '22222222-2222-4222-9222-222222222222',
    'Pending bag', 'حقيبة قيد المراجعة', 6000, 'Good', 'جيد', 'Bags', 'active', null
  ),
  (
    'aaaaaaaa-1111-4111-9111-111111111113',
    '11111111-1111-4111-9111-111111111111',
    'Own bag', 'حقيبتي', 7000, 'Good', 'جيد', 'Bags', 'active', timezone('utc', now())
  );

insert into public.addresses (
  id, user_id, label_en, label_ar, full_name_en, full_name_ar, phone,
  city_en, city_ar, district_en, district_ar, street_en, street_ar,
  notes_en, notes_ar, is_default
) values (
  'bbbbbbbb-1111-4111-9111-111111111111',
  '11111111-1111-4111-9111-111111111111',
  'Home', 'المنزل', 'Buyer', 'المشتري', '+971500000000',
  'Dubai', 'دبي', 'Jumeirah', 'جميرا', '123 Road', 'شارع 123',
  'Gate A', 'البوابة أ', true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$insert into public.orders (
      buyer_id, seller_id, shipping_address,
      items_subtotal_minor, shipping_fee_minor, total_minor
    ) values (
      '11111111-1111-4111-9111-111111111111',
      '22222222-2222-4222-9222-222222222222',
      '{"city_en":"Dubai"}'::jsonb,
      1, 0, 1
    )$$,
  '42501', null,
  'browser clients cannot insert financial orders directly'
);

select lives_ok(
  $$select public.create_single_listing_order(
    'aaaaaaaa-1111-4111-9111-111111111111'::uuid,
    'bbbbbbbb-1111-4111-9111-111111111111'::uuid
  )$$,
  'buyer can create one order through the atomic RPC'
);

select is(
  (select count(*)::bigint from public.orders
    where buyer_id = '11111111-1111-4111-9111-111111111111'),
  1::bigint,
  'the RPC creates exactly one order'
);

select is(
  (select status from public.orders
    where buyer_id = '11111111-1111-4111-9111-111111111111'),
  'pending_payment',
  'new orders start in pending_payment'
);

select is(
  (select payment_status from public.orders
    where buyer_id = '11111111-1111-4111-9111-111111111111'),
  'pending',
  'new orders start with pending payment'
);

select is(
  (select total_minor from public.orders
    where buyer_id = '11111111-1111-4111-9111-111111111111'),
  7500::bigint,
  'the RPC calculates the total from the database price'
);

select is(
  (select shipping_address ->> 'streetEn' from public.orders
    where buyer_id = '11111111-1111-4111-9111-111111111111'),
  '123 Road',
  'the RPC stores an address snapshot'
);

select is(
  (select count(*)::bigint from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.buyer_id = '11111111-1111-4111-9111-111111111111'
      and oi.quantity = 1),
  1::bigint,
  'the RPC creates one item with quantity one'
);

select is(
  (select status from public.listings
    where id = 'aaaaaaaa-1111-4111-9111-111111111111'),
  'reserved',
  'the RPC reserves the listing in the same transaction'
);

select throws_ok(
  $$select public.create_single_listing_order(
    'aaaaaaaa-1111-4111-9111-111111111111'::uuid,
    'bbbbbbbb-1111-4111-9111-111111111111'::uuid
  )$$,
  'P0002', null,
  'a second order cannot reserve the already reserved listing'
);

select throws_ok(
  $$select public.create_single_listing_order(
    'aaaaaaaa-1111-4111-9111-111111111112'::uuid,
    'bbbbbbbb-1111-4111-9111-111111111111'::uuid
  )$$,
  'P0002', null,
  'an unapproved listing cannot be ordered'
);

select throws_ok(
  $$select public.create_single_listing_order(
    'aaaaaaaa-1111-4111-9111-111111111113'::uuid,
    'bbbbbbbb-1111-4111-9111-111111111111'::uuid
  )$$,
  '42501', null,
  'a buyer cannot buy their own listing'
);

select throws_ok(
  $$insert into public.order_items (
      order_id, listing_id, title_en_at_purchase, title_ar_at_purchase,
      image_url_at_purchase, price_minor_at_purchase, quantity
    ) values (
      (select id from public.orders limit 1),
      'aaaaaaaa-1111-4111-9111-111111111111',
      'Spoofed', 'مزيف', '', 1, 99
    )$$,
  '42501', null,
  'browser clients cannot insert order item snapshots directly'
);

-- Payment success is a server-only transition. Simulate the payment server
-- with the service-role JWT, then exercise the participant RPCs.
reset role;
select set_config(
  'request.jwt.claims',
  '{"role":"service_role"}',
  true
);
update public.orders
set status = 'paid', payment_status = 'succeeded',
    payment_intent_id = 'pi_test_order', paid_at = timezone('utc', now())
where buyer_id = '11111111-1111-4111-9111-111111111111';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-9222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from public.orders
    where seller_id = '22222222-2222-4222-9222-222222222222'),
  1::bigint,
  'the seller can read the order'
);

select lives_ok(
  $$select public.mark_order_shipped(
    (select id from public.orders limit 1),
    'Aramex', 'أرامكس', 'ARMX-TEST'
  )$$,
  'only the seller can mark a paid order shipped'
);

select throws_ok(
  $$update public.orders set total_minor = 1 where id = (select id from public.orders limit 1)$$,
  '42501', null,
  'the seller cannot change the financial total'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.mark_order_delivered((select id from public.orders limit 1))$$,
  'a participant can mark a shipped order delivered'
);

select lives_ok(
  $$insert into public.disputes (order_id, buyer_id, reason, body)
    values (
      (select id from public.orders limit 1),
      '11111111-1111-4111-9111-111111111111',
      'not received', 'Test dispute'
    )$$,
  'the buyer can open a dispute for a delivered order'
);

select lives_ok(
  $$select public.request_order_return((select id from public.orders limit 1))$$,
  'the buyer can request a return after the dispute is recorded'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-9333-333333333333","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from public.orders),
  0::bigint,
  'a bystander cannot read another user''s order'
);

select throws_ok(
  $$update public.orders set status = 'cancelled'
    where id = (select id from public.orders limit 1)$$,
  '42501', null,
  'a bystander cannot mutate an order'
);

reset role;
select * from finish();
rollback;
