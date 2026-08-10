begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'chat-buyer@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated', 'chat-seller@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated', 'authenticated', 'bystander@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );

insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status
) values
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Item', 'عنصر', 5000, 'Good', 'جيد', 'Bags', 'active'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.chat_threads (
      buyer_id, seller_id, listing_id,
      listing_title_en, listing_title_ar,
      listing_image_url, price_minor_at_creation
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'Item', 'عنصر',
      'https://cdn.example/item.jpg', 5000
    )$$,
  'buyer can open a chat thread with a seller'
);

select throws_ok(
  $$insert into public.chat_threads (
      buyer_id, seller_id, listing_id,
      listing_title_en, listing_title_ar,
      listing_image_url, price_minor_at_creation
    ) values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'Item', 'عنصر',
      'https://cdn.example/item.jpg', 5000
    )$$,
  '42501', null,
  'bystander cannot spoof a thread with someone else''s buyer_id'
);

select lives_ok(
  $$insert into public.chat_messages (
      thread_id, sender_id, type, body
    ) values (
      (select id from public.chat_threads where buyer_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' limit 1),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'text', 'Hello!'
    )$$,
  'buyer can send a chat message in their own thread'
);

select lives_ok(
  $$insert into public.chat_messages (
      thread_id, sender_id, type, body, offer_minor, offer_status
    ) values (
      (select id from public.chat_threads where buyer_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' limit 1),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'offer', 'Best price?', 4500, 'pending'
    )$$,
  'buyer can attach an offer message'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from public.chat_threads),
  0::bigint,
  'bystander cannot see another user''s chat threads'
);

select is(
  (select count(*)::bigint from public.chat_messages),
  0::bigint,
  'bystander cannot see messages in threads they do not own'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from public.chat_messages),
  2::bigint,
  'seller sees both messages in their shared thread'
);

-- Reviews
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

insert into public.orders (
  id, buyer_id, seller_id, shipping_address,
  items_subtotal_minor, shipping_fee_minor, total_minor
) values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '{"city_en":"Dubai"}'::jsonb,
  5000, 0, 5000
);

select lives_ok(
  $$insert into public.seller_reviews (
      seller_id, buyer_id, order_id, rating, body_en, body_ar, tags
    ) values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      5, 'Great!', 'ممتاز', ARRAY['as_described']
    )$$,
  'buyer can review a seller they have a real order with'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);

select throws_ok(
  $$insert into public.seller_reviews (
      seller_id, buyer_id, order_id, rating, body_en, body_ar, tags
    ) values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      4, 'Ok', 'حسن', '{}'
    )$$,
  '42501', null,
  'bystander cannot post a review using someone else''s buyer_id'
);

-- Reports
select lives_ok(
  $$insert into public.reports (
      case_number, reporter_id, target, target_id, reason, body
    ) values (
      'CASE-1', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'listing', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'counterfeit', 'suspected'
    )$$,
  'any authenticated user can file a report as themselves'
);

-- Disputes (buyer of the order)
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.disputes (
      order_id, buyer_id, reason, body
    ) values (
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'Item never arrived', 'Tracking stuck'
    )$$,
  'buyer can open a dispute on their own order'
);

-- Notifications
select lives_ok(
  $$insert into public.notifications (
      recipient_id, kind, title_en, title_ar, body_en, body_ar,
      target_kind, target_id, is_unread
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'order', 'Order shipped', 'تم الشحن',
      'Your bag is on the way', 'حقيبتك في الطريق',
      'order', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', true
    )$$,
  'recipient can receive a notification with their own id'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from public.notifications),
  0::bigint,
  'bystander cannot read other users'' notifications'
);

reset role;
select * from finish();
rollback;
