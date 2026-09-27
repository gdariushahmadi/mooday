begin;
-- bootstrap
insert into auth.users (id, aud, role, email) values ('a1111111-1111-4111-9111-111111111111', 'authenticated', 'authenticated', 'buyer@test.test');
update public.profiles set is_admin = false where id = 'a1111111-1111-4111-9111-111111111111';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-9111-111111111111","role":"authenticated"}', true);

insert into public.audit_log (actor_id, action, target_kind, target_id)
values ('a1111111-1111-4111-9111-111111111111', 'listing.approve', 'listing', 'bbbbbbbb-2222-4222-9222-222222222222');

rollback;
