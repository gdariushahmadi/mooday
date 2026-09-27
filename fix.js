const fs = require('fs');
let file = fs.readFileSync('supabase/migrations/202607150008_phase_3_5_admin.sql', 'utf8');

// I will insert the trigger before the comment:
// "-- Listings gain `approved_at`"
const splitText = "-- Listings gain `approved_at`";

const trigger = `
create or replace function public.enforce_admin_fields_readonly()
returns trigger as $$
begin
  if auth.role() = 'authenticated' and current_setting('request.jwt.claims', true) is not null then
    -- Allow admins to bypass this check so they can update other users (using standard RLS)
    if not (select is_admin from public.profiles where id = (select auth.uid())) then
      if new.is_admin is distinct from old.is_admin then
        raise exception using errcode = '42501', message = 'a non-admin user cannot flip their own is_admin flag';
      end if;
      if new.is_suspended is distinct from old.is_suspended then
        raise exception using errcode = '42501', message = 'a non-admin user cannot flip their own is_suspended flag';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_admin_fields_readonly on public.profiles;
create trigger enforce_admin_fields_readonly
  before update on public.profiles
  for each row
  execute function public.enforce_admin_fields_readonly();

`;

file = file.replace(splitText, trigger + splitText);
fs.writeFileSync('supabase/migrations/202607150008_phase_3_5_admin.sql', file);
