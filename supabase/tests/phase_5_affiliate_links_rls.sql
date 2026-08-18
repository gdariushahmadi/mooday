-- Phase 5: RLS coverage for affiliate_links.
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
   'a5000003-0000-4000-8000-000000000003',
   'authenticated', 'authenticated', 'admin5b@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
update public.profiles as p set is_admin = true where p.id = 'a5000003-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a5000003-0000-4000-8000-000000000003","role":"authenticated"}', true);
insert into public.partners (code, name) values ('amazon-ae', 'Amazon UAE');
insert into public.listings (
  id, seller_id, title_en, title_ar, price_minor,
  condition_en, condition_ar, category, status, approved_at
) values (
  'c5000001-0000-4000-8000-000000000001',
  'a5000003-0000-4000-8000-000000000003',
  'Test bag', 'حقيبة اختبار', 5000,
  'Good', 'جيد', 'Bags', 'active', timezone('utc', now())
);
select lives_ok(
  $$insert into public.affiliate_links (short_id, listing_id, partner_code, affiliate_url) values ('abc12345', 'c5000001-0000-4000-8000-000000000001', 'amazon-ae', 'https://amazon.ae/dp/B0XYZ?tag=mooday-21')$$,
  'admin can insert an affiliate link'
);
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is(
  (select count(*)::bigint from public.affiliate_links),
  1::bigint,
  'anon can read affiliate links'
);
select throws_ok(
  $$insert into public.affiliate_links (short_id, listing_id, partner_code, affiliate_url) values ('xyz67890', 'c5000001-0000-4000-8000-000000000001', 'amazon-ae', 'https://example.com')$$,
  '42501',
  null,
  'anon cannot insert an affiliate link'
);
reset role;
delete from public.listings where id = 'c5000001-0000-4000-8000-000000000001';
select is(
  (select count(*)::bigint from public.affiliate_links),
  0::bigint,
  'listing deletion cascades to its affiliate links'
);
select * from finish();
rollback;
