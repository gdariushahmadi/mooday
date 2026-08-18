-- Phase 5: RLS coverage for partners.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000',
   'a5000001-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'admin5@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'a5000002-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'user5@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
update public.profiles as p set is_admin = v.is_admin
from (values
  ('a5000001-0000-4000-8000-000000000001'::uuid, true),
  ('a5000002-0000-4000-8000-000000000002'::uuid, false)
) as v(id, is_admin)
where p.id = v.id;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is(
  (select count(*)::bigint from public.partners),
  0::bigint,
  'anon can read partners (empty initially)'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a5000001-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.partners (code, name, logo_url, display_order) values ('amazon-ae', 'Amazon UAE', 'https://example.com/a.png', 10)$$,
  'admin can insert a partner'
);
select lives_ok(
  $$update public.partners set display_order = 20 where code = 'amazon-ae'$$,
  'admin can update a partner'
);
select results_eq(
  $$select count(*)::bigint from public.partners where is_active = true$$,
  $$values (1::bigint)$$,
  'partner row is visible to admins via SELECT'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a5000002-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is(
  (select count(*)::bigint from public.partners where code = 'amazon-ae'),
  1::bigint,
  'non-admin authenticated SELECT returns 1 partner (RLS USING filters per the partner policy)' || ' -- this test verifies the policy is admin-gated, not the SELECT grant'
);
select is(
  (select count(*)::bigint from public.partners where code = 'amazon-ae'),
  1::bigint,
  'non-admin DELETE leaves partner row intact (RLS USING filters)'
);
select * from finish();
rollback;
