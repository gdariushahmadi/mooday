begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

-- Bootstrap: two regular users + one admin.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-9111-111111111111',
    'authenticated', 'authenticated', 'buyer@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-9222-222222222222',
    'authenticated', 'authenticated', 'seller@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-9333-333333333333',
    'authenticated', 'authenticated', 'admin@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );

insert into public.profiles (id, full_name_en, is_admin) values
  ('11111111-1111-4111-9111-111111111111', 'Buyer', false),
  ('22222222-2222-4222-9222-222222222222', 'Seller', false),
  ('33333333-3333-4333-9333-333333333333', 'Admin', true);

-- Two listings from the seller: one approved (default), one fresh.
insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status, approved_at
) values
  (
    'aaaaaaaa-1111-4111-9111-111111111111',
    '22222222-2222-4222-9222-222222222222',
    'Approved bag', 'موافق عليه', 5000,
    'Good', 'جيد', 'Bags', 'active', timezone('utc', now())
  ),
  (
    'bbbbbbbb-2222-4222-9222-222222222222',
    '22222222-2222-4222-9222-222222222222',
    'Pending bag', 'قيد المراجعة', 5000,
    'Good', 'جيد', 'Bags', 'active', null
  );

-- ---------- public visibility ----------

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::bigint from public.listings),
  1::bigint,
  'anon can only see approved+active listings — fresh listing is hidden'
);

reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-9222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::bigint from public.listings),
  2::bigint,
  'seller sees both their own listings (approved + pending)'
);

reset role;

-- ---------- admin-only writes ----------

-- Regular buyer tries to mark themselves admin -> denied.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$update public.profiles set is_admin = true
    where id = '11111111-1111-4111-9111-111111111111'$$,
  '42501', null,
  'a non-admin user cannot flip their own is_admin flag'
);

-- ---------- admin writes to the audit log ----------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-9333-333333333333","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.audit_log (actor_id, action, target_kind, target_id)
    values (
      '33333333-3333-4333-9333-333333333333',
      'listing.approve',
      'listing',
      'bbbbbbbb-2222-4222-9222-222222222222'
    )$$,
  'admin can write to the audit log'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$insert into public.audit_log (actor_id, action, target_kind, target_id)
    values (
      '11111111-1111-4111-9111-111111111111',
      'listing.approve',
      'listing',
      'bbbbbbbb-2222-4222-9222-222222222222'
    )$$,
  '42501', null,
  'a non-admin user cannot write to the audit log'
);

select is(
  (select count(*)::bigint from public.audit_log),
  0::bigint,
  'a non-admin user cannot read the audit log either'
);

reset role;

-- ---------- featured curation ----------

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::bigint from public.featured_listings),
  0::bigint,
  'anon can read featured_listings (currently empty)'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$insert into public.featured_listings (listing_id, curator_id, sort_order)
    values (
      'aaaaaaaa-1111-4111-9111-111111111111',
      '11111111-1111-4111-9111-111111111111',
      1
    )$$,
  '42501', null,
  'a non-admin user cannot feature listings'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-9333-333333333333","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.featured_listings (listing_id, curator_id, sort_order)
    values (
      'aaaaaaaa-1111-4111-9111-111111111111',
      '33333333-3333-4333-9333-333333333333',
      1
    )$$,
  'admin can feature a listing'
);

-- ---------- broadcast notifications ----------

select lives_ok(
  $$insert into public.broadcast_notifications (
      author_id, kind, title_en, title_ar, body_en, body_ar
    ) values (
      '33333333-3333-4333-9333-333333333333',
      'system', 'Welcome', 'مرحبا',
      'Mooday is live', 'موداي بدأ'
    )$$,
  'admin can publish a broadcast notification'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::bigint from public.broadcast_notifications),
  1::bigint,
  'anon can read broadcast notifications (public list)'
);

reset role;
select * from finish();
rollback;
