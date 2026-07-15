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
    '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'phase2-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase Two A"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'phase2-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase Two B"}', now(), now(), '', '', '', ''
  );

select is(
  (select count(*)::bigint from public.profiles where id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  )),
  2::bigint,
  'signup trigger creates both private profiles'
);

insert into public.addresses (
  user_id, label_en, label_ar, full_name_en, full_name_ar,
  phone, city_en, city_ar, street_en, street_ar, is_default
) values (
  '22222222-2222-4222-8222-222222222222',
  'Home', 'المنزل', 'User B', 'المستخدم ب', '+971500000002',
  'Dubai', 'دبي', 'B street', 'شارع ب', true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.addresses (
      user_id, label_en, label_ar, full_name_en, full_name_ar,
      phone, city_en, city_ar, street_en, street_ar, is_default
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'Home', 'المنزل', 'User A', 'المستخدم أ', '+971500000001',
      'Dubai', 'دبي', 'A street', 'شارع أ', true
    )$$,
  'user A can insert an address owned by user A'
);

select throws_ok(
  $$insert into public.addresses (
      user_id, label_en, label_ar, full_name_en, full_name_ar,
      phone, city_en, city_ar, street_en, street_ar
    ) values (
      '22222222-2222-4222-8222-222222222222',
      'Work', 'العمل', 'Spoofed', 'مزيف', '+971500000009',
      'Dubai', 'دبي', 'Spoofed street', 'شارع مزيف'
    )$$,
  '42501',
  null,
  'user A cannot spoof user B as address owner'
);

select is(
  (select count(*)::bigint from public.addresses),
  1::bigint,
  'user A can only select the address owned by user A'
);

select is(
  (select count(*)::bigint from public.profiles),
  1::bigint,
  'user A can only select the profile owned by user A'
);

select is(
  (with changed as (
    update public.addresses set city_en = 'Abu Dhabi'
    where user_id = '22222222-2222-4222-8222-222222222222'
    returning 1
  ) select count(*)::bigint from changed),
  0::bigint,
  'user A cannot update user B address'
);

select throws_ok(
  $$select public.set_default_address(
    '22222222-2222-4222-8222-222222222222'::uuid
  )$$,
  'P0002',
  'address not found',
  'user A cannot set user B address as default'
);

select lives_ok(
  $$update public.profiles
    set bio_en = 'Owner update'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  'user A can update the profile owned by user A'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::bigint from public.addresses),
  0::bigint,
  'anonymous users cannot select private addresses'
);

select is(
  (select count(*)::bigint from public.profiles),
  0::bigint,
  'anonymous users cannot select private profiles'
);

reset role;
select * from finish();
rollback;
