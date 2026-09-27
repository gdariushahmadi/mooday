// Wait! `public.enforce_admin_fields_readonly` trigger that I JUST ADDED to `profiles`!
// Did it accidentally do something weird?
// No, it's on `profiles`, not `audit_log`.

// WAIT! What if the user 'a1111111-1111-4111-9111-111111111111' IS AN ADMIN?
// Look at the bootstrap data in `phase_3_5_admin_rls.sql`:
/*
update public.profiles as p set
  full_name_en = v.full_name_en,
  is_admin = v.is_admin
from (values
  ('a1111111-1111-4111-9111-111111111111'::uuid, 'Buyer', false),
  ('a2222222-2222-4222-9222-222222222222'::uuid, 'Seller', false),
  ('a3333333-3333-4333-9333-333333333333'::uuid, 'Admin', true)
) as v(id, full_name_en, is_admin)
where p.id = v.id;
*/
// It sets `is_admin = false`.

// But wait... what if the UPDATE statement FAILS because of RLS?
// The UPDATE is running as `postgres` (superuser), so it should succeed.
// Let's verify if `is_admin` is actually updated in the test.
