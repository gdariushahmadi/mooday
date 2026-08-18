create or replace function public.protect_admin_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  if current_setting('request.jwt.claims', true) is not null then
    if coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'role', '') = 'authenticated' then
      if new.is_admin is distinct from old.is_admin
      or new.is_suspended is distinct from old.is_suspended
      or new.suspended_reason is distinct from old.suspended_reason
      or new.suspended_at is distinct from old.suspended_at then
        raise exception 'permission denied' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin_columns on public.profiles;
create trigger profiles_protect_admin_columns
before update on public.profiles
for each row execute function public.protect_admin_columns();
