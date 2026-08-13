begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
select pass('ok');
select * from finish();
rollback;
