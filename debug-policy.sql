-- Let's see what policies exist on audit_log
select * from pg_policies where tablename = 'audit_log';
