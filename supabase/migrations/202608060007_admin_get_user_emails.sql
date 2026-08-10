begin;

create or replace function public.admin_get_user_emails(user_ids uuid[])
returns table (id uuid, email varchar)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select u.id, u.email
  from auth.users u
  where u.id = any(user_ids);
end;
$$;

revoke all on function public.admin_get_user_emails(uuid[]) from public, anon, authenticated;
-- Only the service_role key can execute this
grant execute on function public.admin_get_user_emails(uuid[]) to service_role;

commit;
