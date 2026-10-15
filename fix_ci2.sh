#!/bin/bash
git restore supabase/tests/*

# The problem is that during Phase 3.5 an `approved_at` column is added to listings,
# changing the definition of "active".
# Let's fix the tests that insert listings so they set `approved_at = now()`
# to simulate approved listings for these tests.

for test_file in "phase_3_listing_media_rls.sql" "phase_3_listings_rls.sql" "phase_3_user_likes_rls.sql"; do
  sed -i "s/category, status/category, status, approved_at/g" supabase/tests/$test_file
  sed -i "s/'active'/'active', now()/g" supabase/tests/$test_file
done

# Fix plan counts
sed -i 's/select plan(5);/select plan(6);/g' supabase/tests/phase_3_listing_media_rls.sql
sed -i 's/select plan(9);/select plan(11);/g' supabase/tests/phase_3_listings_rls.sql
sed -i 's/select plan(6);/select plan(7);/g' supabase/tests/phase_3_user_likes_rls.sql

# Fix phase_3_cart_items_rls.sql
sed -i 's/select plan(11);/select plan(12);/g' supabase/tests/phase_3_cart_items_rls.sql

sed -i -z "s/select throws_ok(\n  \$\$select public.cart_items_increment(\n    '33333333-1111-4111-8111-111111111111'::uuid, 1\n  )\$\$,\n  '42501', null,\n  'cart_items_increment is auth-gated'\n);/reset role;\nset local role anon;\nselect set_config('request.jwt.claims', '{\"role\":\"anon\"}', true);\n\nselect throws_ok(\n  \$\$select public.cart_items_increment(\n    '33333333-1111-4111-8111-111111111111'::uuid, 1\n  )\$\$,\n  '42501', null,\n  'cart_items_increment is auth-gated'\n);\n\nreset role;\nset local role authenticated;\nselect set_config('request.jwt.claims', '{\"sub\":\"22222222-2222-4222-8222-222222222222\",\"role\":\"authenticated\"}', true);/g" supabase/tests/phase_3_cart_items_rls.sql

sed -i -z "s/select throws_ok(\n  \$\$update public.cart_items set quantity = 99\n    where user_id = '11111111-1111-4111-8111-111111111111'\n    returning 1\$\$,\n  '42501', null,\n  'user B cannot update user A cart rows'\n);/select is_empty(\n  \$\$update public.cart_items set quantity = 99\n    where user_id = '11111111-1111-4111-8111-111111111111'\n    returning 1\$\$,\n  'user B cannot update user A cart rows'\n);/g" supabase/tests/phase_3_cart_items_rls.sql

# Fix phase_3_5_admin_rls.sql
# In test 3:
sed -i -z "s/select throws_ok(\n  \$\$update public.profiles set is_admin = true\n    where id = 'a1111111-1111-4111-9111-111111111111'\$\$,\n  '42501', null,\n  'a non-admin user cannot flip their own is_admin flag'\n);/select is_empty(\n  \$\$update public.profiles set is_admin = true\n    where id = 'a1111111-1111-4111-9111-111111111111' returning 1\$\$,\n  'a non-admin user cannot flip their own is_admin flag'\n);/g" supabase/tests/phase_3_5_admin_rls.sql
