-- Phase 5: RLS coverage for affiliate_clicks.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000',
   'a5000004-0000-4000-8000-000000000004',
   'authenticated', 'authenticated', 'admin5c@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'a5000005-0000-4000-8000-000000000005',
   'authenticated', 'authenticated', 'user5c@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
update public.profiles as p set is_admin = v.is_admin
from (values
  ('a5000004-0000-4000-8000-000000000004'::uuid, true),
  ('a5000005-0000-4000-8000-000000000005'::uuid, false)
) as v(id, is_admin)
where p.id = v.id;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select lives_ok(
  $$insert into public.affiliate_clicks (short_id, listing_id, partner_code, anon_id) values ('abc12345', 'd5000001-0000-4000-8000-000000000001', 'amazon-ae', 'anon-uuid')$$,
  'anon can insert a click row'
);
select throws_ok(
  $$select count(*) from public.affiliate_clicks$$,
  '42501',
  null,
  'anon cannot SELECT from affiliate_clicks (no GRANT)'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a5000005-0000-4000-8000-000000000005","role":"authenticated"}', true);
select results_eq(
  $$select count(*)::bigint from public.affiliate_clicks$$,
  $$values (0::bigint)$$,
  'non-admin authenticated SELECT returns 0 rows (RLS USING filters)'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a5000004-0000-4000-8000-000000000004","role":"authenticated"}', true);
select results_eq(
  $$select count(*)::bigint from public.affiliate_clicks$$,
  $$values (1::bigint)$$,
  'admin can SELECT from affiliate_clicks'
);
select * from finish();
rollback;
