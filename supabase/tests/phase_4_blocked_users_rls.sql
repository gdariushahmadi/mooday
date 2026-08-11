-- Phase 4 (M4): RLS coverage for blocked_users.
--
-- Verifies the blocker-scoped policies:
--   - Blocker can read their own blocks.
--   - Blocker can insert + delete their own blocks.
--   - Other authenticated users cannot read someone else's blocks.
--   - Cross-user block insert is rejected.
--   - Other users cannot delete someone else's blocks.

begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'ccccccc1-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'block-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Blocker A"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'ccccccc2-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'block-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Blocker B"}', now(), now(), '', '', '', ''
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ccccccc1-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.blocked_users (
    blocker_id, blocked_id, blocked_name_en, blocked_name_ar, blocked_avatar
  ) values (
    'ccccccc1-1111-4111-8111-111111111111',
    'ccccccc2-1111-4111-8111-111111111111',
    'Annoying Seller', 'بائع مزعج', '/sellers/x.jpg'
  )$$,
  'A blocks B'
);

-- A reads own block.
select results_eq(
  $$select count(*)::int from public.blocked_users$$,
  $$values (1)$$,
  'A reads own block'
);

-- B switches in. RLS hides A's row.
select set_config(
  'request.jwt.claims',
  '{"sub":"ccccccc2-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select results_eq(
  $$select count(*)::int from public.blocked_users$$,
  $$values (0)$$,
  'B cannot see A blocks (RLS hides)'
);

-- B cannot insert a block on A's behalf.
select throws_ok(
  $$insert into public.blocked_users (
    blocker_id, blocked_id, blocked_name_en, blocked_name_ar, blocked_avatar
  ) values (
    'ccccccc1-1111-4111-8111-111111111111',
    'ccccccc2-1111-4111-8111-111111111111',
    'X', 'س', '/sellers/x.jpg'
  )$$,
  '42501',
  'new row violates row-level security policy for table "blocked_users"',
  'B cannot insert a block where blocker_id is A'
);

-- B can block A.
select lives_ok(
  $$insert into public.blocked_users (
    blocker_id, blocked_id, blocked_name_en, blocked_name_ar, blocked_avatar
  ) values (
    'ccccccc2-1111-4111-8111-111111111111',
    'ccccccc1-1111-4111-8111-111111111111',
    'A', 'أ', '/sellers/y.jpg'
  )$$,
  'B can block A'
);

-- B cannot delete A's blocks (deleted count = 0 due to RLS).
select results_eq(
  $$with deleted as (
    delete from public.blocked_users
    where blocker_id = 'ccccccc1-1111-4111-8111-111111111111'
    returning 1
  )
  select count(*)::int from deleted$$,
  $$values (0)$$,
  'B cannot delete A blocks (RLS blocks)'
);

select * from finish();
rollback;
