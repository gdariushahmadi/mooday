begin;

drop trigger if exists enforce_is_admin_readonly on public.profiles;
drop function if exists public.enforce_is_admin_readonly();

create or replace function public.enforce_is_admin_readonly()
returns trigger as $$
begin
  if (
    new.is_admin is distinct from old.is_admin
    -- Only allow the service role (or postgres) to change it
    and current_role not in ('service_role', 'postgres', 'supabase_admin')
  ) then
    raise exception '42501: a non-admin user cannot flip their own is_admin flag';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_is_admin_readonly
  before update on public.profiles
  for each row
  execute function public.enforce_is_admin_readonly();
commit;
