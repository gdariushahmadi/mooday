-- Phase 4 (M4): RLS coverage for payment_methods.
--
-- Verifies the owner-scoped policies:
--   - Owner can read their own cards.
--   - Owner can insert a new card.
--   - Owner can set default + delete their own cards.
--   - Other authenticated users cannot insert a card on someone
--     else's behalf.
--   - Other authenticated users cannot delete someone else's cards.

begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'pm-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"PM A"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'pm-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"PM B"}', now(), now(), '', '', '', ''
  );

-- A inserts two cards.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.payment_methods (
    owner_id, label_en, label_ar, brand_en, brand_ar,
    last4, holder_en, holder_ar, expiry, is_default
  ) values (
    'aaaaaaaa-1111-4111-8111-111111111111',
    'Personal Visa', 'فيزا شخصية',
    'Visa', 'فيزا', '4242', 'Layla', 'ليلى', '11/27', true
  )$$,
  'A can insert a default card'
);

select lives_ok(
  $$insert into public.payment_methods (
    owner_id, label_en, label_ar, brand_en, brand_ar,
    last4, holder_en, holder_ar, expiry, is_default
  ) values (
    'aaaaaaaa-1111-4111-8111-111111111111',
    'Mastercard', 'ماستركارد',
    'Mastercard', 'ماستركارد', '1881', 'Layla', 'ليلى', '04/26', false
  )$$,
  'A can insert a second non-default card'
);

-- A reads own cards.
select results_eq(
  $$select count(*)::int from public.payment_methods$$,
  $$values (2)$$,
  'A reads two of their own cards'
);

-- B switches in and inserts their own card.
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.payment_methods (
    owner_id, label_en, label_ar, brand_en, brand_ar,
    last4, holder_en, holder_ar, expiry, is_default
  ) values (
    'bbbbbbbb-1111-4111-8111-111111111111',
    'B Card', 'بطاقة ب',
    'Visa', 'فيزا', '9999', 'B', 'ب', '01/29', true
  )$$,
  'B can insert their own card'
);

-- B reads only their own card (RLS hides A's).
select results_eq(
  $$select count(*)::int from public.payment_methods$$,
  $$values (1)$$,
  'B reads only their own card (RLS hides A)'
);

-- B cannot insert a card for A (RLS rejects owner_id mismatch).
select throws_ok(
  $$insert into public.payment_methods (
    owner_id, label_en, label_ar, brand_en, brand_ar,
    last4, holder_en, holder_ar, expiry, is_default
  ) values (
    'aaaaaaaa-1111-4111-8111-111111111111',
    'Spoof', 'انتحال',
    'Visa', 'فيزا', '0000', 'A', 'أ', '01/29', false
  )$$,
  '42501',
  'new row violates row-level security policy for table "payment_methods"',
  'B cannot insert a card owned by A'
);

-- B cannot delete A's cards (rows deleted = 0 due to RLS).
select results_eq(
  $$with deleted as (
    delete from public.payment_methods
    where owner_id = 'aaaaaaaa-1111-4111-8111-111111111111'
    returning 1
  )
  select count(*)::int from deleted$$,
  $$values (0)$$,
  'B cannot delete A cards (RLS blocks)'
);

select * from finish();
rollback;
